import { Type } from '@google/genai'
import { getGeminiClient } from './gemini.js'
import { db } from './firestore.js'
import { recordPracticeCompletion } from './stats.js'
import { recordLessonPracticed } from './reviews.js'
import type {
  PracticeAnswerReveal,
  PracticeQuestion,
  PracticeQuestionDoc,
  PracticeSession,
  PracticeSessionDoc,
  PracticeSubmitResult,
} from '../types.js'

const MODEL = 'gemini-flash-latest'
const QUESTIONS_PER_PRACTICE_SESSION = 5
// Generated once per lesson and stored as a bank, so each attempt (first
// pass or later review) can serve a different random subset instead of the
// same fixed 5 questions every time.
const QUESTION_BANK_SIZE = 10
const MAX_DESCRIPTION_LENGTH = 1500
const MIN_VALID_QUESTIONS = 6

interface GeneratePracticeInput {
  lessonTitle: string
  lessonSummary: string
  videoTitle: string
  videoDescription: string
  keyRule?: string
}

interface RawPracticeQuestion {
  prompt?: unknown
  options?: unknown
  correctIndex?: unknown
  explanation?: unknown
}

interface ValidPracticeQuestion {
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

function isValidQuestion(q: RawPracticeQuestion): q is ValidPracticeQuestion {
  return (
    typeof q.prompt === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((option) => typeof option === 'string') &&
    typeof q.correctIndex === 'number' &&
    Number.isInteger(q.correctIndex) &&
    q.correctIndex >= 0 &&
    q.correctIndex < 4 &&
    typeof q.explanation === 'string'
  )
}

export class PracticeSessionNotFoundError extends Error {}
export class InvalidPracticeAnswersError extends Error {}

export async function generatePracticeSession(lessonId: string, input: GeneratePracticeInput): Promise<void> {
  const truncatedDescription = input.videoDescription.slice(0, MAX_DESCRIPTION_LENGTH)
  const keyRuleLine = input.keyRule
    ? `\nThis lesson's core rule, worth anchoring explanations to where relevant: "${input.keyRule}"`
    : ''

  const client = getGeminiClient()
  const response = await client.models.generateContent({
    model: MODEL,
    contents: `Generate exactly ${QUESTION_BANK_SIZE} scenario-based practice questions for this lesson. Base the correct action specifically on the habit or rule this lesson teaches (see the summary below) — not general internet-safety common sense.\n\nLesson title: ${input.lessonTitle}\nLesson summary: ${input.lessonSummary}\nVideo title: ${input.videoTitle}\nVideo description: ${truncatedDescription}${keyRuleLine}`,
    config: {
      systemInstruction:
        "You are an instructional designer creating short, gamified practice quizzes for a scam-prevention platform built for seniors, in the spirit of Duolingo but for real-world safety skills. The goal is not to test whether the learner remembers facts from the lesson — it's to test whether they'd make the right call in the moment, under pressure, weeks from now. " +
        'Write each question as a realistic, first-person scenario: a phone call, text, email, or in-person situation happening right now, described concretely with a plausible name, dollar amount, or other specific detail, and the exact kind of pressure a real scammer would apply. Then ask what the reader should do right now — never what a term means or why scammers do something. ' +
        "Each question has exactly 4 options with exactly one correct answer, which must be the specific action taught in the lesson. At least one wrong option must be a realistic near-miss — something that sounds like the safe move (for example, asking for a badge number, or calling back a number the caller just gave) but is actually still a mistake, so the question tests judgment rather than obvious-wrong-answer elimination. The remaining wrong options can be more clearly incorrect. " +
        "Write a one-sentence explanation of why the correct answer is right, and if there's a near-miss option, briefly note why it still falls short. " +
        'Keep each scenario vivid but brief (2-3 sentences), keep the tone warm and calm rather than frightening, and vary the setting (phone call, text, email, video call, in-person) across the questions instead of repeating the same setup. ' +
        'Vary which scenario you write first — do not always lead with a phone call about a family emergency.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['prompt', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
        required: ['questions'],
      },
    },
  })

  if (!response.text) {
    throw new Error('Gemini did not return a text response for practice generation')
  }

  const parsed = JSON.parse(response.text) as { questions?: RawPracticeQuestion[] }
  const validQuestions = (parsed.questions ?? []).filter(isValidQuestion)
  if (validQuestions.length < MIN_VALID_QUESTIONS) {
    throw new Error(`Only ${validQuestions.length} valid practice questions were generated for lesson ${lessonId}`)
  }

  const questions: PracticeQuestionDoc[] = validQuestions.map((q, index) => ({
    id: `q${index + 1}`,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }))

  await db
    .collection('practiceSessions')
    .doc(lessonId)
    .set({
      lessonId,
      questions,
      generatedAt: new Date().toISOString(),
      model: MODEL,
    } satisfies PracticeSessionDoc)
}

async function getPracticeSessionDoc(lessonId: string): Promise<PracticeSessionDoc | null> {
  const snap = await db.collection('practiceSessions').doc(lessonId).get()
  if (!snap.exists) return null
  return snap.data() as PracticeSessionDoc
}

// A composite id ("otherLessonId:q3") disambiguates a spliced-in interleaved
// question from a same-numbered question in the requested lesson's own bank
// (ids are only unique *within* a single lesson's bank, e.g. every lesson
// has a "q1"). A bare id ("q3") belongs to the requested lesson itself.
function parseQuestionId(compositeId: string, ownLessonId: string): { lessonId: string; questionId: string } {
  const separatorIndex = compositeId.indexOf(':')
  if (separatorIndex === -1) return { lessonId: ownLessonId, questionId: compositeId }
  return { lessonId: compositeId.slice(0, separatorIndex), questionId: compositeId.slice(separatorIndex + 1) }
}

function pickRandomSubset<T>(items: T[], count: number): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

// Picks one question from a different lesson's bank that this learner has
// already completed, for interleaving into a review session. Returns null
// if the learner doesn't have enough completed lessons yet, or the chosen
// lesson turns out to have no generated bank.
async function pickInterleavedQuestion(
  uid: string,
  ownLessonId: string,
): Promise<{ lessonId: string; question: PracticeQuestionDoc } | null> {
  const resultsSnap = await db.collection('users').doc(uid).collection('practiceResults').select().limit(6).get()
  const otherLessonIds = resultsSnap.docs.map((doc) => doc.id).filter((id) => id !== ownLessonId)
  if (otherLessonIds.length < 2) return null

  const candidateLessonId = otherLessonIds[Math.floor(Math.random() * otherLessonIds.length)]
  const candidateDoc = await getPracticeSessionDoc(candidateLessonId)
  if (!candidateDoc || candidateDoc.questions.length === 0) return null

  const question = candidateDoc.questions[Math.floor(Math.random() * candidateDoc.questions.length)]
  return { lessonId: candidateLessonId, question }
}

// `uid` is optional and only used to splice in one interleaved question from
// a different completed lesson — anonymous/unauthenticated callers (e.g. the
// lesson page checking whether a quiz exists at all) just get a same-lesson
// random subset.
export async function getPracticeSession(lessonId: string, uid?: string): Promise<PracticeSession | null> {
  const doc = await getPracticeSessionDoc(lessonId)
  if (!doc) return null

  const served =
    doc.questions.length <= QUESTIONS_PER_PRACTICE_SESSION
      ? [...doc.questions]
      : pickRandomSubset(doc.questions, QUESTIONS_PER_PRACTICE_SESSION)

  const questions: PracticeQuestion[] = served.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options }))

  if (uid) {
    const interleaved = await pickInterleavedQuestion(uid, lessonId)
    if (interleaved && questions.length > 0) {
      const replaceIndex = questions.length - 1
      questions[replaceIndex] = {
        id: `${interleaved.lessonId}:${interleaved.question.id}`,
        prompt: interleaved.question.prompt,
        options: interleaved.question.options,
      }
    }
  }

  return { lessonId, questions }
}

export async function getQuestionAnswer(lessonId: string, questionId: string): Promise<PracticeAnswerReveal | null> {
  const { lessonId: bankLessonId, questionId: bareId } = parseQuestionId(questionId, lessonId)
  const doc = await getPracticeSessionDoc(bankLessonId)
  const question = doc?.questions.find((q) => q.id === bareId)
  if (!question) return null
  return { correctIndex: question.correctIndex, explanation: question.explanation }
}

export async function submitPracticeAnswers(
  uid: string,
  lessonId: string,
  answers: { questionId: string; answerIndex: number }[],
): Promise<PracticeSubmitResult> {
  const session = await getPracticeSessionDoc(lessonId)
  if (!session) throw new PracticeSessionNotFoundError(`No practice session for lesson ${lessonId}`)

  // Most answers resolve against this lesson's own bank; at most one
  // (an interleaved question) may resolve against a different lesson's bank
  // — fetched lazily and cached so a foreign lesson is only read once.
  const foreignDocs = new Map<string, PracticeSessionDoc | null>()
  async function resolveQuestion(compositeId: string): Promise<PracticeQuestionDoc | undefined> {
    const { lessonId: bankLessonId, questionId: bareId } = parseQuestionId(compositeId, lessonId)
    if (bankLessonId === lessonId) return session!.questions.find((q) => q.id === bareId)
    if (!foreignDocs.has(bankLessonId)) foreignDocs.set(bankLessonId, await getPracticeSessionDoc(bankLessonId))
    return foreignDocs.get(bankLessonId)?.questions.find((q) => q.id === bareId)
  }

  const resolved = await Promise.all(answers.map((a) => resolveQuestion(a.questionId)))
  const isValidAnswers =
    resolved.length > 0 &&
    resolved.every(
      (question, index) =>
        question !== undefined &&
        Number.isInteger(answers[index].answerIndex) &&
        answers[index].answerIndex >= 0 &&
        answers[index].answerIndex < question.options.length,
    )
  if (!isValidAnswers) {
    throw new InvalidPracticeAnswersError('answers must reference valid questions with a valid option index each')
  }

  const correctCount = resolved.reduce(
    (count, question, index) => count + (answers[index].answerIndex === question!.correctIndex ? 1 : 0),
    0,
  )
  const totalQuestions = answers.length

  const result = await recordPracticeCompletion(uid, lessonId, correctCount, totalQuestions)

  // Separate from first-completion XP/streak above: if this submission was a
  // *due* spaced review, record it on the review ladder and fold its bonus
  // into the response so the existing result screen shows it automatically.
  const reviewResult = await recordLessonPracticed(uid, lessonId, correctCount, totalQuestions)
  if (reviewResult) {
    result.xpEarned += reviewResult.xpEarned
    result.stats.xp = reviewResult.xp
  }

  return result
}

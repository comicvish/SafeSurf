import { getClaudeClient } from './claude.js'
import { db } from './firestore.js'
import { recordPracticeCompletion } from './stats.js'
import type { PracticeQuestionDoc, PracticeSession, PracticeSessionDoc, PracticeSubmitResult } from '../types.js'

const MODEL = 'claude-opus-4-8'
const QUESTIONS_PER_PRACTICE_SESSION = 5
const MAX_DESCRIPTION_LENGTH = 1500
const MIN_VALID_QUESTIONS = 3

interface GeneratePracticeInput {
  lessonTitle: string
  lessonSummary: string
  videoTitle: string
  videoDescription: string
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

export async function generatePracticeSession(lessonId: string, input: GeneratePracticeInput): Promise<void> {
  const truncatedDescription = input.videoDescription.slice(0, MAX_DESCRIPTION_LENGTH)

  const client = getClaudeClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      'You are an instructional designer creating short, gamified practice quizzes for an educational video platform, in the spirit of Khan Academy and Duolingo. Write clear, encouraging multiple-choice questions that test understanding of the concepts covered, not trivia about the video itself. Each question has exactly 4 options with exactly one correct answer, and a one-sentence explanation of why the correct answer is right. Keep questions and options concise.',
    messages: [
      {
        role: 'user',
        content: `Generate exactly ${QUESTIONS_PER_PRACTICE_SESSION} multiple-choice practice questions for this lesson.\n\nLesson title: ${input.lessonTitle}\nLesson summary: ${input.lessonSummary}\nVideo title: ${input.videoTitle}\nVideo description: ${truncatedDescription}`,
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correctIndex: { type: 'integer' },
                  explanation: { type: 'string' },
                },
                required: ['prompt', 'options', 'correctIndex', 'explanation'],
                additionalProperties: false,
              },
            },
          },
          required: ['questions'],
          additionalProperties: false,
        },
      },
    },
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude did not return a text response for practice generation')
  }

  const parsed = JSON.parse(textBlock.text) as { questions?: RawPracticeQuestion[] }
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

export async function getPracticeSession(lessonId: string): Promise<PracticeSession | null> {
  const snap = await db.collection('practiceSessions').doc(lessonId).get()
  if (!snap.exists) return null
  const data = snap.data() as PracticeSessionDoc
  return { lessonId, questions: data.questions }
}

export async function submitPracticeAnswers(uid: string, lessonId: string, answers: number[]): Promise<PracticeSubmitResult> {
  const session = await getPracticeSession(lessonId)
  if (!session) throw new PracticeSessionNotFoundError(`No practice session for lesson ${lessonId}`)

  const correctCount = session.questions.reduce(
    (count, question, index) => count + (answers[index] === question.correctIndex ? 1 : 0),
    0,
  )

  return recordPracticeCompletion(uid, lessonId, correctCount, session.questions.length)
}

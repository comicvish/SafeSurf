import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPracticeSession, getQuestionAnswer, submitPractice } from '../lib/api'
import type { PracticeAnswerReveal, PracticeSession, PracticeSubmitResult } from '../lib/types'
import { useStats } from '../lib/statsContext'

function encouragement(score: number, total: number): string {
  const ratio = score / total
  if (ratio === 1) return 'Perfect score! 🎉'
  if (ratio >= 0.8) return 'Excellent work!'
  if (ratio >= 0.5) return 'Nice work — keep going!'
  return 'Keep practicing — you’ll get it!'
}

export default function Practice() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { refreshStats } = useStats()

  const [session, setSession] = useState<PracticeSession | null | undefined>(undefined)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [reveals, setReveals] = useState<Record<string, PracticeAnswerReveal>>({})
  const [revealError, setRevealError] = useState<string | null>(null)
  const [result, setResult] = useState<PracticeSubmitResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) return
    setSession(undefined)
    getPracticeSession(lessonId)
      .then(setSession)
      .catch(() => setSession(null))
  }, [lessonId])

  if (session === undefined) return <main className="page-status">Loading practice…</main>
  if (!session) {
    return (
      <main className="page-status practice-unavailable">
        <p>No practice quiz is available for this lesson yet.</p>
        {lessonId && <Link to={`/lessons/${lessonId}`}>&larr; Back to lesson</Link>}
      </main>
    )
  }

  const total = session.questions.length

  const handleFinish = async (finalAnswers: number[]) => {
    if (!lessonId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const submitted = await submitPractice(lessonId, finalAnswers)
      setResult(submitted)
      await refreshStats()
    } catch {
      setSubmitError('Could not submit your results. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTryAgain = () => {
    setCurrentIndex(0)
    setAnswers([])
    setResult(null)
    setSubmitError(null)
  }

  if (result) {
    return (
      <main className="practice-page section-shell">
        <section className="practice-result">
          <p className="eyebrow">
            <span></span>Practice complete
          </p>
          <h1>{encouragement(result.score, result.totalQuestions)}</h1>
          <p className="practice-score">
            {result.score} / {result.totalQuestions} correct
          </p>
          <div className="practice-result-stats">
            <div className="practice-stat">
              <strong>+{result.xpEarned}</strong>
              <span>XP earned</span>
            </div>
            <div className="practice-stat">
              <strong>🔥 {result.stats.currentStreak}</strong>
              <span>day streak</span>
            </div>
            <div className="practice-stat">
              <strong>{result.stats.xp}</strong>
              <span>total XP</span>
            </div>
          </div>
          <div className="practice-result-actions">
            <button className="button button-primary" onClick={handleTryAgain}>
              Try again
            </button>
            <Link className="button" to={`/lessons/${session.lessonId}`}>
              Back to lesson
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const question = session.questions[currentIndex]
  const selected = answers[currentIndex]
  const hasAnswered = selected !== undefined
  const isLastQuestion = currentIndex === total - 1
  const reveal = reveals[question.id]

  const handleSelect = (optionIndex: number) => {
    if (hasAnswered || !lessonId) return
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = optionIndex
      return next
    })
    setRevealError(null)
    getQuestionAnswer(lessonId, question.id)
      .then((answer) => setReveals((prev) => ({ ...prev, [question.id]: answer })))
      .catch(() => setRevealError('Could not load the explanation for this question, but you can still continue.'))
  }

  const handleContinue = () => {
    if (isLastQuestion) {
      void handleFinish(answers)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  return (
    <main className="practice-page section-shell">
      <p className="eyebrow">
        <span></span>Question {currentIndex + 1} of {total}
      </p>
      <div className="practice-progress">
        <div className="practice-progress-bar" style={{ width: `${(currentIndex / total) * 100}%` }} />
      </div>

      <h1 className="practice-question">{question.prompt}</h1>

      <div className="practice-options">
        {question.options.map((option, index) => {
          let state = ''
          if (hasAnswered) {
            if (reveal) {
              if (index === reveal.correctIndex) state = 'correct'
              else if (index === selected) state = 'incorrect'
              else state = 'dimmed'
            } else if (index === selected) {
              state = 'selected'
            }
          }
          return (
            <button
              key={index}
              className={`practice-option ${state}`.trim()}
              onClick={() => handleSelect(index)}
              disabled={hasAnswered}
            >
              {option}
            </button>
          )
        })}
      </div>

      {hasAnswered && (
        <div className="practice-feedback">
          {reveal ? (
            <p>{reveal.explanation}</p>
          ) : revealError ? (
            <p className="auth-error">{revealError}</p>
          ) : (
            <p>Checking your answer…</p>
          )}
          {submitError && <p className="auth-error">{submitError}</p>}
          <button
            className="button button-primary"
            onClick={handleContinue}
            disabled={submitting || (!reveal && !revealError)}
          >
            {submitting ? 'Submitting…' : isLastQuestion ? 'See results' : 'Next question'}
          </button>
        </div>
      )}
    </main>
  )
}

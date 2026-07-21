import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPracticeSession, getQuestionAnswer, submitPractice } from '../lib/api'
import type { PracticeAnswerReveal, PracticeSession, PracticeSubmitResult } from '../lib/types'
import { useStats } from '../lib/statsContext'

function encouragement(score: number, total: number): string {
  const ratio = score / total
  if (ratio === 1) return 'Perfect score!'
  if (ratio >= 0.8) return 'Excellent work!'
  if (ratio >= 0.5) return 'Nice work — keep going!'
  return "This one's worth another look."
}

export default function Practice() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { refreshStats } = useStats()

  const [session, setSession] = useState<PracticeSession | null | undefined>(undefined)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [reveals, setReveals] = useState<Record<string, PracticeAnswerReveal>>({})
  const [revealError, setRevealError] = useState<string | null>(null)
  const [revealSkipped, setRevealSkipped] = useState(false)
  const [result, setResult] = useState<PracticeSubmitResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const questionHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!lessonId) return
    let active = true
    setSession(undefined)
    setCurrentIndex(0)
    setAnswers([])
    setReveals({})
    setRevealError(null)
    setRevealSkipped(false)
    setResult(null)
    setSubmitError(null)
    getPracticeSession(lessonId)
      .then((session) => {
        if (active) setSession(session)
      })
      .catch(() => {
        if (active) setSession(null)
      })
    return () => {
      active = false
    }
  }, [lessonId])

  useEffect(() => {
    questionHeadingRef.current?.focus()
  }, [currentIndex])

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

  const loadReveal = (id: string, questionId: string) => {
    setRevealError(null)
    getQuestionAnswer(id, questionId)
      .then((answer) => setReveals((prev) => ({ ...prev, [questionId]: answer })))
      .catch(() => setRevealError('Could not check your answer.'))
  }

  const handleFinish = async (finalAnswers: number[]) => {
    if (!lessonId || !session) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = session.questions.map((q, index) => ({ questionId: q.id, answerIndex: finalAnswers[index] }))
      const submitted = await submitPractice(lessonId, payload)
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
    const ratio = result.score / result.totalQuestions
    const primaryAction = (
      <button className="button button-primary" onClick={handleTryAgain}>
        Try again
      </button>
    )
    const secondaryAction = (
      <Link className="button" to={`/lessons/${session.lessonId}`}>
        Back to lesson
      </Link>
    )

    return (
      <main className="practice-page section-shell">
        <section className="practice-result">
          <p className="eyebrow">
            <span aria-hidden="true"></span>Practice complete
          </p>
          <h1>{encouragement(result.score, result.totalQuestions)}</h1>
          <p className="practice-score">
            {result.score} / {result.totalQuestions} correct
          </p>
          {ratio < 0.5 && (
            <p className="practice-result-nudge">
              Consider rewatching the lesson before trying again — this material is worth getting comfortable with.
            </p>
          )}
          <div className="practice-result-stats">
            <div className="practice-stat">
              <strong>+{result.xpEarned}</strong>
              <span>XP earned</span>
            </div>
            <div className="practice-stat">
              <strong>{result.stats.currentStreak}</strong>
              <span>day streak</span>
            </div>
            <div className="practice-stat">
              <strong>{result.stats.xp}</strong>
              <span>total XP</span>
            </div>
          </div>
          <div className="practice-result-actions">
            {ratio < 0.5 ? (
              <>
                {secondaryAction}
                {primaryAction}
              </>
            ) : (
              <>
                {primaryAction}
                {secondaryAction}
              </>
            )}
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
  const progress = ((currentIndex + (hasAnswered ? 1 : 0)) / total) * 100

  const handleSelect = (optionIndex: number) => {
    if (hasAnswered || !lessonId) return
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = optionIndex
      return next
    })
    setRevealSkipped(false)
    loadReveal(lessonId, question.id)
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
        <span aria-hidden="true"></span>Question {currentIndex + 1} of {total}
      </p>
      <div className="practice-progress">
        <div className="practice-progress-bar" style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      <h1 className="practice-question" ref={questionHeadingRef} tabIndex={-1}>
        {question.prompt}
      </h1>

      <div className="practice-options" role="radiogroup" aria-label={`Question ${currentIndex + 1} options`}>
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
              role="radio"
              aria-checked={index === selected}
            >
              <span className="practice-option-icon" aria-hidden="true">
                {state === 'correct' ? '✓' : state === 'incorrect' ? '✕' : ''}
              </span>
              <span>
                {option}
                {state === 'correct' && <span className="sr-only"> — correct answer</span>}
                {state === 'incorrect' && <span className="sr-only"> — your answer, incorrect</span>}
              </span>
            </button>
          )
        })}
      </div>

      {hasAnswered && (
        <div className="practice-feedback" aria-live="polite">
          {reveal ? (
            <p>{reveal.explanation}</p>
          ) : revealError ? (
            <div className="practice-feedback-error">
              <p className="auth-error" role="alert">
                {revealError}
              </p>
              <div className="practice-feedback-error-actions">
                <button className="button" onClick={() => lessonId && loadReveal(lessonId, question.id)}>
                  Try again
                </button>
                {!revealSkipped && (
                  <button className="text-link" onClick={() => setRevealSkipped(true)}>
                    Skip — I'll find out later
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p role="status">Checking your answer…</p>
          )}
          {submitError && (
            <p className="auth-error" role="alert">
              {submitError}
            </p>
          )}
          <button
            className="button button-primary"
            onClick={handleContinue}
            disabled={submitting || (!reveal && !revealSkipped)}
          >
            {submitting ? 'Submitting…' : isLastQuestion ? 'See results' : 'Next question'}
          </button>
        </div>
      )}
    </main>
  )
}

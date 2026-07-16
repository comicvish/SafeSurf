import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './authContext'
import { getProgress, setLessonComplete as setLessonCompleteRequest } from './api'

interface ProgressContextValue {
  completedLessonIds: Set<string>
  isComplete: (lessonId: string) => boolean
  toggleComplete: (lessonId: string) => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setCompletedLessonIds(new Set())
      return
    }
    getProgress()
      .then((data) => setCompletedLessonIds(new Set(data.completedLessonIds)))
      .catch(() => setCompletedLessonIds(new Set()))
  }, [user])

  const toggleComplete = async (lessonId: string) => {
    if (!user) return
    const nextCompleted = !completedLessonIds.has(lessonId)
    setCompletedLessonIds((prev) => {
      const next = new Set(prev)
      if (nextCompleted) next.add(lessonId)
      else next.delete(lessonId)
      return next
    })
    await setLessonCompleteRequest(lessonId, nextCompleted)
  }

  return (
    <ProgressContext.Provider
      value={{ completedLessonIds, isComplete: (id) => completedLessonIds.has(id), toggleComplete }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}

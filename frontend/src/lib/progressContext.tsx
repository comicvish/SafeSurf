import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './authContext'
import { getProgress, setLessonComplete as setLessonCompleteRequest } from './api'

interface ProgressContextValue {
  completedLessonIds: Set<string>
  isComplete: (lessonId: string) => boolean
  toggleComplete: (lessonId: string) => Promise<boolean>
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

  const toggleComplete = async (lessonId: string): Promise<boolean> => {
    if (!user) return false
    const nextCompleted = !completedLessonIds.has(lessonId)
    setCompletedLessonIds((prev) => {
      const next = new Set(prev)
      if (nextCompleted) next.add(lessonId)
      else next.delete(lessonId)
      return next
    })
    try {
      await setLessonCompleteRequest(lessonId, nextCompleted)
      return true
    } catch {
      // Request failed — roll back the optimistic update so the UI doesn't
      // claim a state the server never actually saved.
      setCompletedLessonIds((prev) => {
        const next = new Set(prev)
        if (nextCompleted) next.delete(lessonId)
        else next.add(lessonId)
        return next
      })
      return false
    }
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

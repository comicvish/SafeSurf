import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './authContext'
import { getStats } from './api'
import type { UserStats } from './types'

const DEFAULT_STATS: UserStats = { xp: 0, currentStreak: 0, longestStreak: 0 }

interface StatsContextValue {
  stats: UserStats
  refreshStats: () => Promise<void>
}

const StatsContext = createContext<StatsContextValue | null>(null)

export function StatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)

  useEffect(() => {
    if (!user) {
      setStats(DEFAULT_STATS)
      return
    }
    getStats()
      .then(setStats)
      .catch(() => setStats(DEFAULT_STATS))
  }, [user])

  const refreshStats = async () => {
    if (!user) {
      setStats(DEFAULT_STATS)
      return
    }
    try {
      setStats(await getStats())
    } catch {
      setStats(DEFAULT_STATS)
    }
  }

  return <StatsContext.Provider value={{ stats, refreshStats }}>{children}</StatsContext.Provider>
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats must be used within StatsProvider')
  return ctx
}

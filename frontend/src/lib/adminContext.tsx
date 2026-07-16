import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './authContext'
import { checkIsAdmin } from './api'

interface AdminContextValue {
  isAdmin: boolean
  loading: boolean
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to settle first — otherwise `user` is still its initial
    // `null` before the real session loads, and this would decide "not an
    // admin" before the real check ever runs.
    if (authLoading) return
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    setLoading(true)
    checkIsAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  return <AdminContext.Provider value={{ isAdmin, loading }}>{children}</AdminContext.Provider>
}

export function useIsAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useIsAdmin must be used within AdminProvider')
  return ctx
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './authContext'
import { checkIsAdmin } from './api'

interface AdminContextValue {
  isAdmin: boolean
  loading: boolean
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    setLoading(true)
    checkIsAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false))
  }, [user])

  return <AdminContext.Provider value={{ isAdmin, loading }}>{children}</AdminContext.Provider>
}

export function useIsAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useIsAdmin must be used within AdminProvider')
  return ctx
}

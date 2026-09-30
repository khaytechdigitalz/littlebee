import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../services/api'
import { me } from '../services/auth'

/** Gates /app/* — just checks a token is present; the API itself is the real enforcement point. */
export function RequireAuth() {
  const token = getToken()
  if (!token) return <Navigate to="/auth/login" replace />
  return <Outlet />
}

/** Gates /admin/* — confirms the token belongs to an admin before rendering anything. */
export function RequireAdmin() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking')

  useEffect(() => {
    if (!getToken()) {
      setStatus('denied')
      return
    }
    me()
      .then((user) => setStatus(user.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => setStatus('denied'))
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center text-slate-500 text-sm">
        Checking admin access…
      </div>
    )
  }
  if (status === 'denied') return <Navigate to="/auth/login" replace />
  return <Outlet />
}

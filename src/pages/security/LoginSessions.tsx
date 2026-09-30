import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Button } from '../../components/ui'
import { listSessions, revokeSession, revokeAllSessions } from '../../services/profile'
import { normalizeError } from '../../services/api'
import { ChevronLeft, Laptop, Smartphone, LogOut, Loader2 } from 'lucide-react'

interface Session {
  id: number
  deviceType: string | null
  location: string | null
  ipAddress: string
  isCurrent: boolean
  lastActive: string
}

export default function LoginSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | 'all' | null>(null)

  const load = () => {
    setLoading(true)
    listSessions()
      .then(setSessions)
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleRevoke = async (id: number) => {
    setBusyId(id)
    try {
      await revokeSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setBusyId(null)
    }
  }

  const handleRevokeAll = async () => {
    setBusyId('all')
    try {
      await revokeAllSessions()
      load()
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/app/security" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
        <ChevronLeft size={16} /> Back to security
      </Link>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card
        title="Active sessions"
        action={
          <button
            onClick={handleRevokeAll}
            disabled={busyId === 'all'}
            className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            <LogOut size={13} /> Log out all other devices
          </button>
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No session history yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isMobile = (s.deviceType ?? '').toLowerCase().match(/ios|android|mobile/)
              const Icon = isMobile ? Smartphone : Laptop
              return (
                <div key={s.id} className="flex items-center justify-between text-sm py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-base-bg border border-base-border flex items-center justify-center text-slate-400">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-slate-100 flex items-center gap-2">
                        {s.deviceType ?? 'Unknown device'} {s.isCurrent && <Badge tone="positive">This device</Badge>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.location ?? 'Unknown location'} · {s.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{new Date(s.lastActive).toLocaleString()}</p>
                    {!s.isCurrent && (
                      <button
                        onClick={() => handleRevoke(s.id)}
                        disabled={busyId === s.id}
                        className="text-xs text-red-400 hover:text-red-300 mt-0.5 disabled:opacity-50"
                      >
                        {busyId === s.id ? 'Logging out…' : 'Log out'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

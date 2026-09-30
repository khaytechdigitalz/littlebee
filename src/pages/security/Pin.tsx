import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../../components/ui'
import { me, setTransactionPin, verifyTransactionPin } from '../../services/auth'
import { normalizeError } from '../../services/api'
import { ChevronLeft, Check } from 'lucide-react'

function PinInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1.5">{label}</p>
      <div className="relative w-fit">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-10 h-11 rounded-lg bg-base-bg border border-base-border flex items-center justify-center text-lg">
              {value[i] ? '•' : ''}
            </div>
          ))}
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          inputMode="numeric"
          className="absolute inset-0 opacity-0 cursor-text"
          aria-label={label}
        />
      </div>
    </div>
  )
}

export default function Pin() {
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [current, setCurrent] = useState('')
  const [currentVerified, setCurrentVerified] = useState(false)
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    me().then((u) => setHasPin(u.hasTransactionPin)).catch(() => setHasPin(false))
  }, [])

  const verifyCurrent = async () => {
    setError('')
    try {
      const res = await verifyTransactionPin(current)
      if (res.valid) setCurrentVerified(true)
      else setError('Incorrect current PIN')
    } catch (err) {
      setError(normalizeError(err).message)
    }
  }

  const submit = async () => {
    setError('')
    setSuccess(false)
    if (next.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }
    if (next !== confirm) {
      setError('PINs do not match')
      return
    }
    setSubmitting(true)
    try {
      await setTransactionPin(next)
      setSuccess(true)
      setHasPin(true)
      setMode('view')
      setCurrent('')
      setCurrentVerified(false)
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <Link to="/app/security" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
        <ChevronLeft size={16} /> Back to security
      </Link>

      <Card title="Transaction PIN">
        <p className="text-xs text-slate-500 mb-4">This 4–6 digit PIN is required to confirm withdrawals and trade executions.</p>

        {success && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 mb-3">
            <Check size={13} /> PIN saved
          </p>
        )}
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {hasPin === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : mode === 'view' ? (
          <Button onClick={() => setMode('edit')}>{hasPin ? 'Change PIN' : 'Set PIN'}</Button>
        ) : (
          <div className="space-y-4">
            {hasPin && !currentVerified && (
              <>
                <PinInput value={current} onChange={setCurrent} label="Current PIN" />
                <Button variant="ghost" onClick={verifyCurrent} disabled={current.length < 4}>
                  Verify current PIN
                </Button>
              </>
            )}

            {(!hasPin || currentVerified) && (
              <>
                <PinInput value={next} onChange={setNext} label="New PIN" />
                <PinInput value={confirm} onChange={setConfirm} label="Confirm new PIN" />
                <div className="flex gap-3">
                  <Button onClick={submit} disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save PIN'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMode('view')
                      setCurrent('')
                      setCurrentVerified(false)
                      setNext('')
                      setConfirm('')
                      setError('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

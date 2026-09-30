import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Field, Button } from '../../components/ui'
import { changePassword } from '../../services/auth'
import { normalizeError } from '../../services/api'
import { ChevronLeft, Check } from 'lucide-react'

export default function Password() {
  const [current, setCurrent] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'][strength]

  const submit = async () => {
    setError('')
    setSuccess(false)
    if (pw !== confirm) {
      setError('New passwords do not match')
      return
    }
    if (pw.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    setSubmitting(true)
    try {
      await changePassword(current, pw)
      setSuccess(true)
      setCurrent('')
      setPw('')
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

      <Card title="Update password">
        <div className="space-y-3">
          <Field label="Current password" type="password" placeholder="••••••••" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Field label="New password" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />
          {pw.length > 0 && (
            <div>
              <div className="h-1.5 rounded-full bg-base-bg overflow-hidden flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex-1 rounded-full ${i <= strength ? strengthColor : 'bg-base-border'}`} />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{strengthLabel}</p>
            </div>
          )}
          <Field label="Confirm new password" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check size={13} /> Password updated
            </p>
          )}

          <Button onClick={submit} disabled={submitting || !current || !pw}>
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

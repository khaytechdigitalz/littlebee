import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Field, Button, Badge } from '../components/ui'
import { getProfile, updateProfile } from '../services/profile'
import { normalizeError } from '../services/api'
import { ChevronRight, Check, Loader2 } from 'lucide-react'

export default function Profile() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile()
      .then((u) => {
        setFullName(u.fullName)
        setEmail(u.email)
        setCountry(u.country ?? '')
        setIsVerified(u.isVerified)
      })
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await updateProfile({ fullName, country })
      setSuccess(true)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading profile…
        </p>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card title="Personal information">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Display name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Field label="Email" value={email} disabled className="opacity-60" />
          <Field label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Not set" />
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        {success && (
          <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1.5">
            <Check size={13} /> Saved
          </p>
        )}

        <Button className="mt-4" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Card>

      <Link to="/app/kyc">
        <Card className="flex items-center justify-between hover:border-accent/40 transition">
          <div>
            <p className="text-sm font-medium">Identity verification (KYC)</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isVerified ? 'Verified — you can raise your limits further with additional tiers' : 'Not verified yet'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge tone={isVerified ? 'positive' : 'neutral'}>{isVerified ? 'Verified' : 'Unverified'}</Badge>
            <ChevronRight size={16} className="text-slate-600" />
          </div>
        </Card>
      </Link>
    </div>
  )
}

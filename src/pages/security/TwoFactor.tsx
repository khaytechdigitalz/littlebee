import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Field, Button, Badge } from '../../components/ui'
import { me, setup2fa, verify2fa } from '../../services/auth'
import { normalizeError } from '../../services/api'
import { ChevronLeft } from 'lucide-react'

export default function TwoFactor() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verified, setVerified] = useState<null | boolean>(null)
  const [loadingSetup, setLoadingSetup] = useState(false)

  useEffect(() => {
    me().then((u) => setEnabled(u.is2faEnabled)).catch(() => setEnabled(false))
  }, [])

  const beginSetup = async () => {
    setLoadingSetup(true)
    setError('')
    try {
      const data = await setup2fa()
      setSetupData(data)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setLoadingSetup(false)
    }
  }

  const confirmCode = async () => {
    setError('')
    try {
      const res = await verify2fa(code)
      setVerified(res.valid)
      if (res.enabled) {
        setEnabled(true)
        setSetupData(null)
        setCode('')
      }
    } catch (err) {
      setError(normalizeError(err).message)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <Link to="/app/security" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
        <ChevronLeft size={16} /> Back to security
      </Link>

      <Card title="Google Authenticator">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm">Two-factor authentication</p>
            <p className="text-xs text-slate-500">Adds an extra layer of security at login and withdrawal</p>
          </div>
          {enabled !== null && <Badge tone={enabled ? 'positive' : 'neutral'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>}
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {enabled === null ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : enabled ? (
          <p className="text-xs text-slate-500">
            2FA is active on your account. To rotate your secret, contact support — disabling here isn't available yet
            to avoid accidental lockouts.
          </p>
        ) : !setupData ? (
          <Button onClick={beginSetup} disabled={loadingSetup}>
            {loadingSetup ? 'Generating…' : 'Set up 2FA'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-center bg-base-bg border border-base-border rounded-xl p-4">
              <img src={setupData.qrCodeDataUrl} alt="2FA QR code" className="w-28 h-28 rounded-lg bg-white p-1" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Secret key (if you can't scan)</p>
                <p className="text-xs font-mono bg-base-panel border border-base-border rounded-lg px-2 py-1.5 break-all">{setupData.secret}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">Scan the QR code with Google Authenticator, then enter the 6-digit code it shows:</p>
            <div className="flex gap-2">
              <Field label="" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" className="flex-1" />
              <Button onClick={confirmCode} disabled={code.length !== 6}>
                Verify &amp; enable
              </Button>
            </div>
            {verified === false && <p className="text-xs text-red-400">Invalid code — try again.</p>}
          </div>
        )}
      </Card>
    </div>
  )
}

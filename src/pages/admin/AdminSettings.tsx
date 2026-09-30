import { useEffect, useState } from 'react'
import { Card, Field, Button, Badge } from '../../components/ui'
import { getSettings, updateSetting, testWebhook } from '../../services/admin'

const KNOWN_KEYS = [
  { key: 'site_name', label: 'Site name' },
  { key: 'support_email', label: 'Support email' },
  { key: 'default_demo_balance', label: 'Default demo balance (USD)' },
  { key: 'maintenance_mode', label: 'Maintenance mode', bool: true },
  { key: 'allow_registrations', label: 'Allow new registrations', bool: true },
  { key: 'kyc_required_for_withdrawal', label: 'Require KYC for withdrawals', bool: true },
  { key: 'coinremitter_auto_withdraw_enabled', label: 'Auto-approve crypto withdrawals', bool: true },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [webhookResult, setWebhookResult] = useState<{ message: string; configuredCoins: string[] } | null>(null)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => setError(err.message || 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const save = async (key: string, value: string) => {
    setSaving(key)
    try {
      await updateSetting(key, value)
      setSettings((prev) => ({ ...prev, [key]: value }))
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  const runWebhookTest = async () => {
    const result = await testWebhook().catch((err) => {
      setError(err.message || 'Webhook test failed')
      return null
    })
    if (result) setWebhookResult(result)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold">System settings</h1>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card title="General">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading…</p>
        ) : (
          <div className="space-y-4">
            {KNOWN_KEYS.map(({ key, label, bool }) => (
              <div key={key}>
                {bool ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{label}</span>
                    <button
                      onClick={() => save(key, settings[key] === 'true' ? 'false' : 'true')}
                      disabled={saving === key}
                      className={`w-11 h-6 rounded-full transition relative ${
                        settings[key] === 'true' ? 'bg-accent' : 'bg-base-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${
                          settings[key] === 'true' ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <Field
                      label={label}
                      value={settings[key] ?? ''}
                      onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button variant="ghost" onClick={() => save(key, settings[key] ?? '')} disabled={saving === key}>
                      Save
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Coinremitter webhook">
        <p className="text-xs text-slate-500 mb-3">
          Live endpoint: <code className="text-slate-300">/api/webhooks/coinremitter</code> — configured per-coin via
          environment variables on the backend, not editable here (credentials never pass through the browser).
        </p>
        <Button variant="ghost" onClick={runWebhookTest}>
          Test webhook configuration
        </Button>
        {webhookResult && (
          <div className="mt-3 bg-base-bg border border-base-border rounded-lg p-3 text-sm">
            <p>{webhookResult.message}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {webhookResult.configuredCoins.map((c) => (
                <Badge key={c} tone="positive">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge } from '../components/ui'
import { me, type AuthUser } from '../services/auth'
import { KeyRound, Lock, ShieldCheck, Monitor, ChevronRight } from 'lucide-react'

export default function Security() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    me().then(setUser).catch(() => setUser(null))
  }, [])

  const modules = [
    { to: '/app/security/password', icon: Lock, title: 'Password', desc: 'Update your login credentials', status: null },
    {
      to: '/app/security/pin',
      icon: KeyRound,
      title: 'Transaction PIN',
      desc: 'Required to confirm withdrawals and trade executions',
      status: user ? { label: user.hasTransactionPin ? 'Set' : 'Not set', tone: user.hasTransactionPin ? ('positive' as const) : ('neutral' as const) } : null,
    },
    {
      to: '/app/security/2fa',
      icon: ShieldCheck,
      title: 'Google 2FA',
      desc: 'App-based two-factor authentication',
      status: user ? { label: user.is2faEnabled ? 'Enabled' : 'Disabled', tone: user.is2faEnabled ? ('positive' as const) : ('neutral' as const) } : null,
    },
    { to: '/app/security/sessions', icon: Monitor, title: 'Login sessions', desc: 'Devices and locations signed in to your account', status: null },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {modules.map(({ to, icon: Icon, title, desc, status }) => (
        <Link key={to} to={to}>
          <Card className="flex items-center justify-between hover:border-accent/40 transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-base-bg border border-base-border flex items-center justify-center text-slate-300">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {status && <Badge tone={status.tone}>{status.label}</Badge>}
              <ChevronRight size={16} className="text-slate-600" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

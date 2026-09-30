import { useEffect, useState } from 'react'
import { Card, Badge } from '../../components/ui'
import { getDashboardSummary, getOpenPositions } from '../../services/admin'
import { Users, TrendingUp, ArrowDownToLine, ArrowUpFromLine, DollarSign } from 'lucide-react'

interface Summary {
  totalUsers: number
  openTrades: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalUsdBalance: number
}

interface OpenPosition {
  id: number
  symbol: string
  tradeType: 'long' | 'short'
  positionSize: string
  entryPrice: string
  status: string
  user?: { fullName: string; email: string }
}

export default function AdminDashboard() {
  const [mode, setMode] = useState<'live' | 'demo'>('live')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [positions, setPositions] = useState<OpenPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([getDashboardSummary(mode), getOpenPositions(mode)])
      .then(([summaryRes, positionsRes]) => {
        if (cancelled) return
        setSummary(summaryRes)
        setPositions(positionsRes)
      })
      .catch((err) => !cancelled && setError(err.message || 'Failed to load dashboard'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [mode])

  const cards = summary
    ? [
        { label: 'Total users', value: summary.totalUsers.toLocaleString(), icon: Users },
        { label: 'Open trades', value: summary.openTrades.toLocaleString(), icon: TrendingUp },
        { label: 'Pending deposits', value: summary.pendingDeposits.toLocaleString(), icon: ArrowDownToLine },
        { label: 'Pending withdrawals', value: summary.pendingWithdrawals.toLocaleString(), icon: ArrowUpFromLine },
        { label: 'Total USD balance', value: `$${summary.totalUsdBalance.toLocaleString()}`, icon: DollarSign },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
          {(['live', 'demo'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize transition ${
                mode === m ? 'bg-accent text-black' : 'text-slate-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-slate-500 mt-1">
            Make sure the backend is running and VITE_API_BASE_URL points to it.
          </p>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <Icon size={16} className="text-accent mb-2" />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </Card>
            ))}
          </div>

          <Card title={`Open positions (${mode})`}>
            <p className="text-xs text-slate-500 -mt-2 mb-3">
              Read-only — prices and PnL come from the live market feed. There is no action here to set or change a
              trade's outcome.
            </p>
            {positions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No open positions right now.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-base-border">
                      <th className="pb-2 px-1 font-normal">User</th>
                      <th className="pb-2 px-1 font-normal">Symbol</th>
                      <th className="pb-2 px-1 font-normal">Side</th>
                      <th className="pb-2 px-1 font-normal">Size</th>
                      <th className="pb-2 px-1 font-normal">Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id} className="border-b border-base-border/60 last:border-0">
                        <td className="py-2.5 px-1 text-slate-400">{p.user?.email ?? '—'}</td>
                        <td className="py-2.5 px-1 font-medium">{p.symbol}</td>
                        <td className="py-2.5 px-1">
                          <Badge tone={p.tradeType === 'long' ? 'positive' : 'negative'}>{p.tradeType}</Badge>
                        </td>
                        <td className="py-2.5 px-1">{p.positionSize}</td>
                        <td className="py-2.5 px-1">{p.entryPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

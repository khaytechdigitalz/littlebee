import { useEffect, useImperativeHandle, useState, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, Badge } from './ui'
import { listTrades, closeTrade } from '../services/trades'
import { normalizeError } from '../services/api'

interface TradeRow {
  id: number
  symbol: string
  tradeType: 'long' | 'short'
  positionSize: string
  entryPrice: string
  marginUsed: string
  slPrice: string | null
  tpPrice: string | null
  status: 'open' | 'closed'
  markPrice?: number
  pnl?: number
  pnlPct?: number
}

export interface PositionsTableHandle {
  refresh: () => void
}

const PositionsTable = forwardRef<PositionsTableHandle>((_, ref) => {
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [closingId, setClosingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    listTrades()
      .then(setTrades)
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])
  useImperativeHandle(ref, () => ({ refresh: load }))

  const handleClose = async (id: number) => {
    setClosingId(id)
    try {
      await closeTrade(id)
      load()
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setClosingId(null)
    }
  }

  const openTrades = trades.filter((t) => t.status === 'open')
  const closedTrades = trades.filter((t) => t.status === 'closed').slice(0, 10)
  const rows = [...openTrades, ...closedTrades]

  return (
    <Card title="Active positions & open orders">
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading positions…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No trades yet — place an order to see it here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-base-border">
                <th className="pb-2 px-1 font-normal">Symbol</th>
                <th className="pb-2 px-1 font-normal">Type</th>
                <th className="pb-2 px-1 font-normal">Size</th>
                <th className="pb-2 px-1 font-normal">Entry</th>
                <th className="pb-2 px-1 font-normal">Mark</th>
                <th className="pb-2 px-1 font-normal">Margin</th>
                <th className="pb-2 px-1 font-normal">SL / TP</th>
                <th className="pb-2 px-1 font-normal">PnL</th>
                <th className="pb-2 px-1 font-normal">Status</th>
                <th className="pb-2 px-1 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-base-border/60 last:border-0">
                  <td className="py-2.5 px-1 font-medium">{p.symbol}</td>
                  <td className="py-2.5 px-1">
                    <Badge tone={p.tradeType === 'long' ? 'positive' : 'negative'}>{p.tradeType}</Badge>
                  </td>
                  <td className="py-2.5 px-1 text-slate-300">{Number(p.positionSize).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-1 text-slate-300">{Number(p.entryPrice).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                  <td className="py-2.5 px-1 text-slate-300">
                    {p.status === 'open' && p.markPrice != null ? p.markPrice.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                  </td>
                  <td className="py-2.5 px-1 text-slate-300">${Number(p.marginUsed).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-1 text-slate-500 text-xs">
                    {p.slPrice ?? '—'} / {p.tpPrice ?? '—'}
                  </td>
                  <td className={`py-2.5 px-1 font-medium ${(p.pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.status === 'open' && p.pnl != null
                      ? `${p.pnl >= 0 ? '+' : ''}${p.pnlPct?.toFixed(2)}% ($${p.pnl.toFixed(2)})`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-1">
                    <Badge tone={p.status === 'open' ? 'accent' : 'neutral'}>{p.status === 'open' ? 'Open' : 'Closed'}</Badge>
                  </td>
                  <td className="py-2.5 px-1">
                    {p.status === 'open' && (
                      <button
                        onClick={() => handleClose(p.id)}
                        disabled={closingId === p.id}
                        className="text-xs text-red-400 hover:underline disabled:opacity-50"
                      >
                        {closingId === p.id ? 'Closing…' : 'Close'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
})

export default PositionsTable

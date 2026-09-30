import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Bell, Clock, MapPin, Loader2 } from 'lucide-react'
import { Card, Field, Badge, Button } from '../components/ui'
import TradingViewChart from '../components/TradingViewChart'
import OrderPanel from '../components/OrderPanel'
import PositionsTable, { type PositionsTableHandle } from '../components/PositionsTable'
import { useUsdWallet } from '../hooks/useUsdWallet'
import { getQuotes } from '../services/markets'
import { listTransactions } from '../services/transactions'
import { getMarketHoursStatus } from '../utils/marketHours'

const PAIRS = [
  { label: 'BTC/USDT', symbol: 'BTC', tvSymbol: 'BINANCE:BTCUSDT' },
  { label: 'ETH/USDT', symbol: 'ETH', tvSymbol: 'BINANCE:ETHUSDT' },
  { label: 'USDT', symbol: 'USDT', tvSymbol: 'BINANCE:USDTUSD' },
]

export default function Dashboard() {
  const { balance, loading: balanceLoading, refresh: refreshWallet } = useUsdWallet()
  const [pair, setPair] = useState(PAIRS[0])
  const positionsRef = useRef<PositionsTableHandle>(null)

  const [quotes, setQuotes] = useState<{ symbol: string; price: number | null; available: boolean }[]>([])
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [activity, setActivity] = useState<any[]>([])
  const marketHours = useMemo(() => getMarketHoursStatus(), [])

  const [funds, setFunds] = useState('BTC/USDT')
  const [deposit, setDeposit] = useState('')
  const [openPrice, setOpenPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [risk, setRisk] = useState('2')
  const [result, setResult] = useState<{ units: number; atRisk: number } | null>(null)

  useEffect(() => {
    if (!balanceLoading) setDeposit(String(balance))
  }, [balance, balanceLoading])

  useEffect(() => {
    setQuotesLoading(true)
    getQuotes('crypto', ['BTC', 'ETH', 'USDT', 'LTC'])
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setQuotesLoading(false))
  }, [])

  useEffect(() => {
    listTransactions()
      .then((tx) => setActivity(tx.slice(0, 5)))
      .catch(() => setActivity([]))
  }, [])

  const calculate = () => {
    const bal = parseFloat(deposit) || 0
    const open = parseFloat(openPrice) || 0
    const sl = parseFloat(stopLoss) || 0
    const riskPct = parseFloat(risk) || 0
    const riskAmount = (bal * riskPct) / 100
    const priceDelta = Math.abs(open - sl) || 1
    const units = riskAmount / priceDelta
    setResult({ units: Math.round(units), atRisk: Math.round(riskAmount * 1000) / 1000 })
  }

  const currentPrice = quotes.find((q) => q.symbol === pair.symbol)?.price ?? 0

  const handleOrderPlaced = () => {
    refreshWallet()
    positionsRef.current?.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5 min-w-0">
          <Card>
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="text-sm text-slate-500 mb-1">Balance</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-bold">
                    {balanceLoading ? '…' : `$${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  </h2>
                </div>
              </div>
              <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
                {PAIRS.map((p) => (
                  <button
                    key={p.tvSymbol}
                    onClick={() => setPair(p)}
                    className={`text-xs px-2.5 py-1.5 rounded-md transition ${
                      pair.tvSymbol === p.tvSymbol ? 'bg-accent text-black font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[420px] rounded-xl overflow-hidden border border-base-border">
              <TradingViewChart symbol={pair.tvSymbol} height={420} />
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Live chart by TradingView — use the built-in range selector (1M/6M/1Y) and drawing tools above.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card title="Recent activity" action={<Bell size={15} className="text-slate-500" />}>
              {activity.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-200 capitalize">{a.type}</p>
                        <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p>${Number(a.amount).toLocaleString()}</p>
                        <Badge tone={a.status === 'completed' ? 'positive' : a.status === 'declined' ? 'negative' : 'accent'}>
                          {a.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Markets (live)">
              {quotesLoading ? (
                <p className="text-sm text-slate-500 text-center py-4 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading quotes…
                </p>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q) => (
                    <div key={q.symbol} className="flex items-center justify-between text-sm">
                      <span className="text-slate-200">{q.symbol}/USD</span>
                      <span className="text-slate-100">
                        {q.available && q.price != null ? `$${q.price.toLocaleString()}` : 'unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card title="Market Hours" action={<MapPin size={15} className="text-slate-500" />}>
            <div className="grid grid-cols-3 gap-4">
              {marketHours.map((h) => (
                <div key={h.city} className="text-center p-3 rounded-xl bg-base-bg border border-base-border">
                  <Clock size={16} className={h.status === 'open' ? 'text-accent mx-auto mb-2' : 'text-slate-600 mx-auto mb-2'} />
                  <p className="text-sm font-medium">{h.city}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{h.timeLeft}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <OrderPanel
            marketType="crypto"
            symbol={pair.label}
            price={currentPrice}
            balance={balance}
            onOrderPlaced={handleOrderPlaced}
          />

          <Card title="Position size calculator">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Asset pair" value={funds} onChange={(e) => setFunds(e.target.value)} />
                <Field label="Account balance" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Opening price" value={openPrice} onChange={(e) => setOpenPrice(e.target.value)} placeholder={String(currentPrice || '')} />
                <Field label="Stop loss price" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
              </div>
              <Field label="Risk %" value={risk} onChange={(e) => setRisk(e.target.value)} />
              <Button className="w-full" onClick={calculate}>
                Calculate <ArrowUpRight size={14} />
              </Button>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-base-bg border border-base-border rounded-lg p-3">
                  <p className="text-xs text-slate-500">Units (deal size)</p>
                  <p className="font-semibold mt-1">{result ? result.units.toLocaleString() : '—'}</p>
                </div>
                <div className="bg-base-bg border border-base-border rounded-lg p-3">
                  <p className="text-xs text-slate-500">Amount at risk</p>
                  <p className="font-semibold mt-1">{result ? result.atRisk.toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <PositionsTable ref={positionsRef} />
    </div>
  )
}

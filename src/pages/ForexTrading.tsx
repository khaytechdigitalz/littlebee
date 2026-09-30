import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card } from '../components/ui'
import TradingViewChart from '../components/TradingViewChart'
import OrderPanel from '../components/OrderPanel'
import PositionsTable, { type PositionsTableHandle } from '../components/PositionsTable'
import { getDirectory, getQuotes, type Instrument } from '../services/markets'
import { useUsdWallet } from '../hooks/useUsdWallet'

const CATEGORIES = ['All', 'Major', 'Minor', 'Exotic']

const TV_SYMBOL: Record<string, string> = {
  'EUR/USD': 'FX:EURUSD', 'GBP/USD': 'FX:GBPUSD', 'USD/JPY': 'FX:USDJPY',
  'AUD/USD': 'FX:AUDUSD', 'USD/CAD': 'FX:USDCAD', 'GBP/JPY': 'FX:GBPJPY',
}

export default function ForexTrading() {
  const { balance, refresh: refreshWallet } = useUsdWallet()
  const [category, setCategory] = useState('All')
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [quotes, setQuotes] = useState<Record<string, number | null>>({})
  const [selected, setSelected] = useState<Instrument | null>(null)
  const [loading, setLoading] = useState(true)
  const positionsRef = useRef<PositionsTableHandle>(null)

  useEffect(() => {
    setLoading(true)
    getDirectory('forex')
      .then(async (list) => {
        setInstruments(list)
        setSelected(list[0] ?? null)
        const quoteList = await getQuotes('forex', list.map((i) => i.symbol)).catch(() => [])
        setQuotes(Object.fromEntries(quoteList.map((q) => [q.symbol, q.available ? q.price : null])))
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => (category === 'All' ? instruments : instruments.filter((p) => p.category === category)), [category, instruments])

  const handleOrderPlaced = () => {
    refreshWallet()
    positionsRef.current?.refresh()
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500 text-center py-10 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading forex pairs…
        </p>
      </Card>
    )
  }

  if (!selected) {
    return (
      <Card>
        <p className="text-sm text-slate-500 text-center py-10">No pairs available.</p>
      </Card>
    )
  }

  const price = quotes[selected.symbol] ?? 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-5">
        <Card title="Forex pairs">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  category === c ? 'border-accent text-accent bg-accent/10' : 'border-base-border text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="space-y-1 max-h-[520px] overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.symbol}
                onClick={() => setSelected(p)}
                className={`w-full flex items-center justify-between text-sm py-2 px-2 rounded-lg transition ${
                  selected.symbol === p.symbol ? 'bg-accent/10 border border-accent/40' : 'hover:bg-[var(--hover)]'
                }`}
              >
                <div className="text-left">
                  <p className="font-medium">{p.symbol}</p>
                  <p className="text-[11px] text-slate-500">{p.category}</p>
                </div>
                <p className="text-slate-200">{quotes[p.symbol] != null ? quotes[p.symbol]!.toFixed(5) : '—'}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-5 min-w-0">
          <Card>
            <h2 className="text-xl font-bold mb-1">{selected.symbol}</h2>
            <p className="text-2xl font-bold mb-4">{price ? price.toFixed(5) : 'Price unavailable'}</p>
            {!price && (
              <p className="text-[11px] text-slate-600 -mt-3 mb-4">
                Configure STOCKS_FX_API_KEY on the backend to enable live forex quotes.
              </p>
            )}
            <div className="h-[380px] rounded-xl overflow-hidden border border-base-border">
              <TradingViewChart symbol={TV_SYMBOL[selected.symbol] ?? `FX:${selected.symbol.replace('/', '')}`} interval="60" chartStyle="1" height={380} />
            </div>
          </Card>
        </div>

        <OrderPanel marketType="forex" symbol={selected.symbol} price={price} balance={balance} onOrderPlaced={handleOrderPlaced} />
      </div>

      <PositionsTable ref={positionsRef} />
    </div>
  )
}

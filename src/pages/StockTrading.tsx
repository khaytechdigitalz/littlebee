import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, Badge } from '../components/ui'
import TradingViewChart from '../components/TradingViewChart'
import OrderPanel from '../components/OrderPanel'
import PositionsTable, { type PositionsTableHandle } from '../components/PositionsTable'
import { getDirectory, getQuotes, type Instrument } from '../services/markets'
import { useUsdWallet } from '../hooks/useUsdWallet'

const SECTORS = ['All', 'Tech', 'Finance', 'Energy']
const RANGES: { label: string; interval: string }[] = [
  { label: '1D', interval: '5' },
  { label: '1W', interval: '30' },
  { label: '1M', interval: 'D' },
  { label: '1Y', interval: 'W' },
  { label: 'All', interval: 'M' },
]

const TV_SYMBOL: Record<string, string> = {
  AAPL: 'NASDAQ:AAPL', TSLA: 'NASDAQ:TSLA', NVDA: 'NASDAQ:NVDA', MSFT: 'NASDAQ:MSFT',
  AMZN: 'NASDAQ:AMZN', GOOGL: 'NASDAQ:GOOGL', JPM: 'NYSE:JPM', GS: 'NYSE:GS', XOM: 'NYSE:XOM', CVX: 'NYSE:CVX',
}

export default function StockTrading() {
  const { balance, refresh: refreshWallet } = useUsdWallet()
  const [sector, setSector] = useState('All')
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [quotes, setQuotes] = useState<Record<string, number | null>>({})
  const [selected, setSelected] = useState<Instrument | null>(null)
  const [range, setRange] = useState(RANGES[2])
  const [chartType, setChartType] = useState<'1' | '3'>('1')
  const [loading, setLoading] = useState(true)
  const positionsRef = useRef<PositionsTableHandle>(null)

  useEffect(() => {
    setLoading(true)
    getDirectory('stock')
      .then(async (list) => {
        setInstruments(list)
        setSelected(list[0] ?? null)
        const quoteList = await getQuotes('stock', list.map((i) => i.symbol)).catch(() => [])
        setQuotes(Object.fromEntries(quoteList.map((q) => [q.symbol, q.available ? q.price : null])))
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => (sector === 'All' ? instruments : instruments.filter((s) => s.category === sector)), [sector, instruments])

  const handleOrderPlaced = () => {
    refreshWallet()
    positionsRef.current?.refresh()
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500 text-center py-10 flex items-center justify-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Loading stock directory…
        </p>
      </Card>
    )
  }

  if (!selected) {
    return (
      <Card>
        <p className="text-sm text-slate-500 text-center py-10">No instruments available.</p>
      </Card>
    )
  }

  const price = quotes[selected.symbol] ?? 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-5">
        <Card title="Stock directory" className="xl:order-1">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  sector === s ? 'border-accent text-accent bg-accent/10' : 'border-base-border text-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="space-y-1 max-h-[520px] overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s.symbol}
                onClick={() => setSelected(s)}
                className={`w-full flex items-center justify-between text-sm py-2 px-2 rounded-lg transition ${
                  selected.symbol === s.symbol ? 'bg-accent/10 border border-accent/40' : 'hover:bg-[var(--hover)]'
                }`}
              >
                <div className="text-left">
                  <p className="font-medium">{s.symbol}</p>
                  <p className="text-[11px] text-slate-500">{s.name}</p>
                </div>
                <p className="text-slate-200">{quotes[s.symbol] != null ? `$${quotes[s.symbol]!.toFixed(2)}` : '—'}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-5 min-w-0 xl:order-2">
          <Card>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold">{selected.symbol}</h2>
                <p className="text-sm text-slate-500">{selected.name}</p>
                <p className="text-2xl font-bold mt-1">{price ? `$${price.toFixed(2)}` : 'Price unavailable'}</p>
                {!price && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    Configure STOCKS_FX_API_KEY on the backend to enable live stock quotes.
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
                  {RANGES.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setRange(r)}
                      className={`text-xs px-2.5 py-1.5 rounded-md transition ${
                        range.label === r.label ? 'bg-accent text-black font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
                  {(['1', '3'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChartType(c)}
                      className={`text-xs px-2.5 py-1.5 rounded-md transition ${
                        chartType === c ? 'bg-accent text-black font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {c === '1' ? 'Candle' : 'Line'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[380px] rounded-xl overflow-hidden border border-base-border">
              <TradingViewChart symbol={TV_SYMBOL[selected.symbol] ?? `NASDAQ:${selected.symbol}`} interval={range.interval} chartStyle={chartType} height={380} />
            </div>
          </Card>
        </div>

        <div className="xl:order-3">
          <OrderPanel
            marketType="stock"
            symbol={selected.symbol}
            price={price}
            balance={balance}
            unitLabel="Shares"
            allowFractional
            onOrderPlaced={handleOrderPlaced}
          />
        </div>
      </div>

      <PositionsTable ref={positionsRef} />
    </div>
  )
}

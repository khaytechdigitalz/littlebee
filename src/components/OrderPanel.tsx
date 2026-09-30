import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Card, Field, Button } from './ui'
import { openTrade } from '../services/trades'
import { normalizeError } from '../services/api'

type Side = 'long' | 'short'
type OrderType = 'market' | 'limit' | 'stop'
type Margin = 'isolated' | 'cross'

interface Props {
  marketType: 'crypto' | 'stock' | 'forex'
  symbol: string
  price: number
  balance: number
  unitLabel?: string
  allowFractional?: boolean
  onOrderPlaced?: () => void
}

export default function OrderPanel({
  marketType,
  symbol,
  price,
  balance,
  unitLabel = 'Position amount',
  allowFractional = false,
  onOrderPlaced,
}: Props) {
  const [side, setSide] = useState<Side>('long')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [margin, setMargin] = useState<Margin>('isolated')
  const [leverage, setLeverage] = useState(10)
  const [amountPct, setAmountPct] = useState(25)
  const [orderPrice, setOrderPrice] = useState(price.toString())
  const [triggerPrice, setTriggerPrice] = useState(price.toString())
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [placed, setPlaced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const maxPositionAmount = balance * leverage
  const positionAmount = (amountPct / 100) * maxPositionAmount
  const marginAmount = leverage > 0 ? positionAmount / leverage : 0
  const commission = positionAmount * 0.0006
  const liqDistance = 0.9 / leverage
  const liqPrice = side === 'long' ? price * (1 - liqDistance) : price * (1 + liqDistance)

  const place = async () => {
    if (marginAmount <= 0) {
      setError('Enter a position amount greater than 0')
      return
    }
    if (marginAmount > balance) {
      setError('Insufficient balance for this margin amount')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await openTrade({
        marketType,
        symbol,
        tradeType: side,
        orderType,
        leverage,
        marginAmount,
        slPrice: sl ? Number(sl) : undefined,
        tpPrice: tp ? Number(tp) : undefined,
      })
      setPlaced(true)
      setSl('')
      setTp('')
      onOrderPlaced?.()
      setTimeout(() => setPlaced(false), 2500)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title={`Order · ${symbol}`}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setSide('long')}
          className={`text-sm font-semibold py-2 rounded-lg transition ${
            side === 'long' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' : 'border border-base-border text-slate-400'
          }`}
        >
          Long / Buy
        </button>
        <button
          onClick={() => setSide('short')}
          className={`text-sm font-semibold py-2 rounded-lg transition ${
            side === 'short' ? 'bg-red-500/15 text-red-400 border border-red-500/40' : 'border border-base-border text-slate-400'
          }`}
        >
          Short / Sell
        </button>
      </div>

      <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5 mb-4">
        {(['market', 'limit', 'stop'] as OrderType[]).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition ${
              orderType === t ? 'bg-accent text-black' : 'text-slate-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
          {(['isolated', 'cross'] as Margin[]).map((m) => (
            <button
              key={m}
              onClick={() => setMargin(m)}
              className={`text-xs px-2.5 py-1.5 rounded-md capitalize transition ${
                margin === m ? 'bg-accent text-black font-semibold' : 'text-slate-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{leverage}x leverage</span>
      </div>

      <input
        type="range"
        min={2}
        max={100}
        step={1}
        value={leverage}
        onChange={(e) => setLeverage(Number(e.target.value))}
        className="w-full mb-1"
      />
      <div className="flex justify-between text-[10px] text-slate-600 mb-4">
        <span>2x</span>
        <span>25x</span>
        <span>50x</span>
        <span>100x</span>
      </div>

      {orderType === 'stop' && (
        <Field label="Trigger price" value={triggerPrice} onChange={(e) => setTriggerPrice(e.target.value)} className="mb-3" />
      )}
      {orderType !== 'market' && (
        <Field label="Order price" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} className="mb-3" />
      )}

      <div className="mb-1">
        <span className="text-xs text-slate-500 mb-1.5 block">
          {unitLabel} ({amountPct}% of balance)
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={allowFractional ? 1 : 5}
          value={amountPct}
          onChange={(e) => setAmountPct(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 mb-3">
        {[25, 50, 75, 100].map((p) => (
          <button key={p} onClick={() => setAmountPct(p)} className="hover:text-slate-300">
            {p}%
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Stop loss (SL)" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="Optional" />
        <Field label="Take profit (TP)" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="Optional" />
      </div>

      <div className="space-y-1.5 text-xs bg-base-bg border border-base-border rounded-lg p-3 mb-4">
        <div className="flex justify-between">
          <span className="text-slate-500">Margin required</span>
          <span>${marginAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Commission (est.)</span>
          <span>${commission.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Est. liquidation price</span>
          <span>${liqPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Available balance</span>
          <span>${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <Button className={`w-full ${side === 'short' ? '!bg-red-500 !text-white' : ''}`} onClick={place} disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Placing order…
          </>
        ) : placed ? (
          <>
            <Check size={14} /> Order placed
          </>
        ) : (
          `Place ${side === 'long' ? 'Buy' : 'Sell'} Order`
        )}
      </Button>
    </Card>
  )
}

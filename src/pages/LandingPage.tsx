import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  LineChart,
  Landmark,
  Wallet,
  Lock,
  Globe,
  Sun,
  Moon,
} from 'lucide-react'
import { Button, Card } from '../components/ui'
import { getQuotes } from '../services/markets'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  {
    icon: LineChart,
    title: 'Crypto, stocks & forex — one account',
    desc: 'Trade BTC, ETH, and major altcoins alongside NASDAQ/NYSE stocks and FX pairs, all from a single wallet.',
  },
  {
    icon: Zap,
    title: 'Live TradingView charts',
    desc: 'Every market ships with real candlestick charts, volume, and drawing tools — not a static screenshot.',
  },
  {
    icon: Wallet,
    title: 'Real on-chain deposits',
    desc: 'Crypto deposits are generated and confirmed on-chain via Coinremitter — your balance updates the moment a payment confirms.',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-grade account security',
    desc: 'Transaction PIN, Google 2FA, device/session tracking, and tiered KYC — all before a withdrawal ever goes out.',
  },
]

const SECURITY_POINTS = [
  'Every trade fills and closes against a live market price feed — never set manually.',
  'Withdrawals require your transaction PIN, and 2FA if enabled, before they can even be submitted.',
  'Crypto payouts execute on-chain through Coinremitter only after admin review of the request.',
  'Session and login history is visible to you at all times, with one-click "log out everywhere."',
]

export default function LandingPage() {
  const { colorMode, toggleColorMode } = useTheme()
  const [principal, setPrincipal] = useState('1000')
  const [rate, setRate] = useState('8')
  const [months, setMonths] = useState('12')
  const [quotes, setQuotes] = useState<{ symbol: string; price: number | null; available: boolean }[]>([])

  useEffect(() => {
    getQuotes('crypto', ['BTC', 'ETH', 'USDT', 'LTC', 'DOGE'])
      .then(setQuotes)
      .catch(() => setQuotes([]))
  }, [])

  const projected = useMemo(() => {
    const p = parseFloat(principal) || 0
    const r = (parseFloat(rate) || 0) / 100
    const m = parseFloat(months) || 0
    return p * Math.pow(1 + r / 12, m)
  }, [principal, rate, months])

  return (
    <div className="min-h-screen bg-base-bg text-slate-100">
      {/* Nav */}
      <header className="border-b border-base-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/90 flex items-center justify-center font-bold text-black">
              🐝
            </div>
            <span className="font-bold text-lg tracking-tight">LITTLEBEE</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleColorMode}
              className="p-2 rounded-lg border border-base-border hover:bg-[var(--hover)] transition text-slate-300"
              aria-label="Toggle light/dark mode"
            >
              {colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/auth/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/auth/signup">
              <Button>Create account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/30 rounded-full px-3 py-1 mb-6">
          <Globe size={12} /> Crypto · Stocks · Forex, one platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Trade global markets with <span className="text-accent">real prices</span>, real security
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto mt-5">
          LittleBee gives you live TradingView charts, on-chain crypto deposits, and a full order book across crypto,
          stocks, and forex — backed by bank-grade account protection.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/auth/signup">
            <Button>
              Start trading <ArrowRight size={14} />
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button variant="ghost">I have an account</Button>
          </Link>
        </div>
      </section>

      {/* Live ticker */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="card p-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {quotes.length === 0 ? (
            <p className="text-xs text-slate-500">Loading live prices…</p>
          ) : (
            quotes.map((q) => (
              <div key={q.symbol} className="flex items-center gap-2 text-sm">
                <span className="text-slate-300">{q.symbol}/USD</span>
                {q.available && q.price != null ? (
                  <>
                    <span className="font-medium">${q.price.toLocaleString()}</span>
                    {q.change24h != null && (
                      <span className={q.change24h >= 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                        {q.change24h >= 0 ? '+' : ''}
                        {q.change24h.toFixed(2)}%
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-600 text-xs">unavailable</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <p className="font-semibold text-sm mb-1.5">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Illustrative calculator */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <Card title="Illustrative growth calculator">
          <p className="text-xs text-slate-500 -mt-2 mb-4">
            For planning purposes only — this projects compounding at a rate you choose. It is not a forecast,
            promise, or guarantee of trading results; actual performance depends entirely on real market prices.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <label className="block">
              <span className="text-xs text-slate-500 mb-1.5 block">Starting amount (USD)</span>
              <input
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1.5 block">Assumed annual rate (%)</span>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1.5 block">Time horizon (months)</span>
              <input
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition"
              />
            </label>
          </div>
          <div className="bg-base-bg border border-base-border rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Projected value</span>
            <span className="text-2xl font-bold">
              ${projected.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </Card>
      </section>

      {/* Security */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-center">
          <div>
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <Lock size={18} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Security isn't an afterthought</h2>
            <p className="text-sm text-slate-500">
              Every account-protection layer below runs the same way for every user — including admins, who never
              have a path to alter a trade's outcome.
            </p>
          </div>
          <ul className="space-y-3">
            {SECURITY_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                <ShieldCheck size={16} className="text-accent shrink-0 mt-0.5" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <Card>
          <Landmark size={28} className="text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ready to trade?</h2>
          <p className="text-sm text-slate-500 mb-6">Open a free demo account — no deposit required to start.</p>
          <Link to="/auth/signup">
            <Button>
              Create your account <ArrowRight size={14} />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-base-border py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LittleBee. Trading involves risk — only trade with funds you can afford to lose.
      </footer>
    </div>
  )
}

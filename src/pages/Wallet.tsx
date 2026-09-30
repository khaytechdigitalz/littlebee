import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, ChevronRight } from 'lucide-react'
import { Card, Button, Modal } from '../components/ui'
import { listWallets, generateWallet, type WalletRecord } from '../services/wallets'
import { getDirectory, type Instrument } from '../services/markets'
import { normalizeError } from '../services/api'
import { useTheme } from '../context/ThemeContext'

const FIAT_CODES = ['USD', 'EUR', 'GBP']

export default function WalletPage() {
  const navigate = useNavigate()
  const { accountMode } = useTheme()
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [directory, setDirectory] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    listWallets(accountMode)
      .then(setWallets)
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [accountMode])

  useEffect(() => {
    getDirectory('crypto').then(setDirectory).catch(() => setDirectory([]))
  }, [])

  const total = wallets.reduce((s, w) => s + Number(w.balance), 0)
  const crypto = wallets.filter((w) => !FIAT_CODES.includes(w.currencyCode))
  const fiat = wallets.filter((w) => FIAT_CODES.includes(w.currencyCode))

  const availableToGenerate = directory.filter((d) => !wallets.some((w) => w.currencyCode === d.symbol))

  const handleGenerate = async (symbol: string) => {
    setGenerating(symbol)
    try {
      await generateWallet(symbol, accountMode)
      setModalOpen(false)
      load()
      navigate(`/app/wallet/${symbol}`)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Total wallet value ({accountMode})</p>
            <h2 className="text-3xl font-bold">{loading ? '…' : `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</h2>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Generate wallet
          </Button>
        </div>

        {!loading && wallets.length > 0 && (
          <>
            <div className="mt-5 flex h-2.5 rounded-full overflow-hidden bg-base-bg border border-base-border">
              {wallets.map((w) => (
                <div
                  key={w.id}
                  style={{
                    width: `${total > 0 ? (Number(w.balance) / total) * 100 : 0}%`,
                    background: 'var(--accent)',
                    opacity: 0.35 + (total > 0 ? Number(w.balance) / total : 0) * 0.65,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              {wallets.map((w) => (
                <span key={w.id}>
                  {w.currencyCode} · {total > 0 ? ((Number(w.balance) / total) * 100).toFixed(1) : '0.0'}%
                </span>
              ))}
            </div>
          </>
        )}
      </Card>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading wallets…
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Crypto wallets">
            {crypto.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No crypto wallets yet — generate one above.</p>
            ) : (
              <div className="space-y-1">
                {crypto.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/app/wallet/${w.currencyCode}`)}
                    className="w-full flex items-center justify-between text-sm py-2 px-1 rounded-lg hover:bg-[var(--hover)] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-base-bg border border-base-border flex items-center justify-center text-xs font-semibold">
                        {w.currencyCode.slice(0, 1)}
                      </div>
                      <div className="text-left">
                        <p className="text-slate-100">{w.currencyCode}</p>
                        <p className="text-xs text-slate-500">{w.isActive ? 'Active' : 'Inactive'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                      <ChevronRight size={14} className="text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="Fiat wallets">
            {fiat.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No fiat wallets yet.</p>
            ) : (
              <div className="space-y-1">
                {fiat.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/app/wallet/${w.currencyCode}`)}
                    className="w-full flex items-center justify-between text-sm py-2 px-1 rounded-lg hover:bg-[var(--hover)] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-base-bg border border-base-border flex items-center justify-center text-xs font-semibold">
                        {w.currencyCode}
                      </div>
                      <p className="text-slate-100">{w.currencyCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">${Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <ChevronRight size={14} className="text-slate-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate a new wallet">
        <p className="text-xs text-slate-500 mb-4">
          {accountMode === 'live'
            ? 'Live crypto wallets get a real on-chain deposit address via Coinremitter.'
            : 'Demo wallets simulate a balance — no real funds or addresses involved.'}
        </p>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {availableToGenerate.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">All available wallets are already created.</p>
          ) : (
            availableToGenerate.map((c) => (
              <button
                key={c.symbol}
                onClick={() => handleGenerate(c.symbol)}
                disabled={generating === c.symbol}
                className="w-full flex items-center justify-between text-sm py-2.5 px-2 rounded-lg hover:bg-[var(--hover)] transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-base-bg border border-base-border flex items-center justify-center text-[10px] font-semibold">
                    {c.symbol.slice(0, 1)}
                  </div>
                  <span>{c.name}</span>
                </div>
                <span className="text-xs text-slate-500">{generating === c.symbol ? 'Generating…' : c.category}</span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

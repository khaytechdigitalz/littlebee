import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Badge, Button } from '../components/ui'
import { listWallets, getWalletTransactions, type WalletRecord } from '../services/wallets'
import { normalizeError } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { ChevronLeft, Copy, QrCode, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react'

export default function WalletDetails() {
  const { symbol = '' } = useParams()
  const navigate = useNavigate()
  const { accountMode } = useTheme()
  const [wallet, setWallet] = useState<WalletRecord | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    listWallets(accountMode)
      .then(async (wallets) => {
        const match = wallets.find((w) => w.currencyCode === symbol)
        setWallet(match ?? null)
        if (match) {
          const tx = await getWalletTransactions(match.id).catch(() => [])
          setTransactions(tx)
        }
      })
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }, [symbol, accountMode])

  const copyAddress = () => {
    if (!wallet?.address) return
    navigator.clipboard?.writeText(wallet.address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading wallet…
          </p>
        </Card>
      </div>
    )
  }

  if (error || !wallet) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Link to="/app/wallet" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
          <ChevronLeft size={16} /> Back to wallets
        </Link>
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error || `No ${symbol} wallet found for your ${accountMode} account.`}</p>
          <Link to="/app/wallet" className="text-xs text-accent hover:underline mt-2 inline-block">
            Generate one from the wallets page
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/app/wallet" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
        <ChevronLeft size={16} /> Back to wallets
      </Link>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-base-bg border border-base-border flex items-center justify-center text-sm font-semibold">
              {symbol.slice(0, 1)}
            </div>
            <div>
              <p className="font-semibold">{symbol}</p>
              <p className="text-xs text-slate-500">{accountMode} wallet</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-2xl font-bold">
              {Number(wallet.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} <span className="text-sm text-slate-500">{symbol}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Button className="flex-1" onClick={() => navigate('/app/deposit')}>
            <ArrowDownToLine size={14} /> Deposit
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => navigate('/app/withdrawal')}>
            <ArrowUpFromLine size={14} /> Withdraw
          </Button>
        </div>
      </Card>

      {wallet.address ? (
        <Card title={`Receive ${symbol}`}>
          <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center">
            {wallet.qrCodeUrl ? (
              <img src={wallet.qrCodeUrl} alt="Deposit QR code" className="w-32 h-32 rounded-xl mx-auto sm:mx-0 bg-white p-2" />
            ) : (
              <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center mx-auto sm:mx-0">
                <QrCode size={90} className="text-black" />
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Public address</p>
              <div className="flex items-center justify-between bg-base-bg border border-base-border rounded-lg px-3 py-2 gap-2">
                <span className="text-xs text-slate-300 truncate">{wallet.address}</span>
                <button onClick={copyAddress} className="shrink-0">
                  <Copy size={14} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
                </button>
              </div>
              {copied && <p className="text-[11px] text-accent mt-1">Copied</p>}
              <p className="text-[11px] text-slate-600 mt-2">
                Only send {symbol} to this address. Sending any other asset may result in permanent loss.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card title={`Receive ${symbol}`}>
          <p className="text-sm text-slate-500">
            {symbol === 'USD' || symbol === 'EUR' || symbol === 'GBP'
              ? 'Fiat deposits are handled through the deposit page (bank wire / card), not an on-chain address.'
              : 'No deposit address generated for this wallet yet.'}
          </p>
        </Card>
      )}

      <Card title={`${symbol} transaction history`}>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No transactions for this wallet yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-base-border">
                  <th className="pb-2 px-1 font-normal">Type</th>
                  <th className="pb-2 px-1 font-normal">Amount</th>
                  <th className="pb-2 px-1 font-normal">Status</th>
                  <th className="pb-2 px-1 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-base-border/60 last:border-0">
                    <td className="py-2.5 px-1 capitalize">{t.type}</td>
                    <td className="py-2.5 px-1">{Number(t.amount).toLocaleString()}</td>
                    <td className="py-2.5 px-1">
                      <Badge tone={t.status === 'completed' ? 'positive' : t.status === 'declined' ? 'negative' : 'accent'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-1 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

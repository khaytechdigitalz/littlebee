import { useEffect, useMemo, useState } from 'react'
import { Card, Field, Button } from '../components/ui'
import { listWallets, type WalletRecord } from '../services/wallets'
import { createWithdrawal, listTransactions } from '../services/transactions'
import { me } from '../services/auth'
import { normalizeError } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { ShieldCheck, Check, Loader2 } from 'lucide-react'

const STEPS = ['Source & amount', 'Recipient', 'Fees', 'Security']
const DAILY_LIMIT = 25000

export default function Withdrawal() {
  const { accountMode } = useTheme()
  const [step, setStep] = useState(0)
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [usedToday, setUsedToday] = useState(0)
  const [has2fa, setHas2fa] = useState(false)

  const [symbol, setSymbol] = useState('')
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([listWallets(accountMode), listTransactions({ type: 'withdrawal' }), me()])
      .then(([w, tx, user]) => {
        setWallets(w)
        if (w.length > 0) setSymbol((s) => s || w[0].currencyCode)
        const today = new Date().toDateString()
        const sum = tx
          .filter((t: any) => t.status !== 'declined' && new Date(t.createdAt).toDateString() === today)
          .reduce((s: number, t: any) => s + Number(t.amount), 0)
        setUsedToday(sum)
        setHas2fa(user.is2faEnabled)
      })
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }, [accountMode])

  const asset = wallets.find((a) => a.currencyCode === symbol)
  const amountNum = parseFloat(amount) || 0
  const quotaLeft = Math.max(0, DAILY_LIMIT - usedToday)
  const quotaPct = Math.min(100, (usedToday / DAILY_LIMIT) * 100)

  const setPct = (pct: number) => {
    if (!asset) return
    setAmount(((Number(asset.balance) * pct) / 100).toString())
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    if (!asset) return
    setSubmitting(true)
    setError('')
    try {
      await createWithdrawal({
        walletId: asset.id,
        amount: amountNum,
        destinationAddress: destination,
        pin,
        twoFactorCode: has2fa ? code : undefined,
      })
      setDone(true)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setDone(false)
    setStep(0)
    setDestination('')
    setAmount('')
    setPin('')
    setCode('')
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </p>
        </Card>
      </div>
    )
  }

  if (wallets.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">
            No wallets with a balance yet — deposit funds first from the Deposit page.
          </p>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="text-center py-10">
          <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4">
            <Check size={26} />
          </div>
          <h2 className="font-semibold text-lg mb-1">Withdrawal requested</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your {amount} {symbol} withdrawal is pending admin review before it's sent
            {accountMode === 'live' ? ' on-chain.' : '.'}
          </p>
          <Button variant="ghost" onClick={reset}>
            Make another withdrawal
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <Card>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">Daily withdrawal quota (based on today's requests)</span>
          <span>
            ${usedToday.toLocaleString()} / ${DAILY_LIMIT.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-base-bg border border-base-border overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${quotaPct}%` }} />
        </div>
        <p className="text-[11px] text-slate-600 mt-1.5">${quotaLeft.toLocaleString()} remaining today</p>
      </Card>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-accent' : 'bg-base-border'}`} />
            <p className={`text-[11px] mt-1.5 ${i === step ? 'text-slate-200' : 'text-slate-600'}`}>{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-1">Select the source wallet</p>
            {wallets.map((a) => (
              <button
                key={a.id}
                onClick={() => setSymbol(a.currencyCode)}
                className={`w-full flex items-center justify-between text-sm p-3 rounded-xl border transition ${
                  symbol === a.currencyCode ? 'border-accent bg-accent/10' : 'border-base-border'
                }`}
              >
                <span>{a.currencyCode}</span>
                <span className="text-xs text-slate-500">
                  {Number(a.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} available
                </span>
              </button>
            ))}

            <Field label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setPct(pct)}
                  className="text-xs font-medium py-2 rounded-lg border border-base-border text-slate-400 hover:border-accent/60 hover:text-accent transition"
                >
                  {pct === 100 ? 'MAX' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <Field
            label={FIAT_LABEL(symbol)}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={FIAT_LABEL(symbol).includes('IBAN') ? 'Enter SWIFT/IBAN' : 'Paste wallet address'}
          />
        )}

        {step === 2 && asset && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-slate-500">Amount</span>
              <span>
                {amountNum.toLocaleString()} {symbol}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              The exact network fee is calculated by Coinremitter when your request is submitted and shown on your
              transaction record — it isn't estimated here to avoid showing a number that might not match.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Field label="Transaction PIN" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
            {has2fa && (
              <Field
                label="Google 2FA code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
              />
            )}
            <div className="flex items-start gap-2 bg-base-bg border border-base-border rounded-lg p-3 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-accent shrink-0 mt-0.5" />
              {has2fa
                ? 'Your PIN and 2FA code are both required before this withdrawal is processed.'
                : 'Your PIN is required before this withdrawal is processed. Enable 2FA in Security for an extra layer.'}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <Button variant="ghost" className="flex-1" onClick={back}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="flex-1" onClick={next} disabled={step === 0 && (!amountNum || amountNum > Number(asset?.balance ?? 0))}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1" onClick={submit} disabled={submitting || !pin}>
              {submitting ? 'Submitting…' : 'Confirm withdrawal'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function FIAT_LABEL(symbol: string) {
  return ['USD', 'EUR', 'GBP'].includes(symbol) ? 'Bank SWIFT / IBAN details' : `${symbol} destination address`
}

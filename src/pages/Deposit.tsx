import { useEffect, useState } from 'react'
import { Card, Field, Button, Badge } from '../components/ui'
import { listWallets, type WalletRecord } from '../services/wallets'
import { createDeposit, listPaymentGateways, listTransactions } from '../services/transactions'
import { uploadFile } from '../services/uploads'
import { normalizeError } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { 
  Landmark, 
  Bitcoin, 
  QrCode, 
  Upload, 
  AlertTriangle, 
  Loader2, 
  Copy, 
  Check, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  FileText 
} from 'lucide-react'

const FIAT_CODES = ['USD', 'EUR', 'GBP']
const STEPS = ['Select Wallet', 'Payment Method', 'Deposit Details']

interface Gateway {
  id: number
  name: string
  type: 'crypto' | 'fiat'
  coinSymbol: string | null
  depositAddressOrIban: string | null
  instructions: string | null
  minDeposit: string
}

const METHOD_ICON: Record<string, any> = { crypto: Bitcoin, fiat: Landmark }

export default function Deposit() {
  const { accountMode } = useTheme()
  const [step, setStep] = useState(0)
  const [wallets, setWallets] = useState<WalletRecord[]>([])
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null)
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null)
  const [amount, setAmount] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([listWallets(accountMode), listTransactions({ type: 'deposit', status: 'pending' })])
      .then(([w, tx]) => {
        setWallets(w)
        setPending(tx)
      })
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [accountMode])

  const isFiat = (w: WalletRecord) => FIAT_CODES.includes(w.currencyCode)

  const pickWallet = async (w: WalletRecord) => {
    setSelectedWallet(w)
    setSelectedGateway(null)
    const type = isFiat(w) ? 'fiat' : 'crypto'
    const list = await listPaymentGateways(type).catch(() => [])
    const filtered = isFiat(w) ? list : list.filter((g: Gateway) => g.coinSymbol === w.currencyCode)
    setGateways(filtered)
    setStep(1)
  }

  const pickGateway = (g: Gateway) => {
    setSelectedGateway(g)
    setStep(2)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setUploading(true)
    try {
      const url = await uploadFile(file)
      setProofUrl(url)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFileName('')
    setProofUrl('')
  }

  const submit = async () => {
    if (!selectedWallet) return
    setSubmitting(true)
    setError('')
    try {
      await createDeposit({
        walletId: selectedWallet.id,
        gatewayId: selectedGateway?.id,
        amount: Number(amount),
        paymentProofUrl: proofUrl || undefined,
      })
      setSubmitted(true)
      setAmount('')
      setProofUrl('')
      setFileName('')
      load()
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  const startOver = () => {
    setSubmitted(false)
    setStep(0)
    setSelectedWallet(null)
    setSelectedGateway(null)
  }

  return (
    <div className="w-full space-y-6">
      {/* Step Stepper */}
      <div className="flex items-center gap-3 w-full">
        {STEPS.map((label, i) => (
          <div 
            key={label} 
            className="flex-1 cursor-pointer"
            onClick={() => i < step && setStep(i)}
          >
            <div className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-accent' : 'bg-base-border'}`} />
            <p className={`text-[11px] font-medium mt-1.5 transition-colors ${i === step ? 'text-slate-200' : 'text-slate-500'}`}>
              {i + 1}. {label}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <Card className="w-full border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Main Grid: Deposit Form + Pending Tracker Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <Card className="lg:col-span-2 p-6 w-full">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="text-sm font-medium">Fetching wallet &amp; gateway options…</p>
            </div>
          ) : submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-100">Deposit Request Submitted</p>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  {selectedWallet && isFiat(selectedWallet)
                    ? "We'll credit your balance as soon as our team verifies your payment receipt."
                    : 'Your deposit will credit automatically once the transaction is confirmed on-chain.'}
                </p>
              </div>
              <Button variant="ghost" onClick={startOver} className="mt-2">
                Make Another Deposit
              </Button>
            </div>
          ) : (
            <>
              {/* STEP 0: SELECT WALLET */}
              {step === 0 && (
                <div className="space-y-4 w-full">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">Select Destination Wallet</h3>
                    <p className="text-xs text-slate-500">Choose the asset wallet you wish to fund.</p>
                  </div>
                  {wallets.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8 border border-dashed border-base-border rounded-xl">
                      No active wallets found.{' '}
                      <a href="/app/wallet" className="text-accent hover:underline">
                        Generate one here
                      </a>.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                      {wallets.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => pickWallet(w)}
                          className="w-full p-4 rounded-xl border border-base-border bg-base-bg/50 hover:border-accent/50 hover:bg-base-bg transition flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-base-border/50 flex items-center justify-center text-slate-300 font-semibold text-xs group-hover:bg-accent/10 group-hover:text-accent transition">
                              {w.currencyCode}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-slate-200">{w.currencyCode}</p>
                              <p className="text-[11px] text-slate-500">{isFiat(w) ? 'Fiat Wallet' : 'Crypto Wallet'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400 font-mono">
                              {Number(w.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </p>
                            <p className="text-[10px] text-slate-500">Available</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 1: CHOOSE GATEWAY */}
              {step === 1 && selectedWallet && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Payment Gateway</h3>
                      <p className="text-xs text-slate-500">Select how you want to transfer {selectedWallet.currencyCode}.</p>
                    </div>
                    <Badge tone="accent">{selectedWallet.currencyCode}</Badge>
                  </div>

                  {gateways.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-base-border rounded-xl">
                      <p className="text-sm text-slate-400">No payment gateways configured for {selectedWallet.currencyCode}.</p>
                      <p className="text-xs text-slate-500 mt-1">Please contact support or try another wallet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                      {gateways.map((g) => {
                        const Icon = METHOD_ICON[g.type] || Landmark
                        return (
                          <button
                            key={g.id}
                            onClick={() => pickGateway(g)}
                            className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-base-border bg-base-bg/50 hover:border-accent/50 hover:bg-base-bg text-slate-300 transition group"
                          >
                            <div className="p-3 rounded-full bg-base-border/50 group-hover:bg-accent/10 group-hover:text-accent transition">
                              <Icon size={22} />
                            </div>
                            <span className="text-xs font-medium text-slate-200">{g.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <Button variant="ghost" className="w-full flex items-center justify-center gap-2 mt-4" onClick={() => setStep(0)}>
                    <ArrowLeft size={14} /> Back to Wallets
                  </Button>
                </div>
              )}

              {/* STEP 2: DEPOSIT DETAILS */}
              {step === 2 && selectedWallet && (
                <div className="space-y-5 w-full">
                  {selectedGateway?.type === 'crypto' ? (
                    <div className="space-y-4 text-center w-full">
                      <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
                        {selectedWallet.qrCodeUrl ? (
                          <img src={selectedWallet.qrCodeUrl} alt="Deposit QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <QrCode size={130} className="text-slate-800" />
                        )}
                      </div>

                      <div className="w-full">
                        <p className="text-xs text-slate-400 mb-1">Send only {selectedWallet.currencyCode} to this address</p>
                        <div className="flex items-center gap-2 bg-base-bg border border-base-border rounded-xl px-3 py-2.5 text-xs text-slate-200 break-all font-mono w-full">
                          <span className="flex-1 text-left">{selectedWallet.address ?? 'Address pending generation…'}</span>
                          {selectedWallet.address && (
                            <button
                              onClick={() => handleCopy(selectedWallet.address!)}
                              className="p-1.5 hover:bg-base-border rounded-lg text-slate-400 hover:text-slate-200 transition shrink-0"
                              title="Copy Address"
                            >
                              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedGateway && Number(selectedGateway.minDeposit) > 0 && (
                        <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-3.5 text-xs text-left w-full">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Minimum Deposit Required</p>
                            <p className="opacity-90 mt-0.5">
                              Minimum limit is {selectedGateway.minDeposit} {selectedWallet.currencyCode}. Deposits below this threshold cannot be processed or refunded.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 w-full">
                      {selectedGateway?.instructions && (
                        <div className="text-xs text-slate-300 bg-base-bg border border-base-border rounded-xl p-4 space-y-1 w-full">
                          <p className="font-medium text-slate-200">Deposit Instructions:</p>
                          <p className="text-slate-400 leading-relaxed">{selectedGateway.instructions}</p>
                        </div>
                      )}

                      {selectedGateway?.depositAddressOrIban && (
                        <div className="w-full">
                          <p className="text-xs text-slate-400 mb-1">Payment IBAN / Account Details</p>
                          <div className="flex items-center gap-2 bg-base-bg border border-base-border rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono break-all w-full">
                            <span className="flex-1">{selectedGateway.depositAddressOrIban}</span>
                            <button
                              onClick={() => handleCopy(selectedGateway.depositAddressOrIban!)}
                              className="p-1.5 hover:bg-base-border rounded-lg text-slate-400 hover:text-slate-200 transition shrink-0"
                              title="Copy IBAN"
                            >
                              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      )}

                      <Field
                        label="Deposit Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        type="number"
                      />

                      <div className="w-full">
                        <span className="text-xs font-medium text-slate-400 mb-1.5 block">Payment Proof (Screenshot / Receipt)</span>
                        {!fileName ? (
                          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-base-border rounded-xl p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-base-bg/50 transition w-full">
                            <Upload size={22} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-300">Click to browse or upload receipt</span>
                            <span className="text-[10px] text-slate-500">Supports PNG, JPG, or PDF</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between border border-base-border bg-base-bg rounded-xl px-3.5 py-3 text-xs text-slate-200 w-full">
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={16} className="text-accent shrink-0" />
                              <span className="truncate">{uploading ? 'Uploading proof…' : fileName}</span>
                            </div>
                            {uploading ? (
                              <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />
                            ) : (
                              <button onClick={removeFile} className="p-1 text-slate-400 hover:text-red-400 transition">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2 w-full">
                    <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    {selectedGateway?.type !== 'crypto' && (
                      <Button className="flex-1" onClick={submit} disabled={submitting || !amount || uploading}>
                        {submitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Submitting…
                          </span>
                        ) : (
                          'Submit Deposit'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* TRACKER CARD - Rendered on the side for wide screens */}
        <Card title="Pending Deposits" className="lg:col-span-1 w-full h-fit">
          {pending.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No pending deposits in progress.</p>
          ) : (
            <div className="divide-y divide-base-border/50 w-full">
              {pending.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-200">${Number(d.amount).toLocaleString()}</p>
                    <p className="text-[11px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge tone="accent">{d.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
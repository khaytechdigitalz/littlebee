import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Button } from '../components/ui'
import { listKyc, submitKyc } from '../services/profile'
import { uploadFile } from '../services/uploads'
import { normalizeError } from '../services/api'
import { ChevronLeft, Mail, BadgeAlert, FileText, Upload, Loader2 } from 'lucide-react'

const TIERS = [
  { level: 1, title: 'Basic', desc: 'Confirm your account details', icon: Mail, documentType: 'account_confirmation' },
  { level: 2, title: 'ID verification', desc: 'Upload a government-issued ID (passport, driver’s license, or national ID)', icon: BadgeAlert, documentType: 'government_id' },
  { level: 3, title: 'Proof of address', desc: 'Upload a recent utility bill or bank statement (last 3 months)', icon: FileText, documentType: 'proof_of_address' },
]

interface KycDoc {
  id: number
  tierLevel: number
  documentType: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
}

export default function KYC() {
  const [documents, setDocuments] = useState<KycDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingTier, setUploadingTier] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    listKyc()
      .then(setDocuments)
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const statusForTier = (level: number): KycDoc | undefined =>
    documents.filter((d) => d.tierLevel === level).sort((a, b) => b.id - a.id)[0]

  const handleUpload = async (tier: (typeof TIERS)[number], file: File) => {
    setUploadingTier(tier.level)
    setError('')
    try {
      const url = await uploadFile(file)
      await submitKyc({ tierLevel: tier.level, documentType: tier.documentType, documentUrl: url })
      load()
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setUploadingTier(null)
    }
  }

  const approvedCount = TIERS.filter((t) => statusForTier(t.level)?.status === 'approved').length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/app/profile" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
        <ChevronLeft size={16} /> Back to profile
      </Link>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        <p className="text-sm text-slate-500 mb-2">Verification progress</p>
        <div className="flex gap-1.5">
          {TIERS.map((t) => {
            const doc = statusForTier(t.level)
            return (
              <div
                key={t.level}
                className={`h-1.5 flex-1 rounded-full ${
                  doc?.status === 'approved' ? 'bg-accent' : doc?.status === 'pending' ? 'bg-accent/40' : 'bg-base-border'
                }`}
              />
            )
          })}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {approvedCount} of {TIERS.length} tiers approved — higher tiers unlock larger withdrawal limits.
        </p>
      </Card>

      {loading ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-6 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </p>
        </Card>
      ) : (
        TIERS.map((tier) => {
          const doc = statusForTier(tier.level)
          const status = doc?.status ?? 'not_started'
          const Icon = tier.icon
          return (
            <Card key={tier.level}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-base-bg border border-base-border flex items-center justify-center text-slate-300 shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Level {tier.level}</p>
                    <p className="font-medium text-sm">{tier.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tier.desc}</p>
                    {status === 'rejected' && doc?.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">Rejected: {doc.rejectionReason}</p>
                    )}
                  </div>
                </div>
                <Badge tone={status === 'approved' ? 'positive' : status === 'pending' ? 'accent' : status === 'rejected' ? 'negative' : 'neutral'}>
                  {status === 'not_started' ? 'Not started' : status}
                </Badge>
              </div>

              {status !== 'approved' && (
                <div className="mt-4 border border-dashed border-base-border rounded-xl p-5 text-center">
                  {uploadingTier === tier.level ? (
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Uploading…
                    </p>
                  ) : (
                    <>
                      <Upload size={18} className="mx-auto text-slate-500 mb-2" />
                      <p className="text-xs text-slate-300">
                        {status === 'pending' ? 'Documents submitted — under review' : 'No documents uploaded yet'}
                      </p>
                      <label>
                        <Button variant="ghost" className="mt-3 cursor-pointer" type="button">
                          {status === 'pending' ? 'Replace documents' : 'Upload documents'}
                        </Button>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => e.target.files?.[0] && handleUpload(tier, e.target.files[0])}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

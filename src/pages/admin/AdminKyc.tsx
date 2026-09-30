import { useEffect, useState } from 'react'
import { Card, Badge, Button } from '../../components/ui'
import { listAdminKyc, reviewKyc } from '../../services/admin'
import { resolveUploadUrl } from '../../services/uploads'

interface KycRow {
  id: number
  tierLevel: number
  documentType: string
  documentUrl: string
  createdAt: string
  user?: { fullName: string; email: string }
}

export default function AdminKyc() {
  const [rows, setRows] = useState<KycRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    listAdminKyc('pending')
      .then((res) => setRows(res.data ?? res))
      .catch((err) => setError(err.message || 'Failed to load KYC submissions'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const act = async (row: KycRow, action: 'approve' | 'reject') => {
    setBusyId(row.id)
    try {
      await reviewKyc(row.id, action)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err: any) {
      setError(err.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">KYC review</h1>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card title="Pending submissions">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-6">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Nothing pending.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 border border-base-border rounded-xl p-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{row.user?.fullName ?? '—'}</p>
                    <Badge tone="accent">Tier {row.tierLevel}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{row.user?.email}</p>
                  <p className="text-xs text-slate-500">{row.documentType}</p>
                  <a href={resolveUploadUrl(row.documentUrl)} target="_blank" rel="noreferrer" className="text-[11px] text-accent hover:underline">
                    View document
                  </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" onClick={() => act(row, 'reject')} disabled={busyId === row.id}>
                    Reject
                  </Button>
                  <Button onClick={() => act(row, 'approve')} disabled={busyId === row.id}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Card, Badge, Button } from '../../components/ui'
import { listAdminTransactions, reviewDeposit, reviewWithdrawal } from '../../services/admin'
import { resolveUploadUrl } from '../../services/uploads'

interface TxRow {
  id: number
  type: 'deposit' | 'withdrawal'
  amount: string
  fee: string
  destinationAddress: string | null
  blockchainTxid: string | null
  paymentProofUrl: string | null
  createdAt: string
  user?: { fullName: string; email: string }
}

export default function AdminTransactions() {
  const [tab, setTab] = useState<'deposit' | 'withdrawal'>('withdrawal')
  const [rows, setRows] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    listAdminTransactions({ type: tab, status: 'pending' })
      .then((res) => setRows(res.data ?? res))
      .catch((err) => setError(err.message || 'Failed to load transactions'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [tab])

  const act = async (row: TxRow, action: 'approve' | 'decline') => {
    setBusyId(row.id)
    try {
      if (tab === 'deposit') await reviewDeposit(row.id, action)
      else await reviewWithdrawal(row.id, action)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err: any) {
      setError(err.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Transactions</h1>
        <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
          {(['withdrawal', 'deposit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize transition ${
                tab === t ? 'bg-accent text-black' : 'text-slate-400'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card title={`Pending ${tab}s`}>
        {tab === 'withdrawal' && (
          <p className="text-xs text-slate-500 -mt-2 mb-3">
            Approving a crypto withdrawal executes the real Coinremitter payout for the exact amount and address the
            user submitted — nothing here is editable before sending.
          </p>
        )}
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-6">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Nothing pending.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 border border-base-border rounded-xl p-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium">
                    {row.amount} {row.fee && Number(row.fee) > 0 ? `(fee ${row.fee})` : ''}
                  </p>
                  <p className="text-xs text-slate-500">{row.user?.email ?? '—'}</p>
                  {row.destinationAddress && (
                    <p className="text-[11px] text-slate-600 break-all mt-0.5">To: {row.destinationAddress}</p>
                  )}
                  {row.paymentProofUrl && (
                    <a href={resolveUploadUrl(row.paymentProofUrl)} target="_blank" rel="noreferrer" className="text-[11px] text-accent hover:underline mt-0.5 block">
                      View payment proof
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone="accent">Pending</Badge>
                  <Button variant="ghost" onClick={() => act(row, 'decline')} disabled={busyId === row.id}>
                    Decline
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

import { useEffect, useMemo, useState } from 'react'
import { Card, Badge } from '../components/ui'
import { listTransactions } from '../services/transactions'
import { normalizeError } from '../services/api'
import { Download, Loader2 } from 'lucide-react'

const TYPES = ['All', 'deposit', 'withdrawal']
const STATUSES = ['All', 'pending', 'approved', 'declined', 'completed']

export default function TransactionHistory() {
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    listTransactions({
      type: type === 'All' ? undefined : type,
      status: status === 'All' ? undefined : status,
    })
      .then(setTransactions)
      .catch((err) => setError(normalizeError(err).message))
      .finally(() => setLoading(false))
  }, [type, status])

  const filtered = useMemo(() => {
    if (!query) return transactions
    return transactions.filter((t) => `${t.id} ${t.blockchainTxid ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  }, [transactions, query])

  const exportCsv = () => {
    const header = ['ID', 'Type', 'Amount', 'Fee', 'Status', 'Date']
    const rows = filtered.map((t) => [t.id, t.type, t.amount, t.fee, t.status, t.createdAt])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'littlebee-transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-base-bg border border-base-border rounded-lg px-3 py-2 text-xs outline-none capitalize"
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-base-bg border border-base-border rounded-lg px-3 py-2 text-xs outline-none capitalize"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID or tx hash..."
              className="bg-base-bg border border-base-border rounded-lg px-3 py-2 text-xs outline-none placeholder:text-slate-600 w-48"
            />
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium border border-base-border rounded-lg px-3 py-2 hover:bg-[var(--hover)] transition disabled:opacity-40"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </Card>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-8 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No transactions match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-base-border">
                  <th className="pb-2 px-1 font-normal">ID</th>
                  <th className="pb-2 px-1 font-normal">Type</th>
                  <th className="pb-2 px-1 font-normal">Amount</th>
                  <th className="pb-2 px-1 font-normal">Fee</th>
                  <th className="pb-2 px-1 font-normal">Status</th>
                  <th className="pb-2 px-1 font-normal">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-base-border/60 last:border-0">
                    <td className="py-2.5 px-1 text-slate-400">#{t.id}</td>
                    <td className="py-2.5 px-1 capitalize">{t.type}</td>
                    <td className="py-2.5 px-1">{Number(t.amount).toLocaleString()}</td>
                    <td className="py-2.5 px-1 text-slate-500">{Number(t.fee) > 0 ? Number(t.fee).toLocaleString() : '—'}</td>
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

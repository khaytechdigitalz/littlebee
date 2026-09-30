import { useEffect, useState } from 'react'
import { Card, Field, Button, Badge, Modal } from '../../components/ui'
import { listUsers, getUser, suspendUser, unsuspendUser, resetDemoBalance, adjustWallet } from '../../services/admin'

interface UserRow {
  id: number
  fullName: string
  email: string
  accountType: 'demo' | 'live'
  isVerified: boolean
  isSuspended: boolean
  wallets?: { id: number; mode: string; currencyCode: string; balance: string }[]
}

export default function AdminUsers() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adjustTarget, setAdjustTarget] = useState<UserRow | null>(null)
  const [adjustWalletId, setAdjustWalletId] = useState<number | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    listUsers({ q: query || undefined })
      .then((res) => setUsers(res.data ?? res))
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const toggleSuspend = async (user: UserRow) => {
    const updated = user.isSuspended ? await unsuspendUser(user.id) : await suspendUser(user.id)
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isSuspended: updated.isSuspended } : u)))
  }

  const submitAdjustment = async () => {
    if (!adjustTarget || !adjustWalletId) return
    await adjustWallet({
      userId: adjustTarget.id,
      walletId: adjustWalletId,
      amount: Number(adjustAmount),
      reason: adjustReason,
    })
    setAdjustTarget(null)
    setAdjustAmount('')
    setAdjustReason('')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Users</h1>
        <Field label="" placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
      </div>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-base-border">
                  <th className="pb-2 px-1 font-normal">Name</th>
                  <th className="pb-2 px-1 font-normal">Email</th>
                  <th className="pb-2 px-1 font-normal">Type</th>
                  <th className="pb-2 px-1 font-normal">KYC</th>
                  <th className="pb-2 px-1 font-normal">Status</th>
                  <th className="pb-2 px-1 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-base-border/60 last:border-0">
                    <td className="py-2.5 px-1">{u.fullName}</td>
                    <td className="py-2.5 px-1 text-slate-400">{u.email}</td>
                    <td className="py-2.5 px-1 capitalize">{u.accountType}</td>
                    <td className="py-2.5 px-1">
                      <Badge tone={u.isVerified ? 'positive' : 'neutral'}>{u.isVerified ? 'Verified' : 'Unverified'}</Badge>
                    </td>
                    <td className="py-2.5 px-1">
                      <Badge tone={u.isSuspended ? 'negative' : 'positive'}>{u.isSuspended ? 'Suspended' : 'Active'}</Badge>
                    </td>
                    <td className="py-2.5 px-1">
                      <div className="flex gap-2">
                        <button onClick={() => toggleSuspend(u)} className="text-xs text-accent hover:underline">
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button onClick={() => resetDemoBalance(u.id)} className="text-xs text-slate-400 hover:underline">
                          Reset demo
                        </button>
                        <button
                          onClick={() => getUser(u.id).then(setAdjustTarget)}
                          className="text-xs text-slate-400 hover:underline"
                        >
                          Adjust wallet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Adjust wallet — ${adjustTarget?.fullName ?? ''}`}>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-500 mb-1.5 block">Wallet</span>
            <select
              value={adjustWalletId ?? ''}
              onChange={(e) => setAdjustWalletId(Number(e.target.value))}
              className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="">Select a wallet</option>
              {adjustTarget?.wallets?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.mode} · {w.currencyCode} (bal {w.balance})
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Amount (positive = credit, negative = debit)"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="e.g. 500 or -200"
          />
          <Field label="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Manual bank wire reconciliation…" />
          <Button className="w-full" onClick={submitAdjustment}>
            Apply adjustment
          </Button>
        </div>
      </Modal>
    </div>
  )
}

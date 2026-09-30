import { useEffect, useState } from 'react'
import { Card, Field, Button, Badge, Modal } from '../../components/ui'
import { listGateways, createGateway, updateGateway, deleteGateway } from '../../services/admin'

interface Gateway {
  id: number
  name: string
  type: 'crypto' | 'fiat'
  coinSymbol: string | null
  minDeposit: string
  depositFeePercentage: string
  withdrawalFeePercentage: string
  isActive: boolean
}

const BLANK = {
  name: '',
  type: 'crypto' as 'crypto' | 'fiat',
  coinSymbol: '',
  depositAddressOrIban: '',
  instructions: '',
  minDeposit: '0',
  depositFeePercentage: '0',
  withdrawalFeePercentage: '0',
}

export default function AdminGateways() {
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(BLANK)

  const load = () => {
    setLoading(true)
    listGateways()
      .then(setGateways)
      .catch((err) => setError(err.message || 'Failed to load gateways'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew = () => {
    setEditingId(null)
    setForm(BLANK)
    setModalOpen(true)
  }

  const openEdit = (g: Gateway) => {
    setEditingId(g.id)
    setForm({
      name: g.name,
      type: g.type,
      coinSymbol: g.coinSymbol ?? '',
      depositAddressOrIban: '',
      instructions: '',
      minDeposit: g.minDeposit,
      depositFeePercentage: g.depositFeePercentage,
      withdrawalFeePercentage: g.withdrawalFeePercentage,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    const payload = {
      ...form,
      minDeposit: Number(form.minDeposit),
      depositFeePercentage: Number(form.depositFeePercentage),
      withdrawalFeePercentage: Number(form.withdrawalFeePercentage),
    }
    if (editingId) await updateGateway(editingId, payload)
    else await createGateway(payload)
    setModalOpen(false)
    load()
  }

  const remove = async (id: number) => {
    await deleteGateway(id)
    setGateways((prev) => prev.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Payment gateways</h1>
        <Button onClick={openNew}>Add gateway</Button>
      </div>

      {error && (
        <Card className="border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-6">Loading…</p>
        ) : (
          <div className="space-y-2">
            {gateways.map((g) => (
              <div key={g.id} className="flex items-center justify-between border border-base-border rounded-xl p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{g.name}</p>
                    <Badge tone={g.isActive ? 'positive' : 'neutral'}>{g.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Min {g.minDeposit} · deposit fee {g.depositFeePercentage}% · withdrawal fee {g.withdrawalFeePercentage}%
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(g)} className="text-xs text-accent hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(g.id)} className="text-xs text-red-400 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit gateway' : 'Add gateway'}>
        <div className="space-y-3">
          <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <span className="text-xs text-slate-500 mb-1.5 block">Type</span>
            <div className="flex bg-base-bg border border-base-border rounded-lg p-0.5">
              {(['crypto', 'fiat'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition ${
                    form.type === t ? 'bg-accent text-black' : 'text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {form.type === 'crypto' && (
            <Field label="Coin symbol" value={form.coinSymbol} onChange={(e) => setForm({ ...form, coinSymbol: e.target.value })} placeholder="BTC" />
          )}
          <Field
            label={form.type === 'crypto' ? 'Deposit address' : 'IBAN / account details'}
            value={form.depositAddressOrIban}
            onChange={(e) => setForm({ ...form, depositAddressOrIban: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Min deposit" value={form.minDeposit} onChange={(e) => setForm({ ...form, minDeposit: e.target.value })} />
            <Field label="Deposit fee %" value={form.depositFeePercentage} onChange={(e) => setForm({ ...form, depositFeePercentage: e.target.value })} />
            <Field label="Withdrawal fee %" value={form.withdrawalFeePercentage} onChange={(e) => setForm({ ...form, withdrawalFeePercentage: e.target.value })} />
          </div>
          <Button className="w-full" onClick={submit}>
            {editingId ? 'Save changes' : 'Create gateway'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

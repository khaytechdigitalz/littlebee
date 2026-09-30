import api from './api'

/**
 * Every call here hits /api/v1/admin/*, gated server-side by auth + admin
 * middleware. Note what's absent: there is no function here that submits a
 * trade outcome, PnL, or exit price — openPositions() is read-only, matching
 * the backend, which has no write endpoint for trade results at all.
 */

export async function getDashboardSummary(mode: 'demo' | 'live' = 'live') {
  const { data } = await api.get('/admin/dashboard/summary', { params: { mode } })
  return data
}

export async function getOpenPositions(mode: 'demo' | 'live' = 'live') {
  const { data } = await api.get('/admin/dashboard/open-positions', { params: { mode } })
  return data.trades
}

export async function listUsers(params?: { q?: string; page?: number }) {
  const { data } = await api.get('/admin/users', { params })
  return data
}

export async function getUser(id: number) {
  const { data } = await api.get(`/admin/users/${id}`)
  return data.user
}

export async function suspendUser(id: number) {
  const { data } = await api.post(`/admin/users/${id}/suspend`)
  return data.user
}

export async function unsuspendUser(id: number) {
  const { data } = await api.post(`/admin/users/${id}/unsuspend`)
  return data.user
}

export async function resetDemoBalance(id: number) {
  await api.post(`/admin/users/${id}/reset-demo-balance`)
}

export async function adjustWallet(payload: { userId: number; walletId: number; amount: number; reason: string }) {
  const { data } = await api.post('/admin/wallets/adjust', payload)
  return data.wallet
}

export async function listAdminTransactions(params?: { type?: string; status?: string; mode?: string; page?: number }) {
  const { data } = await api.get('/admin/transactions', { params })
  return data
}

export async function reviewDeposit(id: number, action: 'approve' | 'decline', note?: string) {
  const { data } = await api.post(`/admin/transactions/${id}/deposit-review`, { action, note })
  return data.transaction
}

export async function reviewWithdrawal(id: number, action: 'approve' | 'decline', note?: string) {
  const { data } = await api.post(`/admin/transactions/${id}/withdrawal-review`, { action, note })
  return data.transaction
}

export async function listAdminKyc(status = 'pending') {
  const { data } = await api.get('/admin/kyc', { params: { status } })
  return data
}

export async function reviewKyc(id: number, action: 'approve' | 'reject', reason?: string) {
  const { data } = await api.post(`/admin/kyc/${id}/review`, { action, reason })
  return data.document
}

export async function listGateways() {
  const { data } = await api.get('/admin/payment-gateways')
  return data.gateways
}

export async function createGateway(payload: Record<string, unknown>) {
  const { data } = await api.post('/admin/payment-gateways', payload)
  return data.gateway
}

export async function updateGateway(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put(`/admin/payment-gateways/${id}`, payload)
  return data.gateway
}

export async function deleteGateway(id: number) {
  await api.delete(`/admin/payment-gateways/${id}`)
}

export async function getSettings() {
  const { data } = await api.get('/admin/settings')
  return data.settings as Record<string, string>
}

export async function updateSetting(key: string, value: string) {
  const { data } = await api.post('/admin/settings', { key, value })
  return data.setting
}

export async function testWebhook() {
  const { data } = await api.post('/admin/settings/test-webhook')
  return data
}

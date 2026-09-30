import api from './api'

export async function listTransactions(params?: { type?: string; status?: string }) {
  const { data } = await api.get('/transactions', { params })
  return data.transactions
}

export async function createDeposit(payload: { walletId: number; gatewayId?: number; amount: number; paymentProofUrl?: string }) {
  const { data } = await api.post('/transactions/deposit', payload)
  return data.transaction
}

export async function createWithdrawal(payload: {
  walletId: number
  amount: number
  destinationAddress: string
  pin: string
  twoFactorCode?: string
  speed?: 'low' | 'medium' | 'priority'
}) {
  const { data } = await api.post('/transactions/withdrawal', payload)
  return data.transaction
}

export async function listPaymentGateways(type?: 'crypto' | 'fiat') {
  const { data } = await api.get('/payment-gateways', { params: { type } })
  return data.gateways
}

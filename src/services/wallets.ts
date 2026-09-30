import api from './api'

export interface WalletRecord {
  id: number
  mode: 'demo' | 'live'
  currencyCode: string
  address: string | null
  qrCodeUrl: string | null
  balance: string
  isActive: boolean
}

export async function listWallets(mode?: 'demo' | 'live') {
  const { data } = await api.get('/wallets', { params: { mode } })
  return data.wallets as WalletRecord[]
}

export async function generateWallet(currencyCode: string, mode?: 'demo' | 'live') {
  const { data } = await api.post('/wallets/generate', { currencyCode, mode })
  return data.wallet as WalletRecord
}

export async function getWallet(id: number) {
  const { data } = await api.get(`/wallets/${id}`)
  return data.wallet as WalletRecord
}

export async function getWalletTransactions(id: number) {
  const { data } = await api.get(`/wallets/${id}/transactions`)
  return data.transactions
}

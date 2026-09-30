import api from './api'

export interface OpenTradePayload {
  marketType: 'crypto' | 'stock' | 'forex'
  symbol: string
  tradeType: 'long' | 'short'
  orderType: 'market' | 'limit' | 'stop'
  leverage: number
  marginAmount: number
  slPrice?: number
  tpPrice?: number
}

export async function listTrades() {
  const { data } = await api.get('/trades')
  return data.trades
}

export async function openTrade(payload: OpenTradePayload) {
  const { data } = await api.post('/trades', payload)
  return data.trade
}

export async function closeTrade(tradeId: number) {
  const { data } = await api.post(`/trades/${tradeId}/close`)
  return data.trade
}

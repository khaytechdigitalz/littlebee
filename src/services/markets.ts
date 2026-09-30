import api from './api'

export interface Instrument {
  symbol: string
  name: string
  category: string
}

export async function getDirectory(marketType?: 'crypto' | 'stock' | 'forex') {
  const { data } = await api.get('/markets/directory', { params: { marketType } })
  return data.instruments as Instrument[]
}

export async function getPrice(marketType: 'crypto' | 'stock' | 'forex', symbol: string) {
  const { data } = await api.get('/markets/price', { params: { marketType, symbol } })
  return data.price as number
}

export async function getQuotes(marketType: 'crypto' | 'stock' | 'forex', symbols: string[]) {
  const { data } = await api.get('/markets/quotes', { params: { marketType, symbols: symbols.join(',') } })
  return data.quotes as { symbol: string; price: number | null; change24h: number | null; available: boolean }[]
}

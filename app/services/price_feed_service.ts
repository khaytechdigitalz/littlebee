/**
 * Every price TradeExecutionService uses to open, mark, or close a trade
 * comes from here — never from a controller, an admin action, or a client
 * payload. This is what makes trade outcomes real: an admin can view the
 * result, but cannot set it.
 */
import axios from 'axios'
import env from '#start/env'

const CRYPTO_BASE = env.get('PRICE_FEED_BASE_URL', 'https://api.coingecko.com/api/v3')
const STOCKS_FX_BASE = env.get('STOCKS_FX_FEED_BASE_URL', 'https://api.twelvedata.com')

// Maps our display symbols (BTC/USDT) to CoinGecko coin ids.
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  LTC: 'litecoin',
  DOGE: 'dogecoin',
  BNB: 'binancecoin',
}

interface CacheEntry {
  price: number
  fetchedAt: number
}

export default class PriceFeedService {
  private cache = new Map<string, CacheEntry>()
  private readonly ttlMs = 5_000 // avoid hammering the upstream feed on every quote request
  private changeCache = new Map<string, { change24h: number | null; fetchedAt: number }>()

  async getPrice(marketType: 'crypto' | 'stock' | 'forex', symbol: string): Promise<number> {
    const cacheKey = `${marketType}:${symbol}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < this.ttlMs) {
      return cached.price
    }

    const price =
      marketType === 'crypto'
        ? await this.fetchCryptoPrice(symbol)
        : marketType === 'stock'
          ? await this.fetchStockPrice(symbol)
          : await this.fetchForexPrice(symbol)

    this.cache.set(cacheKey, { price, fetchedAt: Date.now() })
    return price
  }

  /** Real 24h % change — CoinGecko's simple/price endpoint supports this for free; stocks/forex aren't wired yet (returns null). */
  async getQuoteWithChange(marketType: 'crypto' | 'stock' | 'forex', symbol: string): Promise<{ price: number; change24h: number | null }> {
    if (marketType !== 'crypto') {
      return { price: await this.getPrice(marketType, symbol), change24h: null }
    }

    const cacheKey = `crypto:${symbol}`
    const cached = this.changeCache.get(cacheKey)
    if (cached && Date.now() - cached.fetchedAt < this.ttlMs) {
      const price = await this.getPrice(marketType, symbol)
      return { price, change24h: cached.change24h }
    }

    const base = symbol.split('/')[0].toUpperCase()
    const id = COINGECKO_IDS[base]
    if (!id) throw new Error(`No price feed mapping for crypto symbol ${symbol}`)

    const { data } = await axios.get(`${CRYPTO_BASE}/simple/price`, {
      params: { ids: id, vs_currencies: 'usd', include_24hr_change: true },
      timeout: 8_000,
    })
    const price = data?.[id]?.usd
    const change24h = data?.[id]?.usd_24h_change ?? null
    if (typeof price !== 'number') throw new Error(`Price feed returned no data for ${symbol}`)

    this.cache.set(cacheKey, { price, fetchedAt: Date.now() })
    this.changeCache.set(cacheKey, { change24h, fetchedAt: Date.now() })
    return { price, change24h }
  }


  private async fetchCryptoPrice(symbol: string): Promise<number> {
    const base = symbol.split('/')[0].toUpperCase()
    const id = COINGECKO_IDS[base]
    if (!id) throw new Error(`No price feed mapping for crypto symbol ${symbol}`)

    const { data } = await axios.get(`${CRYPTO_BASE}/simple/price`, {
      params: { ids: id, vs_currencies: 'usd' },
      timeout: 8_000,
    })
    const price = data?.[id]?.usd
    if (typeof price !== 'number') throw new Error(`Price feed returned no data for ${symbol}`)
    return price
  }

  private async fetchStockPrice(symbol: string): Promise<number> {
    const { data } = await axios.get(`${STOCKS_FX_BASE}/price`, {
      params: { symbol, apikey: env.get('STOCKS_FX_API_KEY', '') },
      timeout: 8_000,
    })
    const price = Number(data?.price)
    if (!Number.isFinite(price)) throw new Error(`Price feed returned no data for ${symbol}`)
    return price
  }

  private async fetchForexPrice(pair: string): Promise<number> {
    const symbol = pair.replace('/', '/') // Twelve Data accepts "EUR/USD" directly
    const { data } = await axios.get(`${STOCKS_FX_BASE}/price`, {
      params: { symbol, apikey: env.get('STOCKS_FX_API_KEY', '') },
      timeout: 8_000,
    })
    const price = Number(data?.price)
    if (!Number.isFinite(price)) throw new Error(`Price feed returned no data for ${pair}`)
    return price
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import PriceFeedService from '#app/services/price_feed_service'

/**
 * Static tradable-instrument catalog (symbol/name/category) — this is
 * reference metadata, not a price or an outcome, so it's fine to ship as
 * static config (every real broker ships a static instrument list the same
 * way). Actual prices always come from PriceFeedService below, never from
 * this list.
 */
const CRYPTO_DIRECTORY = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'Crypto' },
  { symbol: 'ETH', name: 'Ethereum', category: 'Crypto' },
  { symbol: 'USDT', name: 'Tether', category: 'Crypto' },
  { symbol: 'LTC', name: 'Litecoin', category: 'Crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'Crypto' },
  { symbol: 'BNB', name: 'BNB', category: 'Crypto' },
]

const STOCK_DIRECTORY = [
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Tech' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Tech' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'Tech' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Tech' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Tech' },
  { symbol: 'JPM', name: 'JPMorgan Chase', category: 'Finance' },
  { symbol: 'GS', name: 'Goldman Sachs', category: 'Finance' },
  { symbol: 'XOM', name: 'Exxon Mobil', category: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corp.', category: 'Energy' },
]

const FOREX_DIRECTORY = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'Major' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'Major' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'Major' },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'Minor' },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'Minor' },
  { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', category: 'Exotic' },
]

export default class MarketsController {
  private priceFeed = new PriceFeedService()

  async directory({ request, response }: HttpContext) {
    const marketType = request.qs().marketType as 'crypto' | 'stock' | 'forex' | undefined
    const directories = { crypto: CRYPTO_DIRECTORY, stock: STOCK_DIRECTORY, forex: FOREX_DIRECTORY }
    if (marketType && directories[marketType]) {
      return response.ok({ instruments: directories[marketType] })
    }
    return response.ok({
      instruments: [...CRYPTO_DIRECTORY, ...STOCK_DIRECTORY, ...FOREX_DIRECTORY],
    })
  }

  /** Single live quote — GET /markets/price?marketType=crypto&symbol=BTC */
  async price({ request, response }: HttpContext) {
    const marketType = request.qs().marketType as 'crypto' | 'stock' | 'forex'
    const symbol = request.qs().symbol as string
    if (!marketType || !symbol) {
      return response.badRequest({ message: 'marketType and symbol are required' })
    }

    try {
      const price = await this.priceFeed.getPrice(marketType, symbol)
      return response.ok({ symbol, price })
    } catch (error) {
      return response.serviceUnavailable({ message: error.message })
    }
  }

  /** Batch quotes for ticker widgets — GET /markets/quotes?marketType=crypto&symbols=BTC,ETH,USDT */
  async quotes({ request, response }: HttpContext) {
    const marketType = request.qs().marketType as 'crypto' | 'stock' | 'forex'
    const symbols = String(request.qs().symbols ?? '').split(',').filter(Boolean)
    if (!marketType || symbols.length === 0) {
      return response.badRequest({ message: 'marketType and symbols are required' })
    }

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const { price, change24h } = await this.priceFeed.getQuoteWithChange(marketType, symbol)
          return { symbol, price, change24h, available: true }
        } catch {
          return { symbol, price: null, change24h: null, available: false }
        }
      }),
    )

    return response.ok({ quotes: results })
  }
}

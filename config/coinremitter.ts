/**
 * Per-coin Coinremitter credentials. Only coins with both an API key and
 * password set are considered "active" — see CoinremitterService.isActive().
 * Demo-mode wallets/trades never touch this — see TradeExecutionService and
 * WalletService, which branch on `mode === 'live'` before calling out here.
 */
import env from '#start/env'

export type CoinSymbol = 'BTC' | 'ETH' | 'USDT' | 'LTC' | 'DOGE' | 'BNB'

interface CoinCredential {
  apiKey: string
  password: string
}

const coinremitterConfig = {
  baseUrl: 'https://coinremitter.com/api/v3',
  webhookUrl: env.get('COINREMITTER_WEBHOOK_URL'),
  minConfirmations: Number(env.get('COINREMITTER_MIN_CONFIRMATIONS', '2')),
  coins: {
    BTC: { apiKey: env.get('COINREMITTER_BTC_API_KEY', ''), password: env.get('COINREMITTER_BTC_PASSWORD', '') },
    ETH: { apiKey: env.get('COINREMITTER_ETH_API_KEY', ''), password: env.get('COINREMITTER_ETH_PASSWORD', '') },
    USDT: { apiKey: env.get('COINREMITTER_USDT_API_KEY', ''), password: env.get('COINREMITTER_USDT_PASSWORD', '') },
    LTC: { apiKey: env.get('COINREMITTER_LTC_API_KEY', ''), password: env.get('COINREMITTER_LTC_PASSWORD', '') },
    DOGE: { apiKey: env.get('COINREMITTER_DOGE_API_KEY', ''), password: env.get('COINREMITTER_DOGE_PASSWORD', '') },
    BNB: { apiKey: env.get('COINREMITTER_BNB_API_KEY', ''), password: env.get('COINREMITTER_BNB_PASSWORD', '') },
  } satisfies Record<CoinSymbol, CoinCredential>,
}

export default coinremitterConfig

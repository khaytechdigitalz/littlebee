import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string.optional(),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  ACCESS_TOKEN_EXPIRY: Env.schema.string.optional(),

  COINREMITTER_BTC_API_KEY: Env.schema.string.optional(),
  COINREMITTER_BTC_PASSWORD: Env.schema.string.optional(),
  COINREMITTER_ETH_API_KEY: Env.schema.string.optional(),
  COINREMITTER_ETH_PASSWORD: Env.schema.string.optional(),
  COINREMITTER_USDT_API_KEY: Env.schema.string.optional(),
  COINREMITTER_USDT_PASSWORD: Env.schema.string.optional(),
  COINREMITTER_LTC_API_KEY: Env.schema.string.optional(),
  COINREMITTER_LTC_PASSWORD: Env.schema.string.optional(),
  COINREMITTER_DOGE_API_KEY: Env.schema.string.optional(),
  COINREMITTER_DOGE_PASSWORD: Env.schema.string.optional(),
  COINREMITTER_BNB_API_KEY: Env.schema.string.optional(),
  COINREMITTER_BNB_PASSWORD: Env.schema.string.optional(),
  COINREMITTER_WEBHOOK_URL: Env.schema.string.optional(),
  COINREMITTER_MIN_CONFIRMATIONS: Env.schema.string.optional(),

  PRICE_FEED_BASE_URL: Env.schema.string.optional(),
  STOCKS_FX_FEED_BASE_URL: Env.schema.string.optional(),
  STOCKS_FX_API_KEY: Env.schema.string.optional(),

  DEFAULT_ADMIN_EMAIL: Env.schema.string.optional(),
  DEFAULT_ADMIN_PASSWORD: Env.schema.string.optional(),
})

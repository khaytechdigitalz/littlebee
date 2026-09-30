import vine from '@vinejs/vine'

export const openTradeValidator = vine.compile(
  vine.object({
    marketType: vine.enum(['crypto', 'stock', 'forex'] as const),
    symbol: vine.string().trim().maxLength(32),
    tradeType: vine.enum(['long', 'short'] as const),
    orderType: vine.enum(['market', 'limit', 'stop'] as const),
    leverage: vine.number().min(1).max(100),
    marginAmount: vine.number().positive(),
    slPrice: vine.number().positive().optional(),
    tpPrice: vine.number().positive().optional(),
  }),
)

export const closeTradeValidator = vine.compile(
  vine.object({
    tradeId: vine.number(),
  }),
)

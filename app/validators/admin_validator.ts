import vine from '@vinejs/vine'

export const reviewTransactionValidator = vine.compile(
  vine.object({
    action: vine.enum(['approve', 'decline'] as const),
    note: vine.string().trim().optional(),
  }),
)

export const reviewKycValidator = vine.compile(
  vine.object({
    action: vine.enum(['approve', 'reject'] as const),
    reason: vine.string().trim().optional(),
  }),
)

export const upsertGatewayValidator = vine.compile(
  vine.object({
    name: vine.string().trim().maxLength(150),
    type: vine.enum(['crypto', 'fiat'] as const),
    coinSymbol: vine.string().trim().optional(),
    depositAddressOrIban: vine.string().trim().optional(),
    instructions: vine.string().trim().optional(),
    minDeposit: vine.number().min(0),
    maxDeposit: vine.number().min(0).optional(),
    depositFeePercentage: vine.number().min(0).max(100),
    withdrawalFeePercentage: vine.number().min(0).max(100),
    isActive: vine.boolean().optional(),
  }),
)

export const updateSettingValidator = vine.compile(
  vine.object({
    key: vine.string().trim(),
    value: vine.string().trim(),
  }),
)

export const adjustWalletValidator = vine.compile(
  vine.object({
    userId: vine.number(),
    walletId: vine.number(),
    amount: vine.number(), // positive = credit, negative = debit
    reason: vine.string().trim().minLength(3),
  }),
)

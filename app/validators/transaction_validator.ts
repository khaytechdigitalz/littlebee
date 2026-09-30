import vine from '@vinejs/vine'

export const depositValidator = vine.compile(
  vine.object({
    walletId: vine.number(),
    gatewayId: vine.number().optional(),
    amount: vine.number().positive(),
    // Our own /uploads endpoint returns a relative path ("/uploads/x.png"), not
    // an absolute URL — validate as a plain non-empty string instead of .url().
    paymentProofUrl: vine.string().trim().minLength(1).maxLength(500).optional(),
  }),
)

export const withdrawalValidator = vine.compile(
  vine.object({
    walletId: vine.number(),
    amount: vine.number().positive(),
    destinationAddress: vine.string().trim().minLength(4),
    pin: vine.string().regex(/^\d{4,6}$/),
    twoFactorCode: vine.string().regex(/^\d{6}$/).optional(),
    speed: vine.enum(['low', 'medium', 'priority'] as const).optional(),
  }),
)

export const generateWalletValidator = vine.compile(
  vine.object({
    currencyCode: vine.string().trim().maxLength(12),
  }),
)

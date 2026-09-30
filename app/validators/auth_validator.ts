import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(150),
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    country: vine.string().trim().optional(),
  }),
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string(),
  }),
)

export const setPinValidator = vine.compile(
  vine.object({
    pin: vine
      .string()
      .regex(/^\d{4,6}$/)
      .transform((v) => v),
  }),
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8),
  }),
)

export const verifyPinValidator = vine.compile(
  vine.object({
    pin: vine.string().regex(/^\d{4,6}$/),
  }),
)

export const enable2faValidator = vine.compile(
  vine.object({
    code: vine.string().regex(/^\d{6}$/),
  }),
)

import vine from '@vinejs/vine'

export const RegisterValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').select('id').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8),
  })
)

export const LoginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
  })
)

export const ValidateOTPAndEmail = vine.compile(
  vine.object({
    email: vine.string().email(),
    otp: vine.string().regex(/^\d{6}$/),
  })
)

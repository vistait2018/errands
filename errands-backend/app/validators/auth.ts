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

export const ChangePassword = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)
export const ChangePasswordConfirmation = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(), // current password (plaintext from user)
    newPassword: vine.string().minLength(8),
    confirmPassword: vine.string().minLength(8),
    otp: vine.string().regex(/^\d{6}$/),
  })
)

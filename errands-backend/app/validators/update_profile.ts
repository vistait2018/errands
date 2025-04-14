import vine from '@vinejs/vine'

export const UpdateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string(),
    lastName: vine.string(),
    middleName: vine.string().optional(),
    sex: vine.enum(['male', 'female']),
    dateOfBirth: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format: YYYY-MM-DD
    address: vine.string(),
    addressPath: vine.string().optional(),
    addressVerified: vine.boolean().optional(),
    phoneNumber: vine.string().minLength(11).maxLength(11),
    userId: vine.number().positive().optional(),
  })
)

export const BVNValidation = vine.compile(
  vine.object({
    bvn: vine.string().regex(/^[2]\d{10}$/),
  })
)

export const NINValidation = vine.compile(
  vine.object({
    nin: vine.string().regex(/^[A-Z0-9]{10,12}$/), // Example regex for alphanumeric NIN
  })
)

export const UpdateAvatarValidator = vine.compile(
  vine.object({
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'png', 'pdf'],
    }),
  })
)

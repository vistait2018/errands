import vine from '@vinejs/vine'

export const UpdateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string(),
    lastname: vine.string(),
    middleName: vine.string().optional(),
    sex: vine.enum(['male', 'female']),
    dateOfBirth: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format: YYYY-MM-DD
    address: vine.string().optional(),
    addressPath: vine.string().optional(),
    addressVerified: vine.boolean().optional(),
    phoneNumber: vine.string(),
  })
)

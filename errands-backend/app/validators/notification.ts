import vine from '@vinejs/vine'

export const NotificationValidator = vine.compile(
  vine.object({
    recipientId: vine.number().exists(async (db, value) => {
      const user = await db.from('users').select('id').where('id', value).first()
      return !!user
    }),
    senderId: vine.number().exists(async (db, value) => {
      const user = await db.from('users').select('id').where('id', value).first()
      return !!user
    }),
    message: vine.string().minLength(10),
    status: vine.enum(['pending', 'delivered', 'read']),
  })
)

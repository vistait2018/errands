import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export const RunnerValidator = vine.compile(
  vine.object({
    // customerId: vine.number().exists(async (db, value) => {
    //   const user = await db.from('users').select('id').where('id', value).first()
    //   return !!user
    // }),
    availableDate: vine.date().afterOrEqual(DateTime.now().toISODate()),
    availableTimeStart: vine.date().afterOrEqual(DateTime.now().toISODate()),
    availableTimeEnd: vine.date().afterOrEqual(DateTime.now().toISODate()),
    locationLongitude: vine.number().min(-180).max(180),
    locationLatitude: vine.number().min(-90).max(90),
    radiusKm: vine.number(),
  })
)

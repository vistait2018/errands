import vine from '@vinejs/vine'
import ErrandEnum from '../enums/errand_enums.js'
import ErrandStatus from '../enums/errand_status.js'
import PAYMENTSTATUS from '../../app/enums/payment_status.js'
import { DateTime } from 'luxon'

export const VerifyErrand = vine.compile(
  vine.object({
    runnerId: vine
      .number()
      .exists(async (db, value) => {
        const user = await db.from('users').select('id').where('id', value).first()
        return !!user
      })
      .optional(),

    errandType: vine.enum([ErrandEnum.GROCERY_SHOPING, ErrandEnum.PICKUP_AND_DELIVER]),

    description: vine.string().minLength(10),

    status: vine.enum([
      ErrandStatus.PENDING,
      ErrandStatus.ASSIGNED,
      ErrandStatus.IN_PROGRESS,
      ErrandStatus.COMPLETED,
    ]),

    pickupAddress: vine.string().minLength(4),
    pickupLocationLatitude: vine.number().min(-90).max(90),
    pickupLocationLongitude: vine.number().min(-180).max(180),

    dropoffAddress: vine.string().minLength(4),
    dropoffLocationLatitude: vine.number().min(-90).max(90),
    dropoffLocationLongitude: vine.number().min(-180).max(180),

    assignedDate: vine.date().afterOrEqual(DateTime.now().toISODate()),
    requestDate: vine.date().equals(DateTime.now().toISODate()),
    completedDate: vine.date().afterOrEqual(DateTime.now().toISODate()),
    estimatedCost: vine.number().positive(),

    paymentStatus: vine.enum([PAYMENTSTATUS.PENDING, PAYMENTSTATUS.COMPLETED]),

    contactPersonName: vine.string().optional(),
    contactPersonPhoneNo: vine.string().optional(),
  })
)


export const UpdateErrand = vine.compile(
  vine.object({
    runnerId: vine
      .number()
      .exists(async (db, value) => {
        const user = await db.from('users').select('id').where('id', value).first()
        return !!user
      })
      .optional(),

    errandType: vine.enum([ErrandEnum.GROCERY_SHOPING, ErrandEnum.PICKUP_AND_DELIVER]),

    description: vine.string().minLength(10),

    pickupAddress: vine.string().minLength(4),
    pickupLocationLatitude: vine.number().min(-90).max(90),
    pickupLocationLongitude: vine.number().min(-180).max(180),

    dropoffAddress: vine.string().minLength(4),
    dropoffLocationLatitude: vine.number().min(-90).max(90),
    dropoffLocationLongitude: vine.number().min(-180).max(180),

    assignedDate: vine.date().afterOrEqual(DateTime.now().toISODate()),
    requestDate: vine.date().equals(DateTime.now().toISODate()),
    completedDate: vine.date().afterOrEqual(DateTime.now().toISODate()),
    estimatedCost: vine.number().positive(),

    contactPersonName: vine.string().optional(),
    contactPersonPhoneNo: vine.string().optional(),
  })
)
export const UpdateImagesCustomer = vine.compile(
  vine.object({
    documents: vine
      .array(
        vine.file({
          size: '2mb',
          extnames: ['jpg', 'png'],
        })
      )
      .maxLength(5),
  })
)

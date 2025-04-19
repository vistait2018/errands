import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import * as relations from '@adonisjs/lucid/types/relations'
import Runner from './runner.js'
import ErrandStatus from '../enums/errand_status.js'


export default class Errand extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare customerId: number

  @column()
  declare runnerId: number | null

  @column()
  declare errandType: string

  @column()
  declare description: string

  @column()
  declare pickupAddress: string

  @column()
  declare pickupLocationLongitude: number

  @column()
  declare pickupLocationLatitude: number

  @column()
  declare dropoffAddress: string

  @column()
  declare dropoffLocationLongitude: number

  @column()
  declare dropoffLocationLatitude: number

  @column()
  declare assignedDate: string | DateTime

  @column()
  declare requestDate: string | DateTime

  @column()
  declare completedDate: string | DateTime

  @column()
  declare images: string | null

  @column()
  declare estimatedCost: number

  @column()
  declare isCanceled: boolean

  @column()
  declare status: string | ErrandStatus

  @column()
  declare radiusKm: number

  @column()
  declare paymentStatus: string
  @column()
  declare contactPersonName: string
  @column()
  declare contactPersonPhoneNo: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  public customer!: relations.BelongsTo<typeof User>

  @belongsTo(() => Runner)
  public runner!: relations.BelongsTo<typeof Runner>
}

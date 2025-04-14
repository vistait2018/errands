import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import Errand from './errand.js'

export default class Runner extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare runnerId: number
  @column()
  declare customerId: number
  @column()
  declare availableDate: string
  @column()
  declare available_time_start: string
  @column()
  declare available_time_end: string
  @column()
  declare location_longitude: number
  @column()
  declare location_latitude: number
  @column()
  declare radius_km: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Errand, {
    foreignKey: 'runnerId',
  })
  public errands!: relations.HasMany<typeof Errand>
}

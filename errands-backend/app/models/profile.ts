import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import User from './user.js'
import BankInfo from './bank_info.js'

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare firstName: string | null

  @column()
  declare lastname: string | null

  @column()
  declare middleName: string | null

  @column()
  declare sex: string | null

  @column()
  declare address: string | null

  @column()
  declare addressPath: string | null

  @column()
  declare addressVerified: boolean

  @column()
  declare phoneNumber: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  public user!: relations.BelongsTo<typeof User>

  @hasOne(() => BankInfo)
  public bankInfo!: relations.HasOne<typeof BankInfo>
}

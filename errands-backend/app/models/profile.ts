import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import User from './user.js'
import BankInfo from './bank_info.js'

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare middleName: string | null

  @column()
  declare sex: string

  @column()
  declare dateOfBirth: string

  @column()
  declare address: string | null

  @column()
  declare addressPath: string 

  @column()
  declare addressVerified: boolean | null

  @column()
  declare phoneNumber: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  public user!: relations.BelongsTo<typeof User>

  @hasOne(() => BankInfo)
  public bankInfo!: relations.HasOne<typeof BankInfo>
}

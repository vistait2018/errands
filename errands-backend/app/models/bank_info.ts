import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import BankAccountType from '../enums/bank_type_enums.js'
import * as relations from '@adonisjs/lucid/types/relations'
import Profile from './profile.js'

export default class BankInfo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare profileId: number

  @column()
  declare bankName: string

  @column()
  declare bankAccountNo: string

  @column()
  declare bankAccountType: BankAccountType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Profile)
  public profile!: relations.BelongsTo<typeof Profile>
}

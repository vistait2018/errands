import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import * as relations from '@adonisjs/lucid/types/relations'

export default class Nin extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nin: string

  @column()
  declare validated: boolean

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  public user!: relations.BelongsTo<typeof User>
}

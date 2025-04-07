import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import * as relations from '@adonisjs/lucid/types/relations'
import StarEnum from '../enums/star_enums.js'


export default class Star extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare level: StarEnum | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({  autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  public user!: relations.BelongsTo<typeof User>
}

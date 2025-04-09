import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import * as relations from '@adonisjs/lucid/types/relations'
import RatingEnum from '../enums/rating_enums.js'

export default class Rating extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare rating: RatingEnum | null

  @column()
  declare raterId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  public user!: relations.BelongsTo<typeof User>
}

import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, computed, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import * as relations from '@adonisjs/lucid/types/relations'
import Role from './role.js'
import Bvn from './bvn.js'
import Rating from './rating.js'
import Feedback from './feedback.js'
import Nin from './nin.js'
import Star from './star.js'
import LoginEnum from '../enums/login_enum.js'
import Profile from './profile.js'
import Errand from './errand.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roleId: number

  @column()
  declare loginType: LoginEnum

  @column()
  declare oauthId: string | null

  @column()
  declare imagePath: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare emailConfirmed: boolean

  @column()
  declare lastLogin: DateTime | null | string

  @column()
  declare loggedIn: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare agregatedRating: number | string | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @belongsTo(() => Role)
  public role!: relations.BelongsTo<typeof Role>

  @hasOne(() => Bvn)
  public bvn!: relations.HasOne<typeof Bvn>

  @hasOne(() => Nin)
  public nin!: relations.HasOne<typeof Nin>

  @hasMany(() => Rating)
  public ratings!: relations.HasMany<typeof Rating>

  @hasMany(() => Errand, {
    foreignKey: 'customerId',
  })
  public errands!: relations.HasMany<typeof Errand>

  @hasMany(() => Feedback)
  public feedbacks!: relations.HasMany<typeof Feedback>

  @hasOne(() => Star)
  public star!: relations.HasOne<typeof Star>

  @hasOne(() => Profile)
  public profile!: relations.HasOne<typeof Profile>
}

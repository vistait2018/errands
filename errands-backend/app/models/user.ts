import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
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
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare emailConfirmed: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasOne(() => Role)
  public role!: relations.HasOne<typeof Role>

  @hasOne(() => Bvn)
  public bvn!: relations.HasOne<typeof Bvn>

  @hasOne(() => Nin)
  public nin!: relations.HasOne<typeof Nin>

  @hasOne(() => Rating)
  public rating!: relations.HasOne<typeof Rating>

  @hasOne(() => Feedback)
  public feedback!: relations.HasOne<typeof Feedback>

  @hasOne(() => Star)
  public star!: relations.HasOne<typeof Star>

  @hasOne(() => Profile)
  public profile!: relations.HasOne<typeof Profile>
}

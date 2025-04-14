import LoginEnum from '../../enums/login_enum.js'

export default class UserResponse {
  id: number
  email: string
  createdAt: string
  updatedAt: String
  isLocked: boolean
  schoolId: number
  roleId: number
  loginType: LoginEnum
  oauthId: string
  emailConfirmed: boolean

  constructor(user: any) {
    this.id = user.id
    this.email = user.email
    this.createdAt = user.createdAt
    this.schoolId = user.schoolId
    this.isLocked = user.isLocked
    this.updatedAt = user.updatedAt
    this.roleId = user.roleId
    this.loginType = user.loginType
    this.oauthId = user.oauthId
    this.emailConfirmed = user.emailConfirmed
  }
}

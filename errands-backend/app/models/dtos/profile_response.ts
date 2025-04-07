export default class ProfileResponse {
  id: number
  userId: number
  firstName: string
  lastName: string
  middleName: string
  sex: string
  address: string
  addressPath: string
  addressVerified: string
  phoneNumber: string
  createdAt: string
  updatedAt: String
  constructor(profile: any) {
    this.id = profile.id
    this.userId = profile.userId
    this.firstName = profile.firstName
    this.lastName = profile.lastName
    this.middleName = profile.middleName
    this.sex = profile.sex
    this.address = profile.address
    this.addressPath = profile.addressPath
    this.addressVerified = profile.addressVerified
    this.phoneNumber = profile.phoneNumber
    this.createdAt = profile.createdAt
    this.updatedAt = profile.updatedAt
  }
}

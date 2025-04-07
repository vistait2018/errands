export default class RoleResponse {
  id: number
  roleName: string
  createdAt: string
  updatedAt: String

  constructor(role: any) {
    this.id = role.id
    this.roleName = role.roleName
    this.createdAt = role.createdAt
    this.updatedAt = role.updatedAt

  }
}

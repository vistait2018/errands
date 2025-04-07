import { BaseSchema } from '@adonisjs/lucid/schema'
import RoleEnums from '../../app/enums/role_enums.js'


export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.enum('role_name', [RoleEnums.ADMIN, RoleEnums.USER]).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

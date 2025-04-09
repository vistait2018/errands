import { BaseSchema } from '@adonisjs/lucid/schema'
import LoginEnum from '../../app/enums/login_enum.js'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('role_id').unsigned().references('roles.id').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enum('login_type', [LoginEnum.API, LoginEnum.GOOGLE]).defaultTo(LoginEnum.API)
      table.string('oauth_id').nullable().unique()
      table.boolean('email_confirmed').defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

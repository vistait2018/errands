import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'profiles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('users.id').nullable()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('middle_name').nullable()
      table.string('sex').notNullable()
      table.string('address').notNullable()
      table.string('address_path').nullable()
      table.boolean('address_verified').defaultTo(false)
      table.string('phone_number').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'nofifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('recipient_id').unsigned().references('users.id').notNullable()
      table.bigInteger('sender_id').unsigned().references('users.id').notNullable()
      table.text('message')
      table.string('type')
      table.enum('status', ['pending', 'delivered', 'read']).defaultTo('pending')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

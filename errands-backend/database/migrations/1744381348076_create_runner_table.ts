import { BaseSchema } from '@adonisjs/lucid/schema'


export default class extends BaseSchema {
  protected tableName = 'runners'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('runner_id').unsigned().references('users.id').nullable()
      table.string('available_date')
      table.string('available_time_start')
      table.string('available_time_end')
      table.decimal('location_longitude', 15, 12).notNullable()
      table.decimal('location_latitude', 15, 12).notNullable()
      table.float('radius_km')
      table.timestamp('created_at')
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'
import ErrandEnum from '../../app/enums/errand_enums.js'
import { DateTime } from 'luxon'
import ErrandStatus from '../../app/enums/errand_status.js'
import PAYMENTSTATUS from '../../app/enums/payment_status.js'

export default class extends BaseSchema {
  protected tableName = 'errands'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('customer_id').unsigned().references('users.id').nullable()
      table.bigInteger('runner_id').unsigned().references('users.id').nullable()
      table.enum('errand_type', [ErrandEnum.GROCERY_SHOPING, ErrandEnum.PICKUP_AND_DELIVER])
      table.text('description').notNullable()
      table.enum('status', [
        ErrandStatus.PENDING,
        ErrandStatus.ASSIGNED,
        ErrandStatus.IN_PROGRESS,
        ErrandStatus.COMPLETED,
      ])

      table.string('pickup_address').notNullable()
      table.float('pickup_location_latitude').notNullable()
      table.float('pickup_location_longitude').notNullable()
      table.string('dropoff_address').defaultTo('test address')
      table.float('dropoff_location_latitude').notNullable()
      table.float('dropoff_location_longitude').notNullable()
      table.string('assigned_date').notNullable()
      table.string('request_date').notNullable()
      table.string('completed_date').nullable()
      table.string('images').nullable()
      table.string('estimated_cost').notNullable()
      table.enum('payment_status', [PAYMENTSTATUS.PENDING, PAYMENTSTATUS.COMPLETED])
      table.string('contact_person_name').notNullable()
      table.string('contact_person_phone_no').notNullable()
      table.timestamp('created_at').nullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

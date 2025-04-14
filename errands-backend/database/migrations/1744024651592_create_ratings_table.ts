import { BaseSchema } from '@adonisjs/lucid/schema'
import RatingEnum from '../../app/enums/rating_enums.js'

export default class extends BaseSchema {
  protected tableName = 'ratings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('users.id').nullable()
      table.integer('rating').defaultTo(RatingEnum.NO_STAR)
      table.bigInteger('rater_id').unsigned().references('users.id').nullable()
      table.bigInteger('errand_id').unsigned().references('errands.id').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

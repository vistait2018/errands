import { BaseSchema } from '@adonisjs/lucid/schema'
import RatingEnum from '../../app/enums/rating_enums.js'

export default class extends BaseSchema {
  protected tableName = 'ratings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('users.id').nullable()
      table
        .enum('rating', [
          RatingEnum.NO_STAR,
          RatingEnum.ONE_STAR,
          RatingEnum.TWO_STAR,
          RatingEnum.THREE_STAR,
          RatingEnum.FOUR_STAR,
          RatingEnum.FIVE_STAR,
        ])
        .defaultTo(RatingEnum.NO_STAR)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

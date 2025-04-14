import { BaseSchema } from '@adonisjs/lucid/schema'
import StarEnum from '../../app/enums/star_enums.js'

export default class extends BaseSchema {
  protected tableName = 'stars'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('user_id').unsigned().references('users.id').nullable()
      table
        .enum('level', [
          StarEnum.BRASS,
          StarEnum.BRONZE,
          StarEnum.SILVER,
          StarEnum.GOLD,
          StarEnum.PLATIMUN,
        ])
        .defaultTo(StarEnum.BRASS)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

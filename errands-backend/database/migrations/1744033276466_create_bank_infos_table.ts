import { BaseSchema } from '@adonisjs/lucid/schema'
import BankAccountType from '../../app/enums/bank_type_enums.js'

export default class extends BaseSchema {
  protected tableName = 'bank_infos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('profile_id').unsigned().references('profiles.id').nullable()
      table.string('bank_name').notNullable()
      table.string('bank_account_no').notNullable()
      table
        .enum('bank_account_type', [
          BankAccountType.SAVING,
          BankAccountType.CURRENT,
          BankAccountType.DEFAULT,
        ])
        .notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

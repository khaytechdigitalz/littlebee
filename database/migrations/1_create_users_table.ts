import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('full_name', 150).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password_hash', 180).notNullable()
      table.string('country', 100).nullable()
      table.enum('role', ['user', 'admin']).notNullable().defaultTo('user')
      table.enum('account_type', ['demo', 'live']).notNullable().defaultTo('demo')
      table.boolean('is_verified').notNullable().defaultTo(false) // KYC status, tier stored in kyc_documents
      table.string('transaction_pin_hash', 180).nullable()
      table.string('two_factor_secret', 100).nullable()
      table.boolean('is_2fa_enabled').notNullable().defaultTo(false)
      table.boolean('is_suspended').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['role'])
      table.index(['is_suspended'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

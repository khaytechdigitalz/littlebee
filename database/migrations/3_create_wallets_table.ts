import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.enum('mode', ['demo', 'live']).notNullable().defaultTo('demo')
      table.string('currency_code', 12).notNullable() // BTC, ETH, USDT, USD, EUR...
      table.string('address', 191).nullable() // on-chain address (live crypto wallets only)
      table.string('qr_code_url', 500).nullable()
      table.string('label', 191).nullable()
      table.string('coinremitter_wallet_id', 191).nullable()
      table.decimal('balance', 24, 8).notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.unique(['user_id', 'mode', 'currency_code'])
      table.index(['address'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

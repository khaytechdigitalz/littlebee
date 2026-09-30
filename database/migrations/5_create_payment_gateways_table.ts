import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_gateways'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 150).notNullable() // "Coinremitter BTC", "Bank Wire", ...
      table.enum('type', ['crypto', 'fiat']).notNullable()
      table.string('coin_symbol', 12).nullable() // BTC/ETH/USDT/LTC/DOGE/BNB for crypto gateways
      table.string('deposit_address_or_iban', 255).nullable()
      table.string('qr_code_url', 500).nullable()
      table.text('instructions').nullable()
      table.decimal('min_deposit', 18, 8).notNullable().defaultTo(0)
      table.decimal('max_deposit', 18, 8).nullable()
      table.decimal('deposit_fee_percentage', 5, 2).notNullable().defaultTo(0)
      table.decimal('withdrawal_fee_percentage', 5, 2).notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['type', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

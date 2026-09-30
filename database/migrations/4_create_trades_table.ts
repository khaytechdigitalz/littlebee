import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'trades'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.enum('mode', ['demo', 'live']).notNullable().defaultTo('demo')
      table.enum('market_type', ['crypto', 'stock', 'forex']).notNullable()
      table.string('symbol', 32).notNullable() // e.g. BTC/USDT, AAPL, EUR/USD
      table.enum('trade_type', ['long', 'short']).notNullable()
      table.enum('order_type', ['market', 'limit', 'stop']).notNullable().defaultTo('market')

      table.decimal('entry_price', 18, 8).notNullable()
      table.decimal('exit_price', 18, 8).nullable()
      table.decimal('leverage', 6, 2).notNullable().defaultTo(1)
      table.decimal('position_size', 18, 8).notNullable() // notional size in quote currency
      table.decimal('margin_used', 18, 8).notNullable()
      table.decimal('sl_price', 18, 8).nullable()
      table.decimal('tp_price', 18, 8).nullable()

      // 'open' | 'closed' — closed automatically by TradeExecutionService when the
      // live/delayed price feed crosses sl_price, tp_price, or the user requests a
      // manual close. No admin action ever appears in this lifecycle — see
      // app/services/trade_execution_service.ts.
      table.enum('status', ['open', 'closed']).notNullable().defaultTo('open')
      table.string('close_reason', 20).nullable() // 'sl' | 'tp' | 'manual' | 'liquidation'
      table.decimal('pnl', 18, 8).nullable()

      table.timestamp('opened_at').notNullable()
      table.timestamp('closed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.index(['user_id', 'mode', 'status'])
      table.index(['symbol', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

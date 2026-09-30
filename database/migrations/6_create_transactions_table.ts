import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.integer('wallet_id').unsigned().notNullable()
      table.integer('gateway_id').unsigned().nullable()
      table.enum('mode', ['demo', 'live']).notNullable().defaultTo('demo')
      table.enum('type', ['deposit', 'withdrawal']).notNullable()

      table.decimal('amount', 24, 8).notNullable()
      table.decimal('fee', 24, 8).notNullable().defaultTo(0)
      table.string('blockchain_txid', 191).nullable()
      table.string('payment_proof_url', 500).nullable()
      table.string('destination_address', 255).nullable() // withdrawal recipient (address or IBAN)

      table.enum('status', ['pending', 'approved', 'declined', 'completed']).notNullable().defaultTo('pending')
      table.text('admin_note').nullable()
      table.integer('reviewed_by').unsigned().nullable() // admin user id, for withdrawals/fiat deposits only

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.foreign('wallet_id').references('wallets.id').onDelete('CASCADE')
      table.foreign('gateway_id').references('payment_gateways.id').onDelete('SET NULL')
      table.foreign('reviewed_by').references('users.id').onDelete('SET NULL')

      // Idempotency guard for Coinremitter webhook reconciliation.
      table.unique(['blockchain_txid'])
      table.index(['user_id', 'type', 'status'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

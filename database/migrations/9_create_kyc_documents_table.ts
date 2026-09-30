import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kyc_documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.integer('tier_level').notNullable() // 1 = basic, 2 = ID, 3 = proof of address
      table.string('document_type', 100).notNullable() // passport, drivers_license, national_id, utility_bill...
      table.string('document_url', 500).notNullable()
      table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending')
      table.text('rejection_reason').nullable()
      table.integer('reviewed_by').unsigned().nullable()
      table.timestamp('reviewed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.foreign('reviewed_by').references('users.id').onDelete('SET NULL')
      table.index(['user_id', 'tier_level'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

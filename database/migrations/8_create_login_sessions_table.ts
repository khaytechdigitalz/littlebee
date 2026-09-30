import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'login_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().notNullable()
      table.string('ip_address', 45).notNullable()
      table.string('device_type', 100).nullable() // "Chrome on macOS", "Safari on iOS", ...
      table.string('location', 150).nullable()
      table.boolean('is_current').notNullable().defaultTo(false)
      table.boolean('revoked').notNullable().defaultTo(false)
      table.timestamp('last_active').notNullable()
      table.timestamp('created_at').notNullable()

      table.foreign('user_id').references('users.id').onDelete('CASCADE')
      table.index(['user_id', 'revoked'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

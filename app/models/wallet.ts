import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#app/models/user'

export default class Wallet extends BaseModel {
  static table = 'wallets'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare mode: 'demo' | 'live'

  @column()
  declare currencyCode: string

  @column()
  declare address: string | null

  @column()
  declare qrCodeUrl: string | null

  @column()
  declare label: string | null

  @column()
  declare coinremitterWalletId: string | null

  @column()
  declare balance: string // DECIMAL comes back as string from mysql2 — cast at the call site

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

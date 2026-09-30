import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#app/models/user'

export default class Trade extends BaseModel {
  static table = 'trades'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare mode: 'demo' | 'live'

  @column()
  declare marketType: 'crypto' | 'stock' | 'forex'

  @column()
  declare symbol: string

  @column()
  declare tradeType: 'long' | 'short'

  @column()
  declare orderType: 'market' | 'limit' | 'stop'

  @column()
  declare entryPrice: string

  @column()
  declare exitPrice: string | null

  @column()
  declare leverage: string

  @column()
  declare positionSize: string

  @column()
  declare marginUsed: string

  @column()
  declare slPrice: string | null

  @column()
  declare tpPrice: string | null

  @column()
  declare status: 'open' | 'closed'

  @column()
  declare closeReason: 'sl' | 'tp' | 'manual' | 'liquidation' | null

  @column()
  declare pnl: string | null

  @column.dateTime()
  declare openedAt: DateTime

  @column.dateTime()
  declare closedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#app/models/user'

export default class LoginSession extends BaseModel {
  static table = 'login_sessions'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare ipAddress: string

  @column()
  declare deviceType: string | null

  @column()
  declare location: string | null

  @column()
  declare isCurrent: boolean

  @column()
  declare revoked: boolean

  @column.dateTime()
  declare lastActive: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

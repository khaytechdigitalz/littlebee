import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#app/models/user'

export default class KycDocument extends BaseModel {
  static table = 'kyc_documents'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare tierLevel: number

  @column()
  declare documentType: string

  @column()
  declare documentUrl: string

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare rejectionReason: string | null

  @column()
  declare reviewedBy: number | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#app/models/user'
import Wallet from '#app/models/wallet'
import PaymentGateway from '#app/models/payment_gateway'

export default class Transaction extends BaseModel {
  static table = 'transactions'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare walletId: number

  @column()
  declare gatewayId: number | null

  @column()
  declare mode: 'demo' | 'live'

  @column()
  declare type: 'deposit' | 'withdrawal'

  @column()
  declare amount: string

  @column()
  declare fee: string

  @column()
  declare blockchainTxid: string | null

  @column()
  declare paymentProofUrl: string | null

  @column()
  declare destinationAddress: string | null

  @column()
  declare status: 'pending' | 'approved' | 'declined' | 'completed'

  @column()
  declare adminNote: string | null

  @column()
  declare reviewedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Wallet)
  declare wallet: BelongsTo<typeof Wallet>

  @belongsTo(() => PaymentGateway, { foreignKey: 'gatewayId' })
  declare gateway: BelongsTo<typeof PaymentGateway>
}

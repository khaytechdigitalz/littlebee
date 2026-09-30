import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class PaymentGateway extends BaseModel {
  static table = 'payment_gateways'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: 'crypto' | 'fiat'

  @column()
  declare coinSymbol: string | null

  @column()
  declare depositAddressOrIban: string | null

  @column()
  declare qrCodeUrl: string | null

  @column()
  declare instructions: string | null

  @column()
  declare minDeposit: string

  @column()
  declare maxDeposit: string | null

  @column()
  declare depositFeePercentage: string

  @column()
  declare withdrawalFeePercentage: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

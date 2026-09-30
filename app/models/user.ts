import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, computed } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Wallet from '#app/models/wallet'
import Trade from '#app/models/trade'
import Transaction from '#app/models/transaction'
import LoginSession from '#app/models/login_session'
import KycDocument from '#app/models/kyc_document'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'passwordHash',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static accessTokens = DbAccessTokensProvider.forModel(User)

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare passwordHash: string

  @column()
  declare country: string | null

  @column()
  declare role: 'user' | 'admin'

  @column()
  declare accountType: 'demo' | 'live'

  @column()
  declare isVerified: boolean

  @column({ serializeAs: null })
  declare transactionPinHash: string | null

  @column({ serializeAs: null })
  declare twoFactorSecret: string | null

  @column()
  declare is2faEnabled: boolean

  @column()
  declare isSuspended: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Wallet)
  declare wallets: HasMany<typeof Wallet>

  @hasMany(() => Trade)
  declare trades: HasMany<typeof Trade>

  @hasMany(() => Transaction)
  declare transactions: HasMany<typeof Transaction>

  @hasMany(() => LoginSession)
  declare loginSessions: HasMany<typeof LoginSession>

  @hasMany(() => KycDocument)
  declare kycDocuments: HasMany<typeof KycDocument>

  get isAdmin() {
    return this.role === 'admin'
  }

  /** Exposed in place of transactionPinHash (which is never serialized) so clients can check "is a PIN set" without seeing the hash. */
  @computed()
  get hasTransactionPin() {
    return Boolean(this.transactionPinHash)
  }
}

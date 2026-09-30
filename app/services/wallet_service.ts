/**
 * All wallet balance mutations go through creditWallet/debitWallet, which
 * lock the row for the duration of an atomic transaction. This is what
 * CoinremitterWebhookController relies on for safe concurrent deposit
 * crediting, and what TradeExecutionService relies on for safe concurrent
 * PnL settlement.
 */
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Wallet from '#app/models/wallet'
import User from '#app/models/user'
import CoinremitterService from '#app/services/coinremitter_service'
import type { CoinSymbol } from '#config/coinremitter'

const CRYPTO_COINS: CoinSymbol[] = ['BTC', 'ETH', 'USDT', 'LTC', 'DOGE', 'BNB']
const DEFAULT_DEMO_BALANCE = 10_000

export default class WalletService {
  constructor(private coinremitter = new CoinremitterService()) {}

  /**
   * Creates a wallet row for the user. Live crypto wallets get a real
   * Coinremitter on-chain address; demo wallets and live fiat wallets do
   * not touch Coinremitter at all.
   */
  async generateWallet(user: User, currencyCode: string, mode: 'demo' | 'live'): Promise<Wallet> {
    const existing = await Wallet.query()
      .where('userId', user.id)
      .andWhere('mode', mode)
      .andWhere('currencyCode', currencyCode)
      .first()
    if (existing) return existing

    const wallet = new Wallet()
    wallet.userId = user.id
    wallet.mode = mode
    wallet.currencyCode = currencyCode
    wallet.balance = mode === 'demo' && currencyCode === 'USD' ? String(DEFAULT_DEMO_BALANCE) : '0'
    wallet.isActive = true

    const isLiveCrypto = mode === 'live' && CRYPTO_COINS.includes(currencyCode as CoinSymbol)
    if (isLiveCrypto) {
      const coin = currencyCode as CoinSymbol
      if (!this.coinremitter.isActive(coin)) {
        throw new Error(`${coin} deposits are not currently available`)
      }
      const result = await this.coinremitter.createAddress(coin, `user-${user.id}-${coin.toLowerCase()}`)
      wallet.address = result.address
      wallet.qrCodeUrl = result.qrCode
      wallet.label = result.label
      wallet.coinremitterWalletId = result.coinremitterWalletId
    }

    await wallet.save()
    return wallet
  }

  /** Seeds a fresh live-mode user's default wallets (USD fiat only; crypto wallets are generated on demand). */
  async provisionDefaultWallets(user: User) {
    await this.generateWallet(user, 'USD', 'demo')
    await this.generateWallet(user, 'USD', 'live')
  }

  async creditWallet(walletId: number, amount: number, trx?: TransactionClientContract): Promise<Wallet> {
    const run = async (t: TransactionClientContract) => {
      const wallet = await Wallet.query({ client: t }).where('id', walletId).forUpdate().firstOrFail()
      wallet.balance = String(Number(wallet.balance) + amount)
      wallet.useTransaction(t)
      await wallet.save()
      return wallet
    }
    return trx ? run(trx) : db.transaction(run)
  }

  async debitWallet(walletId: number, amount: number, trx?: TransactionClientContract): Promise<Wallet> {
    const run = async (t: TransactionClientContract) => {
      const wallet = await Wallet.query({ client: t }).where('id', walletId).forUpdate().firstOrFail()
      const balance = Number(wallet.balance)
      if (balance < amount) {
        throw new Error('Insufficient wallet balance')
      }
      wallet.balance = String(balance - amount)
      wallet.useTransaction(t)
      await wallet.save()
      return wallet
    }
    return trx ? run(trx) : db.transaction(run)
  }
}

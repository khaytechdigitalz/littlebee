import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Transaction from '#app/models/transaction'
import Wallet from '#app/models/wallet'
import CoinremitterService from '#app/services/coinremitter_service'
import type { CoinSymbol } from '#config/coinremitter'
import { reviewTransactionValidator } from '#app/validators/admin_validator'

const CRYPTO_COINS: CoinSymbol[] = ['BTC', 'ETH', 'USDT', 'LTC', 'DOGE', 'BNB']

export default class AdminTransactionsController {
  private coinremitter = new CoinremitterService()

  async index({ request, response }: HttpContext) {
    const { type, status = 'pending', mode = 'live', page = 1 } = request.qs()
    const query = Transaction.query().where('mode', mode).preload('user', (q) => q.select('id', 'fullName', 'email'))
    if (type) query.andWhere('type', type)
    if (status) query.andWhere('status', status)

    const transactions = await query.orderBy('createdAt', 'desc').paginate(Number(page), 25)
    return response.ok(transactions)
  }

  /**
   * Deposits (fiat, or crypto that for some reason wasn't auto-credited by
   * the webhook) are approved manually by an admin reviewing the uploaded
   * receipt / bank confirmation. Approving credits the wallet exactly once.
   */
  async reviewDeposit({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const { action, note } = await request.validateUsing(reviewTransactionValidator)

    const transaction = await Transaction.findOrFail(params.id)
    if (transaction.type !== 'deposit') return response.badRequest({ message: 'Not a deposit' })
    if (transaction.status !== 'pending') return response.badRequest({ message: 'Already reviewed' })

    if (action === 'decline') {
      transaction.status = 'declined'
      transaction.adminNote = note ?? null
      transaction.reviewedBy = admin.id
      await transaction.save()
      return response.ok({ transaction })
    }

    await db.transaction(async (trx) => {
      const wallet = await Wallet.query({ client: trx }).where('id', transaction.walletId).forUpdate().firstOrFail()
      wallet.balance = String(Number(wallet.balance) + Number(transaction.amount))
      wallet.useTransaction(trx)
      await wallet.save()

      transaction.status = 'completed'
      transaction.adminNote = note ?? null
      transaction.reviewedBy = admin.id
      transaction.useTransaction(trx)
      await transaction.save()
    })

    return response.ok({ transaction })
  }

  /**
   * Withdrawal approval: funds were already debited from the wallet at
   * request time (see TransactionsController#createWithdrawal), so approval
   * here only ever triggers the actual on-chain Coinremitter payout — the
   * admin cannot alter the amount, destination, or PnL of anything. Decline
   * refunds the held balance back to the wallet.
   */
  async reviewWithdrawal({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const { action, note } = await request.validateUsing(reviewTransactionValidator)

    const transaction = await Transaction.findOrFail(params.id)
    if (transaction.type !== 'withdrawal') return response.badRequest({ message: 'Not a withdrawal' })
    if (transaction.status !== 'pending') return response.badRequest({ message: 'Already reviewed' })

    const wallet = await Wallet.findOrFail(transaction.walletId)

    if (action === 'decline') {
      await db.transaction(async (trx) => {
        const lockedWallet = await Wallet.query({ client: trx }).where('id', wallet.id).forUpdate().firstOrFail()
        lockedWallet.balance = String(Number(lockedWallet.balance) + Number(transaction.amount))
        lockedWallet.useTransaction(trx)
        await lockedWallet.save()

        transaction.status = 'declined'
        transaction.adminNote = note ?? null
        transaction.reviewedBy = admin.id
        transaction.useTransaction(trx)
        await transaction.save()
      })
      return response.ok({ transaction, message: 'Withdrawal declined and refunded' })
    }

    // Approve → execute the real payout.
    const isCrypto = CRYPTO_COINS.includes(wallet.currencyCode as CoinSymbol)
    if (isCrypto && transaction.mode === 'live') {
      try {
        const result = await this.coinremitter.withdraw(
          wallet.currencyCode as CoinSymbol,
          transaction.destinationAddress!,
          String(Number(transaction.amount) - Number(transaction.fee)),
          `LittleBee withdrawal #${transaction.id}`,
        )
        transaction.blockchainTxid = result.txid
      } catch (error) {
        return response.internalServerError({ message: `Coinremitter payout failed: ${error.message}` })
      }
    }

    transaction.status = 'completed'
    transaction.adminNote = note ?? null
    transaction.reviewedBy = admin.id
    await transaction.save()

    return response.ok({ transaction })
  }
}

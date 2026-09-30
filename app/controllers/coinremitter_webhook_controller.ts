import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Wallet from '#app/models/wallet'
import Transaction from '#app/models/transaction'
import CoinremitterService from '#app/services/coinremitter_service'
import coinremitterConfig, { type CoinSymbol } from '#config/coinremitter'

/**
 * POST /api/webhooks/coinremitter — unauthenticated (Coinremitter's servers
 * call this directly), but every request is verified against Coinremitter's
 * own verify-ipn endpoint before anything is trusted. This is the ONLY path
 * that credits a live wallet from a crypto deposit.
 */
export default class CoinremitterWebhookController {
  private coinremitter = new CoinremitterService()

  async handle({ request, response }: HttpContext) {
    const payload = request.body() as Record<string, any>
    const coin = String(payload.coin_symbol ?? payload.coin ?? '').toUpperCase() as CoinSymbol

    if (!coin || !(coin in coinremitterConfig.coins)) {
      return response.badRequest({ message: 'Unknown coin' })
    }

    // 1. Verify this callback actually came from Coinremitter (anti-spoofing/replay).
    const isVerified = await this.coinremitter.verifyIpn(coin, payload)
    if (!isVerified) {
      return response.unauthorized({ message: 'IPN verification failed' })
    }

    const address = String(payload.address ?? '')
    const amount = Number(payload.amount ?? 0)
    const txid = String(payload.txid ?? payload.transaction_hash ?? '')
    const confirmations = Number(payload.confirmations ?? 0)
    const status = String(payload.status ?? '').toLowerCase() // e.g. 'paid' | 'processing' | 'completed'

    if (!address || !txid || amount <= 0) {
      return response.badRequest({ message: 'Malformed IPN payload' })
    }

    // 2. Idempotency — Coinremitter may resend the same callback multiple times as confirmations climb.
    const existing = await Transaction.findBy('blockchainTxid', txid)
    if (existing?.status === 'completed') {
      return response.ok({ message: 'Already processed' })
    }

    const isConfirmed = status === 'paid' || status === 'completed' || confirmations >= coinremitterConfig.minConfirmations
    if (!isConfirmed) {
      // Not enough confirmations yet — acknowledge receipt, take no balance action.
      return response.ok({ message: 'Awaiting confirmations' })
    }

    // 3. Identify the wallet this address belongs to.
    const wallet = await Wallet.query().where('address', address).andWhere('currencyCode', coin).first()
    if (!wallet) {
      return response.notFound({ message: 'No wallet matches this deposit address' })
    }

    // 4. Atomically credit the wallet and record/complete the transaction.
    await db.transaction(async (trx) => {
      const lockedWallet = await Wallet.query({ client: trx }).where('id', wallet.id).forUpdate().firstOrFail()
      lockedWallet.balance = String(Number(lockedWallet.balance) + amount)
      lockedWallet.useTransaction(trx)
      await lockedWallet.save()

      if (existing) {
        existing.status = 'completed'
        existing.blockchainTxid = txid
        existing.useTransaction(trx)
        await existing.save()
      } else {
        const created = new Transaction()
        created.userId = lockedWallet.userId
        created.walletId = lockedWallet.id
        created.mode = 'live'
        created.type = 'deposit'
        created.amount = String(amount)
        created.blockchainTxid = txid
        created.status = 'completed'
        created.useTransaction(trx)
        await created.save()
      }
    })

    // 5. Real-time dashboard push — wire to your WS/broadcast layer of choice
    // (Adonis Transmit, a Redis pub/sub → socket.io bridge, etc.). Left as a
    // named extension point rather than a hardcoded dependency.
    // await Transmit.broadcast(`user/${wallet.userId}/wallet`, { walletId: wallet.id })

    return response.ok({ message: 'Deposit credited' })
  }
}

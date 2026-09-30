import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import Wallet from '#app/models/wallet'
import Transaction from '#app/models/transaction'
import PaymentGateway from '#app/models/payment_gateway'
import CoinremitterService from '#app/services/coinremitter_service'
import type { CoinSymbol } from '#config/coinremitter'
import { depositValidator, withdrawalValidator } from '#app/validators/transaction_validator'

const CRYPTO_COINS: CoinSymbol[] = ['BTC', 'ETH', 'USDT', 'LTC', 'DOGE', 'BNB']

export default class TransactionsController {
  private coinremitter = new CoinremitterService()

  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { type, status } = request.qs()

    const query = Transaction.query().where('userId', user.id).andWhere('mode', user.accountType)
    if (type) query.andWhere('type', type)
    if (status) query.andWhere('status', status)

    const transactions = await query.orderBy('createdAt', 'desc').limit(200)
    return response.ok({ transactions })
  }

  /**
   * Records a deposit request. Crypto deposits are actually credited by
   * CoinremitterWebhookController when the on-chain payment confirms — this
   * endpoint just registers the user's intent (and, for fiat, a receipt for
   * manual admin review). No balance changes here.
   */
  async createDeposit({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(depositValidator)

    const wallet = await Wallet.query().where('id', data.walletId).andWhere('userId', user.id).first()
    if (!wallet) return response.notFound({ message: 'Wallet not found' })

    const gateway = data.gatewayId ? await PaymentGateway.find(data.gatewayId) : null
    if (gateway && data.amount < Number(gateway.minDeposit)) {
      return response.badRequest({ message: `Minimum deposit for this method is ${gateway.minDeposit}` })
    }

    const transaction = await Transaction.create({
      userId: user.id,
      walletId: wallet.id,
      gatewayId: gateway?.id ?? null,
      mode: user.accountType,
      type: 'deposit',
      amount: data.amount,
      paymentProofUrl: data.paymentProofUrl ?? null,
      status: user.accountType === 'demo' ? 'completed' : 'pending',
    })

    // Demo deposits credit instantly — they never touch a real payment rail.
    if (user.accountType === 'demo') {
      wallet.balance = String(Number(wallet.balance) + data.amount)
      await wallet.save()
    }

    return response.created({ transaction })
  }

  /**
   * Withdrawal request flow per spec:
   *  1. Verify transaction PIN
   *  2. Validate recipient address via Coinremitter (crypto only)
   *  3. Estimate network fee via Coinremitter (crypto only)
   *  4. Store as 'pending' — actual on-chain payout happens only after an
   *     admin approves it (AdminTransactionsController#reviewWithdrawal),
   *     never automatically and never decided by anything other than the
   *     Coinremitter payout call itself.
   */
  async createWithdrawal({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(withdrawalValidator)

    if (!user.transactionPinHash) {
      return response.badRequest({ message: 'Set a transaction PIN before withdrawing' })
    }
    const pinValid = await hash.verify(user.transactionPinHash, data.pin)
    if (!pinValid) {
      return response.unauthorized({ message: 'Incorrect transaction PIN' })
    }
    if (user.is2faEnabled && !data.twoFactorCode) {
      return response.badRequest({ message: '2FA code required' })
    }

    const wallet = await Wallet.query().where('id', data.walletId).andWhere('userId', user.id).first()
    if (!wallet) return response.notFound({ message: 'Wallet not found' })
    if (Number(wallet.balance) < data.amount) {
      return response.badRequest({ message: 'Insufficient balance' })
    }

    let fee = 0
    const isCrypto = CRYPTO_COINS.includes(wallet.currencyCode as CoinSymbol)

    if (isCrypto && user.accountType === 'live') {
      const coin = wallet.currencyCode as CoinSymbol
      const isValidAddress = await this.coinremitter.validateAddress(coin, data.destinationAddress).catch(() => false)
      if (!isValidAddress) {
        return response.badRequest({ message: 'Invalid destination address' })
      }
      const estimate = await this.coinremitter
        .estimateWithdrawFee(coin, String(data.amount), data.speed ?? 'medium')
        .catch(() => null)
      fee = estimate ? Number(estimate.fee) : 0
    }

    // Funds are held (debited) immediately so a user can't spend them twice
    // while the withdrawal is pending admin review; a decline refunds them.
    wallet.balance = String(Number(wallet.balance) - data.amount)
    await wallet.save()

    const transaction = await Transaction.create({
      userId: user.id,
      walletId: wallet.id,
      mode: user.accountType,
      type: 'withdrawal',
      amount: data.amount,
      fee,
      destinationAddress: data.destinationAddress,
      status: user.accountType === 'demo' ? 'completed' : 'pending',
    })

    return response.created({ transaction })
  }
}

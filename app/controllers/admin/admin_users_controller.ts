import type { HttpContext } from '@adonisjs/core/http'
import User from '#app/models/user'
import Wallet from '#app/models/wallet'
import Transaction from '#app/models/transaction'
import WalletService from '#app/services/wallet_service'
import { adjustWalletValidator } from '#app/validators/admin_validator'

export default class AdminUsersController {
  private wallets = new WalletService()

  async index({ request, response }: HttpContext) {
    const { q, page = 1 } = request.qs()
    const query = User.query().where('role', 'user')
    if (q) {
      query.where((builder) => {
        builder.whereILike('fullName', `%${q}%`).orWhereILike('email', `%${q}%`)
      })
    }
    const users = await query.orderBy('createdAt', 'desc').paginate(Number(page), 25)
    return response.ok(users)
  }

  async show({ params, response }: HttpContext) {
    const user = await User.query()
      .where('id', params.id)
      .preload('wallets')
      .preload('kycDocuments')
      .first()
    if (!user) return response.notFound({ message: 'User not found' })
    return response.ok({ user })
  }

  async suspend({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.isSuspended = true
    await user.save()
    return response.ok({ user })
  }

  async unsuspend({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    user.isSuspended = false
    await user.save()
    return response.ok({ user })
  }

  /**
   * Manual balance adjustment — for demo-fund top-ups/resets or live-side
   * accounting corrections (e.g. an off-chain fiat wire an admin confirmed
   * manually). This is intentionally the ONLY place an admin can move
   * wallet balances directly; it is fully separate from — and has no path
   * into — trade PnL, which only ever comes from TradeExecutionService.
   */
  async adjustWallet({ auth, request, response }: HttpContext) {
    const admin = auth.user!
    const data = await request.validateUsing(adjustWalletValidator)

    const wallet = await Wallet.query().where('id', data.walletId).andWhere('userId', data.userId).first()
    if (!wallet) return response.notFound({ message: 'Wallet not found' })

    if (wallet.mode === 'live' && data.amount < 0 && Number(wallet.balance) < Math.abs(data.amount)) {
      return response.badRequest({ message: 'Insufficient balance for this debit' })
    }

    const updated =
      data.amount >= 0
        ? await this.wallets.creditWallet(wallet.id, data.amount)
        : await this.wallets.debitWallet(wallet.id, Math.abs(data.amount))

    await Transaction.create({
      userId: data.userId,
      walletId: wallet.id,
      mode: wallet.mode,
      type: data.amount >= 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(data.amount),
      status: 'completed',
      adminNote: data.reason,
      reviewedBy: admin.id,
    })

    return response.ok({ wallet: updated })
  }

  /** Resets a user's demo wallets back to the platform default — never touches live balances. */
  async resetDemoBalance({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const demoWallets = await Wallet.query().where('userId', user.id).andWhere('mode', 'demo')
    for (const wallet of demoWallets) {
      wallet.balance = wallet.currencyCode === 'USD' ? '10000' : '0'
      await wallet.save()
    }
    return response.ok({ message: 'Demo balances reset' })
  }
}

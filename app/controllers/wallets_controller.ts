import type { HttpContext } from '@adonisjs/core/http'
import Wallet from '#app/models/wallet'
import Transaction from '#app/models/transaction'
import WalletService from '#app/services/wallet_service'
import { generateWalletValidator } from '#app/validators/transaction_validator'

export default class WalletsController {
  private wallets = new WalletService()

  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const mode = (request.qs().mode as 'demo' | 'live') ?? user.accountType

    const wallets = await Wallet.query().where('userId', user.id).andWhere('mode', mode)
    return response.ok({ wallets })
  }

  /** POST /api/wallets/generate — per spec, invokes Coinremitter create-address for live crypto currencies. */
  async generate({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { currencyCode } = await request.validateUsing(generateWalletValidator)
    const mode = (request.input('mode') as 'demo' | 'live') ?? user.accountType

    try {
      const wallet = await this.wallets.generateWallet(user, currencyCode.toUpperCase(), mode)
      return response.created({ wallet })
    } catch (error) {
      return response.badRequest({ message: error.message })
    }
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const wallet = await Wallet.query().where('id', params.id).andWhere('userId', user.id).first()
    if (!wallet) return response.notFound({ message: 'Wallet not found' })
    return response.ok({ wallet })
  }

  /** Transaction history scoped strictly to this one wallet. */
  async transactions({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const wallet = await Wallet.query().where('id', params.id).andWhere('userId', user.id).first()
    if (!wallet) return response.notFound({ message: 'Wallet not found' })

    const transactions = await Transaction.query()
      .where('walletId', wallet.id)
      .orderBy('createdAt', 'desc')
      .limit(100)

    return response.ok({ transactions })
  }
}

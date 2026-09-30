import type { HttpContext } from '@adonisjs/core/http'
import User from '#app/models/user'
import Trade from '#app/models/trade'
import Transaction from '#app/models/transaction'
import Wallet from '#app/models/wallet'

export default class AdminDashboardController {
  async summary({ request, response }: HttpContext) {
    const mode = (request.qs().mode as 'demo' | 'live') ?? 'live'

    const [userCount, openTrades, pendingDeposits, pendingWithdrawals, liveBalanceRow] = await Promise.all([
      User.query().where('role', 'user').count('* as total').first(),
      Trade.query().where('mode', mode).andWhere('status', 'open').count('* as total').first(),
      Transaction.query().where('mode', mode).andWhere('type', 'deposit').andWhere('status', 'pending').count('* as total').first(),
      Transaction.query().where('mode', mode).andWhere('type', 'withdrawal').andWhere('status', 'pending').count('* as total').first(),
      Wallet.query().where('mode', mode).andWhere('currencyCode', 'USD').sum('balance as total').first(),
    ])

    return response.ok({
      mode,
      totalUsers: Number((userCount as any)?.$extras?.total ?? 0),
      openTrades: Number((openTrades as any)?.$extras?.total ?? 0),
      pendingDeposits: Number((pendingDeposits as any)?.$extras?.total ?? 0),
      pendingWithdrawals: Number((pendingWithdrawals as any)?.$extras?.total ?? 0),
      totalUsdBalance: Number((liveBalanceRow as any)?.$extras?.total ?? 0),
    })
  }

  /** Live stream-friendly snapshot of every open position, for the "Trade Execution Control Room" view — read only. */
  async openPositions({ request, response }: HttpContext) {
    const mode = (request.qs().mode as 'demo' | 'live') ?? 'live'
    const trades = await Trade.query()
      .where('mode', mode)
      .andWhere('status', 'open')
      .preload('user', (q) => q.select('id', 'fullName', 'email'))
      .orderBy('openedAt', 'desc')
      .limit(200)

    return response.ok({ trades })
  }
}

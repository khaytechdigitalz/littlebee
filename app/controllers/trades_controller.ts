import type { HttpContext } from '@adonisjs/core/http'
import Trade from '#app/models/trade'
import Wallet from '#app/models/wallet'
import TradeExecutionService from '#app/services/trade_execution_service'
import { openTradeValidator } from '#app/validators/trade_validator'

export default class TradesController {
  private engine = new TradeExecutionService()

  /** All open + recently closed positions for the current user, mark-to-market on every request. */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const trades = await Trade.query()
      .where('userId', user.id)
      .andWhere('mode', user.accountType)
      .orderBy('createdAt', 'desc')
      .limit(100)

    const withMarks = await Promise.all(
      trades.map(async (trade) => {
        if (trade.status !== 'open') return { ...trade.serialize() }
        try {
          const mark = await this.engine.markToMarket(trade)
          return { ...trade.serialize(), ...mark }
        } catch {
          return trade.serialize()
        }
      }),
    )

    return response.ok({ trades: withMarks })
  }

  /**
   * Opens a real position: fetches the current price from PriceFeedService,
   * debits margin from the user's own wallet, and stores the trade. No
   * outcome is decided here or anywhere else — see TradeExecutionService.
   */
  async open({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(openTradeValidator)

    const wallet = await Wallet.query()
      .where('userId', user.id)
      .andWhere('mode', user.accountType)
      .andWhere('currencyCode', 'USD')
      .first()
    if (!wallet) return response.badRequest({ message: 'No USD wallet found for this account mode' })
    if (Number(wallet.balance) < data.marginAmount) 
    {
      return response.badRequest({ message: 'Insufficient balance' })
    }

    try {
      const trade = await this.engine.openTrade(user, {
        marketType: data.marketType,
        symbol: data.symbol,
        tradeType: data.tradeType,
        orderType: data.orderType,
        leverage: data.leverage,
        marginAmount: data.marginAmount,
        slPrice: data.slPrice ?? null,
        tpPrice: data.tpPrice ?? null,
        walletId: wallet.id,
      })
      return response.created({ trade })
    } catch (error) {
      return response.badRequest({
        message: error instanceof Error ? error.message : 'Unable to open trade',
      })
    }
  }

  /** User-initiated close — same closeTrade() the automatic SL/TP sweep uses, just tagged 'manual'. */
  async close({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const trade = await Trade.query().where('id', params.id).andWhere('userId', user.id).first()
    if (!trade) return response.notFound({ message: 'Trade not found' })
    if (trade.status === 'closed') return response.badRequest({ message: 'Trade already closed' })

    const closed = await this.engine.closeTrade(trade.id, 'manual')
    return response.ok({ trade: closed })
  }
}

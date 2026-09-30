/**
 * This service is the entire trade lifecycle. A trade opens at whatever
 * PriceFeedService returns at that instant, and closes — via SL, TP,
 * liquidation, or the user's own "close position" click — the same way.
 * There is no method here that accepts an outcome, a target PnL, or an
 * admin id. AdminTradesController (read-only) is the only admin-facing
 * surface that touches trades at all.
 */
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Trade from '#app/models/trade'
import Wallet from '#app/models/wallet'
import User from '#app/models/user'
import PriceFeedService from '#app/services/price_feed_service'
import WalletService from '#app/services/wallet_service'

interface OpenTradeInput {
  marketType: 'crypto' | 'stock' | 'forex'
  symbol: string
  tradeType: 'long' | 'short'
  orderType: 'market' | 'limit' | 'stop'
  leverage: number
  marginAmount: number // amount debited from the wallet, in wallet currency
  slPrice?: number | null
  tpPrice?: number | null
  walletId: number
}

export default class TradeExecutionService {
  constructor(
    private priceFeed = new PriceFeedService(),
    private wallets = new WalletService(),
  ) {}

  async openTrade(user: User, input: OpenTradeInput): Promise<Trade> {
    const price = await this.priceFeed.getPrice(input.marketType, input.symbol)
    const positionSize = input.marginAmount * input.leverage

    return db.transaction(async (trx) => {
      await this.wallets.debitWallet(input.walletId, input.marginAmount, trx)

      const trade = new Trade()
      trade.userId = user.id
      trade.mode = user.accountType
      trade.marketType = input.marketType
      trade.symbol = input.symbol
      trade.tradeType = input.tradeType
      trade.orderType = input.orderType
      trade.entryPrice = String(price)
      trade.leverage = String(input.leverage)
      trade.positionSize = String(positionSize)
      trade.marginUsed = String(input.marginAmount)
      trade.slPrice = input.slPrice != null ? String(input.slPrice) : null
      trade.tpPrice = input.tpPrice != null ? String(input.tpPrice) : null
      trade.status = 'open'
      trade.openedAt = DateTime.now()
      trade.useTransaction(trx)
      await trade.save()

      return trade
    })
  }

  /** Live PnL for an open trade, marked against the current price feed — used by the positions endpoint. */
  async markToMarket(trade: Trade): Promise<{ markPrice: number; pnl: number; pnlPct: number }> {
    const markPrice = await this.priceFeed.getPrice(trade.marketType, trade.symbol)
    const pnl = this.computePnl(trade, markPrice)
    const pnlPct = (pnl / Number(trade.marginUsed)) * 100
    return { markPrice, pnl, pnlPct }
  }

  private computePnl(trade: Trade, exitPrice: number): number {
    const entry = Number(trade.entryPrice)
    const size = Number(trade.positionSize)
    const direction = trade.tradeType === 'long' ? 1 : -1
    return direction * size * ((exitPrice - entry) / entry)
  }

  /**
   * Closes a trade at the current market price. `reason` records WHY it
   * closed (user click, SL/TP cross, liquidation) — it never carries a
   * caller-supplied outcome; the PnL sign always falls out of the real
   * entry/exit prices.
   */
  async closeTrade(tradeId: number, reason: 'manual' | 'sl' | 'tp' | 'liquidation'): Promise<Trade> {
    return db.transaction(async (trx) => {
      const trade = await Trade.query({ client: trx }).where('id', tradeId).forUpdate().firstOrFail()
      if (trade.status === 'closed') return trade

      const exitPrice = await this.priceFeed.getPrice(trade.marketType, trade.symbol)
      let pnl = this.computePnl(trade, exitPrice)
      // A trader can never be debited more than the margin they put up.
      pnl = Math.max(pnl, -Number(trade.marginUsed))

      const wallet = await Wallet.query({ client: trx }).where('userId', trade.userId)
        .andWhere('mode', trade.mode)
        .andWhere('currencyCode', 'USD')
        .firstOrFail()

      const payout = Number(trade.marginUsed) + pnl
      if (payout > 0) {
        await this.wallets.creditWallet(wallet.id, payout, trx)
      }

      trade.status = 'closed'
      trade.exitPrice = String(exitPrice)
      trade.pnl = String(pnl)
      trade.closeReason = reason
      trade.closedAt = DateTime.now()
      trade.useTransaction(trx)
      await trade.save()

      return trade
    })
  }

  /**
   * Sweeps every open trade and closes any whose SL/TP has been crossed by
   * the live price feed. Intended to run on a short interval (see
   * start/scheduler or a cron-triggered ace command) — entirely mechanical,
   * no admin or user input involved.
   */
  async sweepTriggeredTrades(): Promise<number> {
    const openTrades = await Trade.query().where('status', 'open')
    let closedCount = 0

    for (const trade of openTrades) {
      try {
        const price = await this.priceFeed.getPrice(trade.marketType, trade.symbol)
        const sl = trade.slPrice ? Number(trade.slPrice) : null
        const tp = trade.tpPrice ? Number(trade.tpPrice) : null
        const isLong = trade.tradeType === 'long'

        const hitSl = sl != null && (isLong ? price <= sl : price >= sl)
        const hitTp = tp != null && (isLong ? price >= tp : price <= tp)
        const marginLost = this.computePnl(trade, price) <= -Number(trade.marginUsed)

        if (marginLost) {
          await this.closeTrade(trade.id, 'liquidation')
          closedCount++
        } else if (hitSl) {
          await this.closeTrade(trade.id, 'sl')
          closedCount++
        } else if (hitTp) {
          await this.closeTrade(trade.id, 'tp')
          closedCount++
        }
      } catch {
        // A single symbol's price-feed hiccup shouldn't halt the sweep for everyone else.
        continue
      }
    }

    return closedCount
  }
}

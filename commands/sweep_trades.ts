import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * node ace sweep:trades
 *
 * Closes any open trade whose SL/TP has been crossed by the live price feed,
 * or that's been fully liquidated. Run this on a short interval (cron,
 * systemd timer, or a process-manager cron plugin) — it is the entire
 * automatic side of trade closing and takes no input from anyone.
 */
export default class SweepTrades extends BaseCommand {
  static commandName = 'sweep:trades'
  static description = 'Close open trades whose SL/TP/liquidation level has been crossed by the live price feed'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: TradeExecutionService } = await import('#app/services/trade_execution_service')
    const engine = new TradeExecutionService()

    this.logger.info('Sweeping open trades against the live price feed...')
    const closedCount = await engine.sweepTriggeredTrades()
    this.logger.success(`Sweep complete — ${closedCount} trade(s) closed`)
  }
}

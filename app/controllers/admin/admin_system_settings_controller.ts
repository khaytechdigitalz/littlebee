import type { HttpContext } from '@adonisjs/core/http'
import SystemSetting from '#app/models/system_setting'
import CoinremitterService from '#app/services/coinremitter_service'
import { updateSettingValidator } from '#app/validators/admin_validator'
import type { CoinSymbol } from '#config/coinremitter'

export default class AdminSystemSettingsController {
  private coinremitter = new CoinremitterService()

  async index({ response }: HttpContext) {
    const settings = await SystemSetting.all()
    const asMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return response.ok({ settings: asMap })
  }

  async update({ request, response }: HttpContext) {
    const { key, value } = await request.validateUsing(updateSettingValidator)
    const setting = await SystemSetting.updateOrCreate({ key }, { value })
    return response.ok({ setting })
  }

  /** Confirms the webhook URL is reachable/configured — a real "test webhook" would ping a Coinremitter sandbox endpoint. */
  async testWebhook({ response }: HttpContext) {
    const active = (['BTC', 'ETH', 'USDT', 'LTC', 'DOGE', 'BNB'] as CoinSymbol[]).filter((c) =>
      this.coinremitter.isActive(c),
    )
    return response.ok({
      configuredCoins: active,
      webhookEndpoint: '/api/webhooks/coinremitter',
      message: active.length
        ? `Webhook is wired for: ${active.join(', ')}`
        : 'No Coinremitter coins are configured yet',
    })
  }
}

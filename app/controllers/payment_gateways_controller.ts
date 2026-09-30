import type { HttpContext } from '@adonisjs/core/http'
import PaymentGateway from '#app/models/payment_gateway'

/** Public (authenticated user) read of active gateways — selection lists for the deposit/withdrawal wizards. */
export default class PaymentGatewaysController {
  async index({ request, response }: HttpContext) {
    const { type } = request.qs()
    const query = PaymentGateway.query().where('isActive', true)
    if (type) query.andWhere('type', type)
    const gateways = await query.orderBy('name', 'asc')
    return response.ok({ gateways })
  }
}

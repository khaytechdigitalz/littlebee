import type { HttpContext } from '@adonisjs/core/http'
import PaymentGateway from '#app/models/payment_gateway'
import { upsertGatewayValidator } from '#app/validators/admin_validator'

export default class AdminPaymentGatewaysController {
  async index({ response }: HttpContext) {
    const gateways = await PaymentGateway.query().orderBy('name', 'asc')
    return response.ok({ gateways })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(upsertGatewayValidator)
    const gateway = await PaymentGateway.create(data)
    return response.created({ gateway })
  }

  async update({ params, request, response }: HttpContext) {
    const gateway = await PaymentGateway.findOrFail(params.id)
    const data = await request.validateUsing(upsertGatewayValidator)
    gateway.merge(data)
    await gateway.save()
    return response.ok({ gateway })
  }

  async destroy({ params, response }: HttpContext) {
    const gateway = await PaymentGateway.findOrFail(params.id)
    await gateway.delete()
    return response.noContent()
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import KycDocument from '#app/models/kyc_document'

const submitKycValidator = vine.compile(
  vine.object({
    tierLevel: vine.number().min(1).max(3),
    documentType: vine.string().trim().maxLength(100),
    // Same as paymentProofUrl in transaction_validator.ts — our /uploads
    // endpoint returns a relative path, not an absolute URL.
    documentUrl: vine.string().trim().minLength(1).maxLength(500),
  }),
)

export default class KycController {
  async index({ auth, response }: HttpContext) {
    const documents = await KycDocument.query().where('userId', auth.user!.id).orderBy('createdAt', 'desc')
    return response.ok({ documents })
  }

  /** File upload itself is expected to happen via a signed-upload/storage endpoint beforehand; this stores the resulting URL. */
  async submit({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(submitKycValidator)
    const document = await KycDocument.create({
      userId: auth.user!.id,
      tierLevel: data.tierLevel,
      documentType: data.documentType,
      documentUrl: data.documentUrl,
      status: 'pending',
    })
    return response.created({ document })
  }
}

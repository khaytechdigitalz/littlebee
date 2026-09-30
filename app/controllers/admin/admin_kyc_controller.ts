import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import KycDocument from '#app/models/kyc_document'
import User from '#app/models/user'
import { reviewKycValidator } from '#app/validators/admin_validator'

export default class AdminKycController {
  async index({ request, response }: HttpContext) {
    const { status = 'pending', page = 1 } = request.qs()
    const query = KycDocument.query().preload('user', (q) => q.select('id', 'fullName', 'email'))
    if (status) query.where('status', status)
    const documents = await query.orderBy('createdAt', 'asc').paginate(Number(page), 25)
    return response.ok(documents)
  }

  async review({ auth, params, request, response }: HttpContext) {
    const admin = auth.user!
    const { action, reason } = await request.validateUsing(reviewKycValidator)

    const document = await KycDocument.findOrFail(params.id)
    document.status = action === 'approve' ? 'approved' : 'rejected'
    document.rejectionReason = action === 'reject' ? (reason ?? null) : null
    document.reviewedBy = admin.id
    document.reviewedAt = DateTime.now()
    await document.save()

    if (action === 'approve') {
      const user = await User.findOrFail(document.userId)
      const highestApprovedTier = await KycDocument.query()
        .where('userId', user.id)
        .andWhere('status', 'approved')
        .max('tierLevel as maxTier')
        .first()
      const maxTier = Number((highestApprovedTier as any)?.$extras?.maxTier ?? 0)
      user.isVerified = maxTier >= 1
      await user.save()
    }

    return response.ok({ document })
  }
}

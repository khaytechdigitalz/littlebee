import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
const MAX_SIZE = '10mb'

/**
 * Generic authenticated file upload used by both the KYC flow (document
 * photos) and the deposit flow (payment proof receipts). Returns a URL the
 * caller stores as documentUrl / paymentProofUrl on their own record — this
 * controller doesn't know or care which.
 *
 * Files are written to public/uploads and served statically by
 * @adonisjs/static (already registered in adonisrc.ts). Swap this for S3 /
 * R2 / GCS in production — the contract (accept "file", return { url }) stays
 * the same.
 */
export default class UploadsController {
  async store({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: MAX_SIZE,
      extnames: ALLOWED_EXTENSIONS,
    })

    if (!file) {
      return response.badRequest({ message: 'No file provided (field name must be "file")' })
    }
    if (!file.isValid) {
      return response.badRequest({ message: file.errors.map((e) => e.message).join(', ') })
    }

    const fileName = `${cuid()}.${file.extname}`
    await file.move(app.publicPath('uploads'), { name: fileName })

    return response.created({ url: `/uploads/${fileName}` })
  }
}

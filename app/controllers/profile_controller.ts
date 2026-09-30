import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#app/models/user'
import LoginSession from '#app/models/login_session'

const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(150).optional(),
    country: vine.string().trim().optional(),
    accountType: vine.enum(['demo', 'live'] as const).optional(),
  }),
)

export default class ProfileController {
  async show({ auth, response }: HttpContext) {
    return response.ok({ user: auth.user!.serialize() })
  }

  async update({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(updateProfileValidator)
    const user = auth.user!
    user.merge(data)
    await user.save()
    return response.ok({ user: user.serialize() })
  }

  async sessions({ auth, response }: HttpContext) {
    const sessions = await LoginSession.query()
      .where('userId', auth.user!.id)
      .andWhere('revoked', false)
      .orderBy('lastActive', 'desc')
    return response.ok({ sessions })
  }

  async revokeSession({ auth, params, response }: HttpContext) {
    const session = await LoginSession.query().where('id', params.id).andWhere('userId', auth.user!.id).first()
    if (!session) return response.notFound({ message: 'Session not found' })
    session.revoked = true
    await session.save()
    return response.ok({ message: 'Session revoked' })
  }

  async revokeAllSessions({ auth, response }: HttpContext) {
    const user = auth.user!
    await LoginSession.query().where('userId', user.id).andWhere('isCurrent', false).update({ revoked: true })
    // Also invalidate every access token except the one making this request.
    const current = user.currentAccessToken
    const tokens = await User.accessTokens.all(user)
    for (const token of tokens) {
      if (!current || token.identifier !== current.identifier) {
        await User.accessTokens.delete(user, token.identifier)
      }
    }
    return response.ok({ message: 'All other sessions logged out' })
  }
}

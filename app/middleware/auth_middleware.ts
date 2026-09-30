import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Requires a valid bearer access token. Applied to every authenticated
 * route — including every admin route, which additionally layers
 * AdminMiddleware on top (see admin_middleware.ts).
 */
export default class AuthMiddleware {
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {},
  ) {
    await ctx.auth.authenticateUsing(options.guards ?? ['api'])
    return next()
  }
}

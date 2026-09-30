import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/** Attempts auth without failing the request — used for optional-auth routes like the landing page. */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await ctx.auth.authenticateUsing(['api'], { loginRoute: undefined })
    } catch {
      // not authenticated — that's fine for silent auth
    }
    return next()
  }
}

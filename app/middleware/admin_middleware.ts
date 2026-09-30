import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Standard role check — layered on top of AuthMiddleware for every route
 * under /api/v1/admin/*. Deliberately NOT path secrecy: a signed-out or
 * non-admin request to any admin route gets a normal 403, same as any other
 * authorization failure in the API. Security here is auth + RBAC + audit
 * logging, not hiding the URL.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user!

    if (user.role !== 'admin') {
      return ctx.response.forbidden({ message: 'Admin access required' })
    }
    if (user.isSuspended) {
      return ctx.response.forbidden({ message: 'Account suspended' })
    }

    return next()
  }
}

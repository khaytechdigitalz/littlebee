import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * Global middleware — runs on every request, auth or not.
 */
server.use([
  () => import('@adonisjs/static/static_middleware'), // serves public/uploads/* — KYC docs, payment receipts
  () => import('@adonisjs/cors/cors_middleware'),
])

/**
 * Router-level middleware — runs on every route matched by the router.
 *
 * initialize_auth_middleware MUST run before any route handler that touches
 * `ctx.auth` (including the `auth` named middleware below) — it's what
 * actually attaches the auth service to the request context. Missing this
 * is what caused every authenticated route, including /auth/me, to error.
 */
router.use([
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
])

/**
 * Named middleware, referenced by key in start/routes.ts (e.g. `middleware.auth()`).
 */
export const middleware = router.named({
  auth: () => import('#app/middleware/auth_middleware'),
  admin: () => import('#app/middleware/admin_middleware'),
  silentAuth: () => import('#app/middleware/silent_auth_middleware'),
})

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { readFile } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'

const AuthController = () => import('#app/controllers/auth_controller')
const ProfileController = () => import('#app/controllers/profile_controller')
const KycController = () => import('#app/controllers/kyc_controller')
const WalletsController = () => import('#app/controllers/wallets_controller')
const TradesController = () => import('#app/controllers/trades_controller')
const TransactionsController = () => import('#app/controllers/transactions_controller')
const PaymentGatewaysController = () => import('#app/controllers/payment_gateways_controller')
const CoinremitterWebhookController = () => import('#app/controllers/coinremitter_webhook_controller')
const UploadsController = () => import('#app/controllers/uploads_controller')
const MarketsController = () => import('#app/controllers/markets_controller')

const AdminDashboardController = () => import('#app/controllers/admin/admin_dashboard_controller')
const AdminUsersController = () => import('#app/controllers/admin/admin_users_controller')
const AdminTransactionsController = () => import('#app/controllers/admin/admin_transactions_controller')
const AdminKycController = () => import('#app/controllers/admin/admin_kyc_controller')
const AdminPaymentGatewaysController = () => import('#app/controllers/admin/admin_payment_gateways_controller')
const AdminSystemSettingsController = () => import('#app/controllers/admin/admin_system_settings_controller')

//router.get('/', async () => ({ status: 'ok', service: 'littlebee-api' }))
router.get('/health', async () => ({ status: 'ok' }))

router
  .group(() => {
    /*
    |--------------------------------------------------------------------
    | Public / unauthenticated
    |--------------------------------------------------------------------
    */
    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/login', [AuthController, 'login'])
    router.get('/payment-gateways', [PaymentGatewaysController, 'index'])

    // Read-only price data — no user data involved, safe to expose to the
    // public landing page's live ticker without a token.
    router.get('/markets/directory', [MarketsController, 'directory'])
    router.get('/markets/price', [MarketsController, 'price'])
    router.get('/markets/quotes', [MarketsController, 'quotes'])

    // Coinremitter calls this directly — no bearer token, verified via
    // CoinremitterService#verifyIpn inside the controller instead.
    router.post('/webhooks/coinremitter', [CoinremitterWebhookController, 'handle'])

    /*
    |--------------------------------------------------------------------
    | Authenticated (any logged-in user)
    |--------------------------------------------------------------------
    */
    router
      .group(() => {
        router.post('/auth/logout', [AuthController, 'logout'])
        router.get('/auth/me', [AuthController, 'me'])
        router.post('/auth/change-password', [AuthController, 'changePassword'])
        router.post('/auth/pin', [AuthController, 'setPin'])
        router.post('/auth/verify-pin', [AuthController, 'verifyPin'])
        router.post('/auth/2fa/setup', [AuthController, 'setup2fa'])
        router.post('/auth/2fa/verify', [AuthController, 'verify2fa'])

        router.post('/uploads', [UploadsController, 'store'])

        router.get('/profile', [ProfileController, 'show'])
        router.patch('/profile', [ProfileController, 'update'])
        router.get('/profile/sessions', [ProfileController, 'sessions'])
        router.delete('/profile/sessions/:id', [ProfileController, 'revokeSession'])
        router.post('/profile/sessions/revoke-all', [ProfileController, 'revokeAllSessions'])

        router.get('/kyc', [KycController, 'index'])
        router.post('/kyc', [KycController, 'submit'])

        router.get('/wallets', [WalletsController, 'index'])
        router.post('/wallets/generate', [WalletsController, 'generate'])
        router.get('/wallets/:id', [WalletsController, 'show'])
        router.get('/wallets/:id/transactions', [WalletsController, 'transactions'])

        router.get('/trades', [TradesController, 'index'])
        router.post('/trades', [TradesController, 'open'])
        router.post('/trades/:id/close', [TradesController, 'close'])

        router.get('/transactions', [TransactionsController, 'index'])
        router.post('/transactions/deposit', [TransactionsController, 'createDeposit'])
        router.post('/transactions/withdrawal', [TransactionsController, 'createWithdrawal'])
      })
      .use(middleware.auth())

    /*
    |--------------------------------------------------------------------
    | Admin — standard predictable path, gated by auth + admin middleware.
    | No path secrecy: an unauthenticated or non-admin request here gets a
    | normal 401/403, exactly like any other protected resource.
    |--------------------------------------------------------------------
    */
    router
      .group(() => {
        router.get('/dashboard/summary', [AdminDashboardController, 'summary'])
        router.get('/dashboard/open-positions', [AdminDashboardController, 'openPositions'])

        router.get('/users', [AdminUsersController, 'index'])
        router.get('/users/:id', [AdminUsersController, 'show'])
        router.post('/users/:id/suspend', [AdminUsersController, 'suspend'])
        router.post('/users/:id/unsuspend', [AdminUsersController, 'unsuspend'])
        router.post('/users/:id/reset-demo-balance', [AdminUsersController, 'resetDemoBalance'])
        router.post('/wallets/adjust', [AdminUsersController, 'adjustWallet'])

        router.get('/transactions', [AdminTransactionsController, 'index'])
        router.post('/transactions/:id/deposit-review', [AdminTransactionsController, 'reviewDeposit'])
        router.post('/transactions/:id/withdrawal-review', [AdminTransactionsController, 'reviewWithdrawal'])

        router.get('/kyc', [AdminKycController, 'index'])
        router.post('/kyc/:id/review', [AdminKycController, 'review'])

        router.get('/payment-gateways', [AdminPaymentGatewaysController, 'index'])
        router.post('/payment-gateways', [AdminPaymentGatewaysController, 'store'])
        router.put('/payment-gateways/:id', [AdminPaymentGatewaysController, 'update'])
        router.delete('/payment-gateways/:id', [AdminPaymentGatewaysController, 'destroy'])

        router.get('/settings', [AdminSystemSettingsController, 'index'])
        router.post('/settings', [AdminSystemSettingsController, 'update'])
        router.post('/settings/test-webhook', [AdminSystemSettingsController, 'testWebhook'])
      })
      .prefix('/admin')
      .use([middleware.auth(), middleware.admin()])
  })
  .prefix('/api/v1')

// Convenience aliases matching the literal paths named in the spec
// (/api/wallets/generate, /api/auth/verify-pin, /api/webhooks/coinremitter)
// so both stay valid without duplicating controller logic.
router.post('/api/wallets/generate', [WalletsController, 'generate']).use(middleware.auth())
router.post('/api/auth/verify-pin', [AuthController, 'verifyPin']).use(middleware.auth())
router.post('/api/webhooks/coinremitter', [CoinremitterWebhookController, 'handle'])

/*
|--------------------------------------------------------------------------
| SPA fallback — MUST stay the last routes registered
|--------------------------------------------------------------------------
|
| Everything above this point is either an /api/v1/* route or a literal
| static file under public/ (served by @adonisjs/static before the request
| even reaches the router — see start/kernel.ts). Anything that falls
| through to here is a client-side route owned by React Router (e.g.
| /app/wallet, /admin/users) — there's no server-side handler for it, so we
| hand back the same index.html shell and let the browser's JS take over.
|
| GET only: a POST/DELETE/etc. to an unmatched path should still 404 for
| debugging, not silently return an HTML page.
*/
router.get('/', async ({ response }) => {
  const html = await readFile(app.publicPath('index.html'), 'utf-8')
  return response.type('text/html').send(html)
})
router.get('/*', async ({ response }) => {
  const html = await readFile(app.publicPath('index.html'), 'utf-8')
  return response.type('text/html').send(html)
})

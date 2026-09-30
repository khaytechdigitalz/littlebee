import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'

/**
 * The secret used by AdonisJS's Encryption service (signed cookies, the
 * `encryption` service, etc.). This is the piece that was missing — nothing
 * previously exported `appKey` from here for app_provider.js to read, even
 * though APP_KEY was correctly set in .env.
 */
export const appKey = new Secret(env.get('APP_KEY'))

export const http = {
  generateRequestId: true,
  allowMethodSpoofing: false,
  trustProxy: () => true,
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax' as const,
  },
   qs: {
    parse: {},
    stringify: {},
  },
}

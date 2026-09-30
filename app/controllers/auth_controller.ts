import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import User from '#app/models/user'
import LoginSession from '#app/models/login_session'
import WalletService from '#app/services/wallet_service'
import {
  registerValidator,
  loginValidator,
  setPinValidator,
  verifyPinValidator,
  enable2faValidator,
  changePasswordValidator,
} from '#app/validators/auth_validator'

export default class AuthController {
  private wallets = new WalletService()

  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existing = await User.findBy('email', data.email)
    if (existing) {
      return response.conflict({ message: 'An account with this email already exists' })
    }

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.password, // hashed automatically by the AuthFinder mixin on the model
      country: data.country ?? null,
      role: 'user',
      accountType: 'demo',
    })

    await this.wallets.provisionDefaultWallets(user)

    const token = await User.accessTokens.create(user)
    return response.created({ user: user.serialize(), token: token.value!.release() })
  }

  async login({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    if (user.isSuspended) {
      return response.forbidden({ message: 'This account has been suspended' })
    }

    await LoginSession.create({
      userId: user.id,
      ipAddress: request.ip(),
      deviceType: request.header('user-agent')?.slice(0, 100) ?? 'Unknown device',
      location: 'Unknown', // resolve via an IP-geolocation service in production
      isCurrent: true,
      lastActive: DateTime.now(),
    }).catch(() => null)

    const token = await User.accessTokens.create(user)
    return response.ok({ user: user.serialize(), token: token.value!.release() })
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    const token = auth.user!.currentAccessToken
    if (token) {
      await User.accessTokens.delete(user, token.identifier)
    }
    return response.ok({ message: 'Logged out' })
  }

  async me({ auth, response }: HttpContext) {
    return response.ok({ user: auth.user!.serialize() })
  }

  /** Requires the current password — separate from setPin, which has no "old PIN" requirement on first set. */
  async changePassword({ auth, request, response }: HttpContext) {
    const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)
    const user = auth.user!

    const valid = await hash.verify(user.passwordHash, currentPassword)
    if (!valid) {
      return response.unauthorized({ message: 'Current password is incorrect' })
    }

    user.passwordHash = newPassword // re-hashed automatically by the AuthFinder mixin on save
    await user.save()
    return response.ok({ message: 'Password updated' })
  }

  /** Sets the transaction PIN for the first time, or rotates it (requires being authenticated — no old PIN needed on first set). */
  async setPin({ auth, request, response }: HttpContext) {
    const { pin } = await request.validateUsing(setPinValidator)
    const user = auth.user!
    user.transactionPinHash = await hash.make(pin)
    await user.save()
    return response.ok({ message: 'Transaction PIN set' })
  }

  /** Used inline by withdrawal flows, and exposed standalone as /api/auth/verify-pin per spec. */
  async verifyPin({ auth, request, response }: HttpContext) {
    const { pin } = await request.validateUsing(verifyPinValidator)
    const user = auth.user!

    if (!user.transactionPinHash) {
      return response.badRequest({ message: 'No transaction PIN has been set yet' })
    }
    const valid = await hash.verify(user.transactionPinHash, pin)
    if (!valid) {
      return response.unauthorized({ valid: false, message: 'Incorrect PIN' })
    }
    return response.ok({ valid: true })
  }

  /** Step 1 of 2FA setup: generate a secret + QR, not yet enabled until verify2fa confirms a live code. */
  async setup2fa({ auth, response }: HttpContext) {
    const user = auth.user!
    const secret = authenticator.generateSecret()
    user.twoFactorSecret = secret
    user.is2faEnabled = false
    await user.save()

    const otpauth = authenticator.keyuri(user.email, 'LittleBee', secret)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

    return response.ok({ secret, qrCodeDataUrl })
  }

  async verify2fa({ auth, request, response }: HttpContext) {
    const { code } = await request.validateUsing(enable2faValidator)
    const user = auth.user!

    if (!user.twoFactorSecret) {
      return response.badRequest({ message: 'Call /api/auth/2fa/setup first' })
    }
    const valid = authenticator.check(code, user.twoFactorSecret)
    if (!valid) {
      return response.unauthorized({ valid: false, message: 'Invalid code' })
    }

    user.is2faEnabled = true
    await user.save()
    return response.ok({ valid: true, enabled: true })
  }
}

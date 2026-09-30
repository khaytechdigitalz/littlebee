import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#app/models/user'
import SystemSetting from '#app/models/system_setting'
import PaymentGateway from '#app/models/payment_gateway'
import WalletService from '#app/services/wallet_service'
import env from '#start/env'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // --- Default admin account -------------------------------------------------
    const adminEmail = env.get('DEFAULT_ADMIN_EMAIL', 'admin@littlebee.io')
    const adminPassword = env.get('DEFAULT_ADMIN_PASSWORD', '')

    if (adminPassword) {
      const existingAdmin = await User.findBy('email', adminEmail)
      if (!existingAdmin) {
        const admin = await User.create({
          fullName: 'LittleBee Admin',
          email: adminEmail,
          passwordHash: adminPassword,
          role: 'admin',
          accountType: 'live',
          isVerified: true,
        })
        await new WalletService().provisionDefaultWallets(admin)
        console.log(`Created default admin: ${adminEmail}`)
      }
    } else {
      console.log('DEFAULT_ADMIN_PASSWORD not set — skipping admin seed. Set it in .env and re-run db:seed.')
    }

    // --- Default system settings ------------------------------------------------
    const defaults: Record<string, string> = {
      site_name: 'LittleBee',
      maintenance_mode: 'false',
      allow_registrations: 'true',
      default_demo_balance: '10000',
      coinremitter_auto_withdraw_enabled: 'false', // withdrawals always go through admin approval regardless
      kyc_required_for_withdrawal: 'true',
      support_email: 'support@littlebee.io',
    }
    for (const [key, value] of Object.entries(defaults)) {
      await SystemSetting.firstOrCreate({ key }, { key, value })
    }

    // --- Starter payment gateways -----------------------------------------------
    const gateways = [
      { name: 'Coinremitter BTC', type: 'crypto' as const, coinSymbol: 'BTC', minDeposit: '0.0005', depositFeePercentage: '0', withdrawalFeePercentage: '0.5' },
      { name: 'Coinremitter ETH', type: 'crypto' as const, coinSymbol: 'ETH', minDeposit: '0.01', depositFeePercentage: '0', withdrawalFeePercentage: '0.5' },
      { name: 'Coinremitter USDT-TRC20', type: 'crypto' as const, coinSymbol: 'USDT', minDeposit: '10', depositFeePercentage: '0', withdrawalFeePercentage: '1' },
      { name: 'Bank Wire', type: 'fiat' as const, coinSymbol: null, minDeposit: '100', depositFeePercentage: '0', withdrawalFeePercentage: '1.5' },
    ]
    for (const gw of gateways) {
      await PaymentGateway.firstOrCreate({ name: gw.name }, { ...gw, isActive: true })
    }
  }
}

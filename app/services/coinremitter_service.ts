/**
 * Thin wrapper around Coinremitter's REST API (https://coinremitter.com/api/v3).
 *
 * Demo-mode wallets/trades never call this class — WalletService and
 * TradeExecutionService both branch on `mode === 'live'` before reaching here.
 *
 * NOTE: endpoint paths/param names below reflect Coinremitter's documented v3
 * shape at the time of writing. Coinremitter occasionally revises field names
 * (e.g. fee-estimate params) — pin the exact contract against their current
 * docs (https://coinremitter.com/docs) before going live, since a payment
 * integration is not something to ship on a guess.
 */
import axios, { AxiosInstance } from 'axios'
import coinremitterConfig, { type CoinSymbol } from '#config/coinremitter'

export interface CreateAddressResult {
  address: string
  qrCode: string
  label: string
  coinSymbol: CoinSymbol
  minimumDepositAmount: string
  coinremitterWalletId: string | null
}

export interface WithdrawFeeEstimate {
  fee: string
  netAmount: string
  speed: 'low' | 'medium' | 'priority'
}

export interface WithdrawResult {
  txid: string
  amount: string
  fee: string
}

class CoinremitterApiError extends Error {
  constructor(
    message: string,
    public coin: CoinSymbol,
    public action: string,
  ) {
    super(message)
    this.name = 'CoinremitterApiError'
  }
}

export default class CoinremitterService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: coinremitterConfig.baseUrl,
      timeout: 15_000,
    })
  }

  /** A coin is only usable once both credentials are configured for it. */
  isActive(coin: CoinSymbol): boolean {
    const cred = coinremitterConfig.coins[coin]
    return Boolean(cred?.apiKey && cred?.password)
  }

  private credentials(coin: CoinSymbol) {
    const cred = coinremitterConfig.coins[coin]
    if (!cred?.apiKey || !cred?.password) {
      throw new CoinremitterApiError(`Coinremitter is not configured for ${coin}`, coin, 'credentials')
    }
    return { api_key: cred.apiKey, password: cred.password }
  }

  private async post<T>(coin: CoinSymbol, action: string, params: Record<string, unknown> = {}): Promise<T> {
    const body = { ...this.credentials(coin), ...params }
    const { data } = await this.client.post(`/${coin}/${action}`, body)

    if (data?.flag !== 1) {
      throw new CoinremitterApiError(data?.msg ?? `Coinremitter ${action} failed`, coin, action)
    }
    return data.data as T
  }

  /**
   * Generates a fresh on-chain deposit address for a user, tagged with our
   * webhook URL so deposits land on POST /api/webhooks/coinremitter.
   */
  async createAddress(coin: CoinSymbol, label: string): Promise<CreateAddressResult> {
    const result = await this.post<any>(coin, 'create-address', {
      label,
      notify_url: coinremitterConfig.webhookUrl,
    })

    return {
      address: result.address,
      qrCode: result.qr_code ?? result.qr_code_url,
      label: result.label ?? label,
      coinSymbol: coin,
      minimumDepositAmount: String(result.minimum_deposit_amount ?? '0'),
      coinremitterWalletId: result.wallet_id ?? null,
    }
  }

  async getBalance(coin: CoinSymbol): Promise<string> {
    const result = await this.post<any>(coin, 'get-balance')
    return String(result.balance ?? '0')
  }

  async validateAddress(coin: CoinSymbol, address: string): Promise<boolean> {
    const result = await this.post<any>(coin, 'validate-address', { address })
    return Boolean(result.is_valid)
  }

  async estimateWithdrawFee(
    coin: CoinSymbol,
    amount: string,
    speed: 'low' | 'medium' | 'priority',
  ): Promise<WithdrawFeeEstimate> {
    const result = await this.post<any>(coin, 'estimate-withdraw-fees', { amount, gas_speed: speed })
    const fee = String(result.fee ?? '0')
    return {
      fee,
      netAmount: String(Number(amount) - Number(fee)),
      speed,
    }
  }

  /**
   * Executes an on-chain payout. Only ever called after: (1) transaction PIN
   * verified, (2) address validated, (3) an admin has approved the pending
   * `transactions` row from the withdrawal review queue.
   */
  async withdraw(coin: CoinSymbol, address: string, amount: string, description: string): Promise<WithdrawResult> {
    const result = await this.post<any>(coin, 'withdraw', { address, amount, description })
    return {
      txid: result.txid ?? result.id,
      amount: String(result.amount ?? amount),
      fee: String(result.fee ?? '0'),
    }
  }

  /**
   * Coinremitter doesn't sign IPN callbacks itself — instead you echo the
   * received payload back to their verify-ipn endpoint and they confirm it
   * matches a callback they actually sent. This is the anti-spoofing check
   * required before CoinremitterWebhookController credits anything.
   */
  async verifyIpn(coin: CoinSymbol, payload: Record<string, unknown>): Promise<boolean> {
    try {
      const result = await this.post<any>(coin, 'verify-ipn', payload)
      return Boolean(result?.valid ?? result === true)
    } catch {
      return false
    }
  }
}

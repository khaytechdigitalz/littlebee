import { useCallback, useEffect, useState } from 'react'
import { listWallets, type WalletRecord } from '../services/wallets'
import { useTheme } from '../context/ThemeContext'

/** The real USD wallet for the current account mode (demo/live) — margin, balances, and payouts all key off this. */
export function useUsdWallet() {
  const { accountMode } = useTheme()
  const [wallet, setWallet] = useState<WalletRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    setError('')
    return listWallets(accountMode)
      .then((wallets) => setWallet(wallets.find((w) => w.currencyCode === 'USD') ?? null))
      .catch((err) => setError(err.message || 'Failed to load wallet'))
      .finally(() => setLoading(false))
  }, [accountMode])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { wallet, balance: wallet ? Number(wallet.balance) : 0, loading, error, refresh }
}

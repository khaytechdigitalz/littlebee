import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type AccentKey = 'green' | 'blue' | 'cyan' | 'amber'
export type AccountMode = 'demo' | 'live'
export type ColorMode = 'light' | 'dark'

interface AccentOption {
  key: AccentKey
  label: string
  hex: string
  soft: string
}

export const ACCENTS: AccentOption[] = [
  { key: 'green', label: 'Neon Green', hex: '#A3E635', soft: 'rgba(163,230,53,0.14)' },
  { key: 'blue', label: 'Electric Blue', hex: '#3B82F6', soft: 'rgba(59,130,246,0.14)' },
  { key: 'cyan', label: 'Cyber Cyan', hex: '#06B6D4', soft: 'rgba(6,182,212,0.14)' },
  { key: 'amber', label: 'Amber Gold', hex: '#F59E0B', soft: 'rgba(245,158,11,0.14)' },
]

interface ThemeContextValue {
  accent: AccentKey
  setAccent: (a: AccentKey) => void
  accentOption: AccentOption
  accountMode: AccountMode
  setAccountMode: (m: AccountMode) => void
  colorMode: ColorMode
  setColorMode: (m: ColorMode) => void
  toggleColorMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<AccentKey>('green')
  const [accountMode, setAccountMode] = useState<AccountMode>('live')
  const [colorMode, setColorMode] = useState<ColorMode>('dark')

  const accentOption = useMemo(() => ACCENTS.find((a) => a.key === accent)!, [accent])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentOption.hex)
    document.documentElement.style.setProperty('--accent-soft', accentOption.soft)
  }, [accentOption])

  useEffect(() => {
    document.documentElement.classList.toggle('light', colorMode === 'light')
  }, [colorMode])

  const value: ThemeContextValue = {
    accent,
    setAccent,
    accentOption,
    accountMode,
    setAccountMode,
    colorMode,
    setColorMode,
    toggleColorMode: () => setColorMode((m) => (m === 'dark' ? 'light' : 'dark')),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

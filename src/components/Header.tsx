import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Palette, ArrowDownToLine, ArrowUpFromLine, Sun, Moon, LogOut } from 'lucide-react'
import { ACCENTS, useTheme } from '../context/ThemeContext'
import { me, logout, type AuthUser } from '../services/auth'
import { updateProfile } from '../services/profile'
import { useUsdWallet } from '../hooks/useUsdWallet'

export default function Header() {
  const { accent, setAccent, accountMode, setAccountMode, colorMode, toggleColorMode } = useTheme()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [switching, setSwitching] = useState(false)
  const { balance, loading: balanceLoading, refresh: refreshWallet } = useUsdWallet()
  const navigate = useNavigate()

  useEffect(() => {
    me()
      .then((u) => {
        setUser(u)
        setAccountMode(u.accountType) // the backend's user.accountType is the source of truth for which wallet/trades a request touches
      })
      .catch(() => setUser(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await logout().catch(() => {})
    navigate('/auth/login')
  }

  const switchAccountMode = async (mode: 'demo' | 'live') => {
    if (mode === accountMode || switching) return
    setSwitching(true)
    try {
      const updated = await updateProfile({ accountType: mode })
      setUser(updated)
      setAccountMode(mode)
      refreshWallet()
    } catch {
      // leave accountMode as-is on failure — the toggle below reflects the confirmed backend state
    } finally {
      setSwitching(false)
    }
  }

  return (
    <header className="flex items-center gap-3 px-4 lg:px-6 py-4 border-b border-base-border bg-base-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.email ?? 'guest')}`}
          alt="User avatar"
          className="w-9 h-9 rounded-full border border-base-border"
        />
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-medium">{user?.fullName ?? 'Loading…'}</p>
          <p className="text-xs text-slate-500">{user?.email ?? ''}</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 ml-2">
        <button
          onClick={() => switchAccountMode('demo')}
          disabled={switching}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
            accountMode === 'demo' ? 'bg-accent text-black' : 'text-slate-400 hover:text-slate-100 border border-base-border'
          }`}
        >
          Demo
        </button>
        <button
          onClick={() => switchAccountMode('live')}
          disabled={switching}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
            accountMode === 'live' ? 'bg-accent text-black' : 'text-slate-400 hover:text-slate-100 border border-base-border'
          }`}
        >
          Live
        </button>
      </div>

      <div className="hidden md:flex items-center gap-4 ml-2 pl-4 border-l border-base-border">
        <div className="text-xs">
          <p className="text-slate-500">Balance ({accountMode})</p>
          <p className="font-semibold text-slate-100">
            {balanceLoading ? '…' : `$${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-1.5 bg-base-panel border border-base-border rounded-xl px-3 py-2 w-56">
        <Search size={15} className="text-slate-500" />
        <input
          placeholder="Search markets..."
          className="bg-transparent outline-none text-xs w-full placeholder:text-slate-600"
        />
      </div>

      <button
        onClick={toggleColorMode}
        className="p-2 rounded-lg border border-base-border hover:bg-[var(--hover)] transition text-slate-300"
        aria-label="Toggle light/dark mode"
      >
        {colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="p-2 rounded-lg border border-base-border hover:bg-[var(--hover)] transition text-slate-300"
          aria-label="Accent color"
        >
          <Palette size={16} style={{ color: 'var(--accent)' }} />
        </button>
        {pickerOpen && (
          <div className="absolute right-0 mt-2 card p-2 w-44 shadow-xl">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                onClick={() => {
                  setAccent(a.key)
                  setPickerOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--hover)] ${
                  accent === a.key ? 'text-slate-100' : 'text-slate-400'
                }`}
              >
                <span className="w-3 h-3 rounded-full" style={{ background: a.hex }} />
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="p-2 rounded-lg border border-base-border hover:bg-[var(--hover)] transition relative">
        <Bell size={16} className="text-slate-300" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
      </button>

      <button
        onClick={handleLogout}
        className="p-2 rounded-lg border border-base-border hover:bg-[var(--hover)] transition text-slate-300"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={16} />
      </button>

      <Link
        to="/app/deposit"
        className="hidden sm:flex items-center gap-1.5 bg-accent text-black text-sm font-semibold px-4 py-2 rounded-lg hover:brightness-95 transition"
      >
        Deposit <ArrowDownToLine size={14} />
      </Link>
      <Link
        to="/app/withdrawal"
        className="hidden sm:flex items-center gap-1.5 border border-base-border text-slate-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--hover)] transition"
      >
        Withdraw <ArrowUpFromLine size={14} />
      </Link>

      <ChevronDown size={16} className="text-slate-500 sm:hidden" />
    </header>
  )
}

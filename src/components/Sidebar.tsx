import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  LineChart,
  Landmark,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  CalendarClock,
  ShieldCheck,
  Settings,
  Instagram,
  Facebook,
  MessageCircle,
} from 'lucide-react'

const links = [
  { to: '/app', label: 'Discover', icon: LayoutGrid },
  { to: '/app/stocks', label: 'Stock Trading', icon: LineChart },
  { to: '/app/forex', label: 'Forex Trading', icon: Landmark },
  { to: '/app/wallet', label: 'Assets & Wallet', icon: Wallet },
  { to: '/app/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { to: '/app/withdrawal', label: 'Withdraw', icon: ArrowUpFromLine },
  { to: '/app/transactions', label: 'Transaction History', icon: History },
  { to: '/app/calendar', label: 'Economic Calendar', icon: CalendarClock },
  { to: '/app/security', label: 'Security', icon: ShieldCheck },
  { to: '/app/profile', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-base-border bg-base-panel/60 h-screen sticky top-0 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-accent/90 flex items-center justify-center font-bold text-black">
          🐝
        </div>
        <span className="font-bold text-lg tracking-tight">LITTLEBEE</span>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[var(--hover)]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-4">
        <div className="card p-4 relative overflow-hidden">
          <div className="text-4xl mb-3">🍯</div>
          <p className="text-sm font-semibold leading-snug">
            Profit more with LittleBee NFT
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-3">
            LittleBee Token — Innovative Web3.0 Agency Model
          </p>
          <button className="w-full bg-accent text-black text-sm font-semibold py-2 rounded-lg hover:brightness-95 transition">
            Try now
          </button>
        </div>

        <div className="flex items-center gap-3 px-2 text-slate-500">
          <Instagram size={16} className="hover:text-slate-200 cursor-pointer" />
          <MessageCircle size={16} className="hover:text-slate-200 cursor-pointer" />
          <Facebook size={16} className="hover:text-slate-200 cursor-pointer" />
        </div>
      </div>
    </aside>
  )
}

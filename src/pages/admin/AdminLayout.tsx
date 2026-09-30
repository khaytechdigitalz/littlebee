import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, Users, ArrowLeftRight, ShieldCheck, Landmark, Settings, LogOut } from 'lucide-react'
import { logout } from '../../services/auth'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/admin/kyc', label: 'KYC review', icon: ShieldCheck },
  { to: '/admin/gateways', label: 'Payment gateways', icon: Landmark },
  { to: '/admin/settings', label: 'System settings', icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().catch(() => {})
    navigate('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-base-bg">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-base-border bg-base-panel/60 h-screen sticky top-0 px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent/90 flex items-center justify-center font-bold text-black">
            🐝
          </div>
          <span className="font-bold text-lg tracking-tight">LITTLEBEE</span>
        </div>
        <p className="text-[11px] text-slate-600 px-2 mb-6">Admin control panel</p>

        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
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

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-[var(--hover)] transition"
        >
          <LogOut size={18} /> Log out
        </button>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

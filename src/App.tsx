import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth, RequireAdmin } from './components/RouteGuards'

import LandingPage from './pages/LandingPage'

import Dashboard from './pages/Dashboard'
import StockTrading from './pages/StockTrading'
import ForexTrading from './pages/ForexTrading'
import WalletPage from './pages/Wallet'
import WalletDetails from './pages/WalletDetails'
import Deposit from './pages/Deposit'
import Withdrawal from './pages/Withdrawal'
import TransactionHistory from './pages/TransactionHistory'
import Security from './pages/Security'
import Password from './pages/security/Password'
import Pin from './pages/security/Pin'
import TwoFactor from './pages/security/TwoFactor'
import LoginSessions from './pages/security/LoginSessions'
import Profile from './pages/Profile'
import KYC from './pages/KYC'
import EconomicCalendar from './pages/EconomicCalendar'

import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminKyc from './pages/admin/AdminKyc'
import AdminGateways from './pages/admin/AdminGateways'
import AdminSettings from './pages/admin/AdminSettings'

export default function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/forgot" element={<ForgotPassword />} />

      {/* Authenticated trading app */}
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="stocks" element={<StockTrading />} />
          <Route path="forex" element={<ForexTrading />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="wallet/:symbol" element={<WalletDetails />} />
          <Route path="deposit" element={<Deposit />} />
          <Route path="withdrawal" element={<Withdrawal />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="calendar" element={<EconomicCalendar />} />
          <Route path="security" element={<Security />} />
          <Route path="security/password" element={<Password />} />
          <Route path="security/pin" element={<Pin />} />
          <Route path="security/2fa" element={<TwoFactor />} />
          <Route path="security/sessions" element={<LoginSessions />} />
          <Route path="profile" element={<Profile />} />
          <Route path="kyc" element={<KYC />} />
        </Route>
      </Route>

      {/* Admin panel — ordinary predictable path, gated by role, not secrecy */}
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="kyc" element={<AdminKyc />} />
          <Route path="gateways" element={<AdminGateways />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  )
}

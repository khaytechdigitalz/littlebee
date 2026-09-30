import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, Button } from '../../components/ui'
import AuthLayout from './AuthLayout'
import { Chrome, Apple } from 'lucide-react'
import { login } from '../../services/auth'
import { normalizeError } from '../../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login({ email, password })
      navigate(user.role === 'admin' ? '/admin' : '/app')
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue trading">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-400">
            <input type="checkbox" className="accent-accent" defaultChecked />
            Remember me
          </label>
          <Link to="/auth/forgot" className="text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px bg-base-border flex-1" />
        <span className="text-xs text-slate-600">or continue with</span>
        <div className="h-px bg-base-border flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" type="button">
          <Chrome size={16} /> Google
        </Button>
        <Button variant="ghost" type="button">
          <Apple size={16} /> Apple
        </Button>
      </div>

      <p className="text-xs text-slate-500 text-center mt-6">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}

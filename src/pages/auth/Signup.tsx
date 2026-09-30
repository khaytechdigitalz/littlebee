import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, Button } from '../../components/ui'
import AuthLayout from './AuthLayout'
import { register } from '../../services/auth'
import { normalizeError } from '../../services/api'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register({ fullName, email, password })
      navigate('/app')
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start trading with LittleBee in minutes">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Merry Adebayo" required />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={8}
          required
        />
        <Field
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <label className="flex items-start gap-2 text-xs text-slate-400 pt-1">
          <input type="checkbox" className="accent-accent mt-0.5" required />
          I agree to the Terms of Service and Privacy Policy
        </label>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-xs text-slate-500 text-center mt-6">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}

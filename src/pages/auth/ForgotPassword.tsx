import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { Mail } from 'lucide-react'

/**
 * Self-service email reset needs an SMTP/mail provider wired up on the
 * backend (none is configured in this project) — a fake "email sent"
 * confirmation here would just be another non-functional form. Until a real
 * mailer + reset-token endpoint exists, this stays a plain, honest
 * instruction to contact support instead of pretending to send anything.
 */
export default function ForgotPassword() {
  return (
    <AuthLayout title="Reset your password" subtitle="Self-service reset isn't set up yet">
      <div className="text-center py-4">
        <Mail size={32} className="text-accent mx-auto mb-4" />
        <p className="text-sm text-slate-400 mb-6">
          Automated password-reset emails aren't wired up on this instance yet. Contact your administrator or{' '}
          <a href="mailto:support@littlebee.io" className="text-accent hover:underline">
            support@littlebee.io
          </a>{' '}
          to have your password reset manually.
        </p>
      </div>

      <p className="text-xs text-slate-500 text-center mt-2">
        <Link to="/auth/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  )
}

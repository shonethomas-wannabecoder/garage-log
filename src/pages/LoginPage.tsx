import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Car, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type Step = 'email' | 'check-email' | 'code' | 'password' | 'forgot-password' | 'forgot-password-sent'

export function LoginPage() {
  const {
    user,
    loading,
    configured,
    sendEmailLogin,
    verifyEmailCode,
    signInWithPassword,
    requestPasswordReset,
  } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!configured) return <Navigate to="/setup" replace />
  if (!loading && user) return <Navigate to="/" replace />

  async function handleSendLogin(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await sendEmailLogin(email)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else setStep('check-email')
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await verifyEmailCode(email, code)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  async function handlePasswordSignIn(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signInWithPassword(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await requestPasswordReset(email)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else setStep('forgot-password-sent')
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-on-brand-soft">
            <Car size={26} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Garage Log</h1>
          <p className="mt-1 text-muted">Know what was done before the shop recommends more</p>
          <div className="card mt-5 px-4 py-3.5 text-left text-sm leading-relaxed text-muted">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
              Why this exists
            </p>
            <p>
              Built to help the average conscious consumer hold dealers accountable for their
              recommendations. Twice in one year, the dealership recommended — and charged for —
              services already done on the last visit: over $400 each time, then hours the creator
              spent disputing each bill.
            </p>
            <p className="mt-2 text-content">
              Garage Log stores your repair history so you can verify what was actually done before
              you agree to more work.
            </p>
          </div>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendLogin} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-content">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                className="field mt-1.5 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <p className="text-xs text-faint">
              We&apos;ll email you a sign-in link. No password needed.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? 'Sending…' : 'Continue with email'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted"
              onClick={() => {
                setStep('password')
                setError(null)
              }}
            >
              Sign in with password instead
            </button>
          </form>
        )}

        {step === 'check-email' && (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-brand/30 bg-brand-soft p-5 text-on-brand-soft">
              <Mail size={28} className="mx-auto" aria-hidden />
              <p className="mt-3 font-medium">Check your email</p>
              <p className="mt-2 text-sm opacity-90">
                We sent a sign-in link to <span className="font-medium">{email}</span>
              </p>
              <p className="mt-3 text-sm opacity-90">
                Tap the link in the email to sign in. You&apos;ll land back here automatically.
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-brand"
              disabled={submitting}
              onClick={async () => {
                setError(null)
                setSubmitting(true)
                const result = await sendEmailLogin(email)
                setSubmitting(false)
                if (result.error) setError(result.error)
              }}
            >
              {submitting ? 'Sending…' : 'Resend link'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted"
              onClick={() => {
                setStep('code')
                setCode('')
                setError(null)
              }}
            >
              Have a 6-digit code instead?
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-faint"
              onClick={() => {
                setStep('email')
                setError(null)
              }}
            >
              Use a different email
            </button>
          </div>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-center text-sm text-muted">
              Enter the 6-digit code from your email (if your email included one)
            </p>
            <label className="block">
              <span className="text-sm font-medium text-content">Verification code</span>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]{6}"
                className="field mt-1.5 py-3 text-center text-2xl tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={submitting || code.length < 6}
              className="btn-primary w-full py-3.5"
            >
              {submitting ? 'Verifying…' : 'Sign in with code'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-brand"
              onClick={() => {
                setStep('check-email')
                setCode('')
                setError(null)
              }}
            >
              Use the email link instead
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-content">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                className="field mt-1.5 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-content">Password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="field mt-1.5 py-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="text-right">
              <button
                type="button"
                className="text-sm font-medium text-brand"
                onClick={() => {
                  setStep('forgot-password')
                  setPassword('')
                  setError(null)
                }}
              >
                Forgot password?
              </button>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-brand"
              onClick={() => {
                setStep('email')
                setPassword('')
                setError(null)
              }}
            >
              Use email link instead
            </button>
          </form>
        )}

        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-center text-sm text-muted">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-content">Email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                className="field mt-1.5 py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-brand"
              onClick={() => {
                setStep('password')
                setError(null)
              }}
            >
              Back to sign in
            </button>
          </form>
        )}

        {step === 'forgot-password-sent' && (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border border-brand/30 bg-brand-soft p-5 text-on-brand-soft">
              <Mail size={28} className="mx-auto" aria-hidden />
              <p className="mt-3 font-medium">Check your email</p>
              <p className="mt-2 text-sm opacity-90">
                We sent a password reset link to <span className="font-medium">{email}</span>
              </p>
              <p className="mt-3 text-sm opacity-90">
                Tap the link in the email to choose a new password.
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-brand"
              disabled={submitting}
              onClick={async () => {
                setError(null)
                setSubmitting(true)
                const result = await requestPasswordReset(email)
                setSubmitting(false)
                if (result.error) setError(result.error)
              }}
            >
              {submitting ? 'Sending…' : 'Resend reset link'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted"
              onClick={() => {
                setStep('password')
                setError(null)
              }}
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

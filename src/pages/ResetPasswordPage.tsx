import { type FormEvent, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Car, KeyRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export function ResetPasswordPage() {
  const { user, loading, configured, updatePassword } = useAuth()
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!configured) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else if (!loading) setInvalidLink(true)
    })

    return () => subscription.unsubscribe()
  }, [configured, loading])

  if (!configured) return <Navigate to="/setup" replace />
  if (!loading && user && done) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else setDone(true)
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-on-brand-soft">
            <Car size={26} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Garage Log</h1>
          <p className="mt-1 text-muted">Set a new password</p>
        </div>

        {!ready && !invalidLink && (
          <p className="text-center text-sm text-muted">Verifying reset link…</p>
        )}

        {invalidLink && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-danger">
              This reset link is invalid or has expired. Request a new one from the login page.
            </p>
            <Link to="/login" className="inline-block text-sm font-medium text-brand">
              Back to login
            </Link>
          </div>
        )}

        {ready && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4 text-on-brand-soft">
              <KeyRound size={22} className="mx-auto" aria-hidden />
              <p className="mt-2 text-center text-sm">Choose a new password for your account.</p>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-content">New password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
                className="field mt-1.5 py-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-content">Confirm password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="field mt-1.5 py-3"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}

        {done && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-content">Your password has been updated. You&apos;re signed in.</p>
            <Link to="/" className="inline-block text-sm font-medium text-brand">
              Go to Garage Log
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

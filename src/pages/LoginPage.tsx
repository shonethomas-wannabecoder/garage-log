import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { user, loading, configured, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!configured) return <Navigate to="/setup" replace />
  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    if (result.error) setError(result.error)
    else if (mode === 'signup') {
      setError(null)
      alert('Check your email to confirm your account, then sign in.')
      setMode('signin')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Garage Log</h1>
        <p className="mt-1 text-slate-400">Repair history for your household</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-400">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-600 py-3 font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-sky-400"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

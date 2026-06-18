import { type FormEvent } from 'react'
import { CheckCircle2, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import type { WaitlistStatus } from '../types'

const PERKS = [
  'Photograph invoices and build a repair timeline',
  'Compare shop quotes against work you already had done',
] as const

type WaitlistJoinFormProps = {
  email: string
  error: string | null
  submitting: boolean
  onEmailChange: (email: string) => void
  onSubmit: (e: FormEvent) => void
  onSignInClick: () => void
}

export function WaitlistJoinForm({
  email,
  error,
  submitting,
  onEmailChange,
  onSubmit,
  onSignInClick,
}: WaitlistJoinFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="card relative overflow-hidden border-brand/20 p-5 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[#7551ff] text-white shadow-[0_8px_24px_var(--brand-glow)]">
            <Sparkles size={22} aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Early access
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-content">
            Thanks for your interest
          </h2>
          <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-muted">
            We&apos;re opening Garage Log carefully — a few spots at a time — so everyone gets a
            solid experience from day one.
          </p>
        </div>

        <ul className="relative mt-5 space-y-2.5 text-left">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-sm leading-snug text-content/90">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-brand"
                aria-hidden
              />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-content">Your email</span>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="field mt-1.5 py-3"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-faint">
            We&apos;ll only use this to let you know when your spot opens.
          </p>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
          {submitting ? 'Saving your spot…' : 'Count me in'}
        </button>

        <button
          type="button"
          className="w-full rounded-xl py-2.5 text-center text-sm font-medium text-brand transition-colors hover:text-content"
          onClick={onSignInClick}
        >
          Already approved? Sign in
        </button>
      </div>
    </form>
  )
}

type WaitlistJoinedMessageProps = {
  email: string
  status: WaitlistStatus | null
  onSignInClick: () => void
}

export function WaitlistJoinedMessage({ email, status, onSignInClick }: WaitlistJoinedMessageProps) {
  const rejected = status === 'rejected'

  return (
    <div className="space-y-5 text-center">
      <div className="card relative overflow-hidden border-brand/20 p-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-ok/25 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          {rejected ? (
            <Mail size={28} className="mx-auto text-muted" aria-hidden />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft text-on-ok-soft">
              <CheckCircle2 size={26} aria-hidden />
            </div>
          )}

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-content">
            {rejected ? 'Not eligible right now' : "You're on the list"}
          </h2>

          {rejected ? (
            <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-muted">
              This email isn&apos;t eligible for access at the moment. If you think that&apos;s a
              mistake, reach out and we&apos;ll take another look.
            </p>
          ) : (
            <>
              <p className="mx-auto mt-2 max-w-[20rem] text-sm leading-relaxed text-muted">
                Seriously — thank you. We&apos;re excited to have you and we&apos;ll email you as
                soon as your spot is ready.
              </p>
              <p className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-content">
                <Mail size={14} className="shrink-0 text-faint" aria-hidden />
                <span className="truncate">{email}</span>
              </p>
              <p className="mt-4 text-xs leading-relaxed text-faint">
                Come back here after approval to sign in and set up your garage.
              </p>
            </>
          )}
        </div>
      </div>

      {!rejected && (
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-brand transition-colors hover:text-content"
          onClick={onSignInClick}
        >
          Approved already? Sign in
        </button>
      )}
    </div>
  )
}

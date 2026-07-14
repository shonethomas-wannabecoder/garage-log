import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, Monitor, LogOut, UserPlus, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { useTheme, type ThemePref } from '../contexts/ThemeContext'
import { PageHeader } from '../components/ui'
import { supabase } from '../lib/supabase'
import type { HouseholdInvite } from '../types'

const THEME_OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function HouseholdPage() {
  const { user, signOut } = useAuth()
  const { household, members, updateHouseholdName, refresh } = useHousehold()
  const { pref, setPref } = useTheme()
  const [name, setName] = useState(household?.name ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [invites, setInvites] = useState<HouseholdInvite[]>([])
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [acceptMsg, setAcceptMsg] = useState<string | null>(null)

  const loadInvites = useCallback(async () => {
    if (!household) return
    const { data } = await supabase
      .from('household_invites')
      .select('*')
      .eq('household_id', household.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setInvites((data ?? []) as HouseholdInvite[])
  }, [household])

  useEffect(() => {
    if (household?.name) setName(household.name)
  }, [household?.name])

  useEffect(() => {
    void loadInvites()
  }, [loadInvites])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc('is_app_admin')
      setIsAdmin(Boolean(data))
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      // Best-effort: members list with ids; try invite table emails for labels.
      const emails: Record<string, string> = {}
      if (user?.id && user.email) emails[user.id] = user.email
      setMemberEmails(emails)
    })()
  }, [user])

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    const result = await updateHouseholdName(name.trim())
    setMessage(result.error ? result.error : 'Saved.')
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg(null)
    const { data, error } = await supabase.rpc('invite_household_member', {
      raw_email: inviteEmail.trim(),
    })
    setInviting(false)
    if (error) {
      setInviteMsg(error.message)
      return
    }
    const row = data as { ok?: boolean; error?: string; already_invited?: boolean } | null
    if (!row?.ok) {
      setInviteMsg(row?.error ?? 'Could not send invite')
      return
    }
    setInviteMsg(row.already_invited ? 'Already invited.' : 'Invite saved. They can accept after signing in.')
    setInviteEmail('')
    await loadInvites()
  }

  async function handleAcceptInvite() {
    setAcceptMsg(null)
    const { data, error } = await supabase.rpc('accept_household_invite')
    if (error) {
      setAcceptMsg(error.message)
      return
    }
    const row = data as { ok?: boolean; error?: string } | null
    if (!row?.ok) {
      setAcceptMsg(row?.error ?? 'No pending invite')
      return
    }
    setAcceptMsg('You’re in the household.')
    await refresh()
  }

  async function handleRevoke(id: string) {
    await supabase.rpc('revoke_household_invite', { invite_id: id })
    await loadInvites()
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this member from the household?')) return
    await supabase.rpc('remove_household_member', { target_user_id: userId })
    await refresh()
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Family" subtitle="Shared garage for you and family." />

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="mt-3 flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPref(value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                pref === value ? 'bg-surface text-content shadow-sm' : 'text-muted'
              }`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={handleRename} className="card space-y-3 p-4">
        <label className="block">
          <span className="text-sm text-muted">Household name</span>
          <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {message && <p className="text-sm text-muted">{message}</p>}
        <button type="submit" className="btn-ghost px-4 py-2 text-sm">
          Save name
        </button>
      </form>

      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-brand" aria-hidden />
          <h2 className="font-semibold">Invite family</h2>
        </div>
        <p className="text-sm text-muted">
          Invite by email. They sign in with that email, then tap Accept invite below.
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            required
            className="field flex-1"
            placeholder="family@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button type="submit" disabled={inviting} className="btn-primary px-4 text-sm">
            {inviting ? '…' : 'Invite'}
          </button>
        </form>
        {inviteMsg && <p className="text-sm text-muted">{inviteMsg}</p>}
        {invites.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 text-muted">
                <span>{inv.email} · pending</span>
                <button
                  type="button"
                  className="text-xs font-medium text-danger"
                  onClick={() => void handleRevoke(inv.id)}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn-ghost w-full py-2 text-sm" onClick={() => void handleAcceptInvite()}>
          Accept invite for my email
        </button>
        {acceptMsg && <p className="text-sm text-muted">{acceptMsg}</p>}
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Members</h2>
        <p className="mt-1 text-sm text-muted">{members.length} member(s)</p>
        <ul className="mt-3 space-y-1 text-sm">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-2 text-muted">
              <span>
                {m.user_id === user?.id
                  ? `You (${user.email ?? 'signed in'})`
                  : memberEmails[m.user_id] ?? m.user_id.slice(0, 8) + '…'}{' '}
                · {m.role}
              </span>
              {m.user_id !== user?.id && (
                <button
                  type="button"
                  className="text-xs font-medium text-danger"
                  onClick={() => void handleRemove(m.user_id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (
        <Link to="/admin/waitlist" className="card flex items-center gap-2 p-4 text-sm font-medium text-brand">
          <Shield size={16} aria-hidden />
          Waitlist admin
        </Link>
      )}

      <button
        type="button"
        onClick={() => void signOut()}
        className="btn-ghost flex w-full items-center justify-center gap-2 py-2.5 text-muted"
      >
        <LogOut size={16} aria-hidden />
        Sign out
      </button>
    </div>
  )
}

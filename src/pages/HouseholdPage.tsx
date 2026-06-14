import { type FormEvent, useEffect, useState } from 'react'
import { Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'
import { useTheme, type ThemePref } from '../contexts/ThemeContext'
import { PageHeader } from '../components/ui'

const THEME_OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function HouseholdPage() {
  const { user, signOut } = useAuth()
  const { household, members, updateHouseholdName } = useHousehold()
  const { pref, setPref } = useTheme()
  const [name, setName] = useState(household?.name ?? '')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (household?.name) setName(household.name)
  }, [household?.name])

  async function handleRename(e: FormEvent) {
    e.preventDefault()
    const result = await updateHouseholdName(name.trim())
    setMessage(result.error ? result.error : 'Saved.')
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

      <section className="card p-4">
        <h2 className="font-semibold">Members</h2>
        <p className="mt-1 text-sm text-muted">
          {members.length} member(s) — email invites coming soon.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {members.map((m) => (
            <li key={m.user_id} className="text-muted">
              {m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8) + '…'} · {m.role}
            </li>
          ))}
        </ul>
      </section>

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

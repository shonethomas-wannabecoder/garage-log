import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useHousehold } from '../contexts/HouseholdContext'

export function HouseholdPage() {
  const { user, signOut } = useAuth()
  const { household, members, updateHouseholdName } = useHousehold()
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Household</h1>
        <p className="text-sm text-slate-400">Shared garage for you and family.</p>
      </header>

      <form onSubmit={handleRename} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <label className="block">
          <span className="text-sm text-slate-400">Household name</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {message && <p className="text-sm text-slate-400">{message}</p>}
        <button type="submit" className="rounded-lg bg-slate-700 px-4 py-2 text-sm">
          Save name
        </button>
      </form>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-semibold">Members</h2>
        <p className="mt-1 text-sm text-slate-400">{members.length} member(s) — email invites coming soon.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {members.map((m) => (
            <li key={m.user_id} className="text-slate-300">
              {m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8) + '…'} · {m.role}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
        <h2 className="font-semibold text-slate-200">Coming in Week 2</h2>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>AI invoice parsing with review before save</li>
          <li>Email invites for household members</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="w-full rounded-lg border border-slate-700 py-2.5 text-slate-300"
      >
        Sign out
      </button>
    </div>
  )
}

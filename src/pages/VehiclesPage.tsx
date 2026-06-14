import { type FormEvent, useState } from 'react'
import { useHousehold } from '../contexts/HouseholdContext'

export function VehiclesPage() {
  const { vehicles, addVehicle, deleteVehicle } = useHousehold()
  const [nickname, setNickname] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) return
    setSaving(true)
    setError(null)
    const result = await addVehicle({
      nickname: nickname.trim(),
      year: year ? Number(year) : null,
      make: make.trim() || null,
      model: model.trim() || null,
      vin: null,
    })
    if (result.error) setError(result.error)
    else {
      setNickname('')
      setYear('')
      setMake('')
      setModel('')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cars</h1>
        <p className="text-sm text-slate-400">Vehicles shared with your household.</p>
      </header>

      <ul className="space-y-2">
        {vehicles.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-3"
          >
            <div>
              <p className="font-medium">{v.nickname}</p>
              <p className="text-sm text-slate-400">
                {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'No details'}
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-red-400"
              onClick={() => {
                if (confirm(`Delete ${v.nickname}? All service history will be removed.`)) {
                  void deleteVehicle(v.id)
                }
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="font-semibold">Add vehicle</h2>
        <input
          placeholder="Nickname (e.g. Daily SUV)"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Year"
            inputMode="numeric"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <input
            placeholder="Make"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />
          <input
            placeholder="Model"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-sky-600 py-2.5 font-medium disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add vehicle'}
        </button>
      </form>
    </div>
  )
}

import { type FormEvent, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import { PageHeader } from '../components/ui'
import { BrandAvatar } from '../components/BrandAvatar'

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
    <div className="space-y-5">
      <PageHeader title="Cars" subtitle="Vehicles shared with your household." />

      <ul className="space-y-2">
        {vehicles.map((v) => (
          <li key={v.id} className="card flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <BrandAvatar make={v.make} size={38} />
              <div>
                <p className="font-medium">{v.nickname}</p>
                <p className="text-sm text-muted">
                  {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'No details'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={`Delete ${v.nickname}`}
              className="p-1 text-faint active:text-danger"
              onClick={() => {
                if (confirm(`Delete ${v.nickname}? All service history will be removed.`)) {
                  void deleteVehicle(v.id)
                }
              }}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="card space-y-3 p-4">
        <h2 className="font-semibold">Add vehicle</h2>
        <input
          placeholder="Nickname (e.g. Daily SUV)"
          required
          className="field"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="Year"
            inputMode="numeric"
            className="field"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <input
            placeholder="Make"
            className="field"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />
          <input
            placeholder="Model"
            className="field"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
          {saving ? 'Adding…' : 'Add vehicle'}
        </button>
      </form>
    </div>
  )
}

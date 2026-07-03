import { type FormEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, ChevronDown, Trash2 } from 'lucide-react'
import { demoAddVehicleDraft } from '../demo/fixtures'
import { useHousehold } from '../contexts/HouseholdContext'
import { PageHeader } from '../components/ui'
import { BrandAvatar } from '../components/BrandAvatar'
import { VehicleCostSummary } from '../components/VehicleCostSummary'
import type { Vehicle } from '../types'

export function VehiclesPage() {
  const { pathname } = useLocation()
  const draft = pathname === '/__journey__/vehicles' ? demoAddVehicleDraft : null
  const { vehicles, addVehicle, deleteVehicle } = useHousehold()
  const [nickname, setNickname] = useState(draft?.nickname ?? '')
  const [year, setYear] = useState(draft?.year ?? '')
  const [make, setMake] = useState(draft?.make ?? '')
  const [model, setModel] = useState(draft?.model ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    await deleteVehicle(pendingDelete.id)
    setDeleting(false)
    setPendingDelete(null)
  }

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
      shop_concerns: null,
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
        {vehicles.map((v) => {
          const expanded = expandedId === v.id
          return (
            <li key={v.id} className="card px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : v.id)}
                  aria-expanded={expanded}
                >
                  <BrandAvatar make={v.make} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{v.nickname}</p>
                    <p className="truncate text-sm text-muted">
                      {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'No details'}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${v.nickname}`}
                  className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-faint transition-colors active:bg-danger-soft active:text-danger"
                  onClick={() => setPendingDelete(v)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {expanded && <VehicleCostSummary vehicleId={v.id} />}
            </li>
          )
        })}
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

      {pendingDelete && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-vehicle-title"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            className="card w-full max-w-sm p-5"
            style={{ background: 'var(--bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle size={18} aria-hidden />
              <h2 id="delete-vehicle-title" className="text-base font-semibold text-content">
                Delete {pendingDelete.nickname}?
              </h2>
            </div>
            <p className="mt-2 text-sm text-muted">
              This removes the vehicle and all of its service history, including invoices. This
              can&apos;t be undone.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={deleting}
                className="btn-ghost py-2.5 text-sm"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                className="rounded-xl py-2.5 text-sm font-medium text-white transition-opacity active:opacity-85 disabled:opacity-50"
                style={{ background: 'var(--danger)' }}
                onClick={() => void handleConfirmDelete()}
              >
                {deleting ? 'Deleting…' : 'Delete vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

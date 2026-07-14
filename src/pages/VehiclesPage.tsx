import { type FormEvent, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { demoAddVehicleDraft } from '../demo/fixtures'
import { useHousehold } from '../contexts/HouseholdContext'
import { PageHeader } from '../components/ui'
import { BrandAvatar } from '../components/BrandAvatar'
import { VehicleCostSummary } from '../components/VehicleCostSummary'
import { UpdateMileageCard } from '../components/UpdateMileageCard'
import { exportVehicleHistory } from '../lib/exportHistory'
import { supabase } from '../lib/supabase'
import type { LineItem, ServiceVisit, Vehicle } from '../types'

export function VehiclesPage() {
  const { pathname } = useLocation()
  const draft = pathname === '/__journey__/vehicles' ? demoAddVehicleDraft : null
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useHousehold()
  const [nickname, setNickname] = useState(draft?.nickname ?? '')
  const [year, setYear] = useState(draft?.year ?? '')
  const [make, setMake] = useState(draft?.make ?? '')
  const [model, setModel] = useState(draft?.model ?? '')
  const [vin, setVin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNickname, setEditNickname] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editMake, setEditMake] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editVin, setEditVin] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  function startEdit(v: Vehicle) {
    setEditingId(v.id)
    setExpandedId(v.id)
    setEditNickname(v.nickname)
    setEditYear(v.year != null ? String(v.year) : '')
    setEditMake(v.make ?? '')
    setEditModel(v.model ?? '')
    setEditVin(v.vin ?? '')
    setEditError(null)
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId || !editNickname.trim()) return
    setEditSaving(true)
    setEditError(null)
    const result = await updateVehicle(editingId, {
      nickname: editNickname.trim(),
      year: editYear ? Number(editYear) : null,
      make: editMake.trim() || null,
      model: editModel.trim() || null,
      vin: editVin.trim() || null,
    })
    setEditSaving(false)
    if (result.error) setEditError(result.error)
    else setEditingId(null)
  }

  async function handleExport(v: Vehicle) {
    setExportingId(v.id)
    const { data: visits } = await supabase
      .from('service_visits')
      .select('*')
      .eq('vehicle_id', v.id)
      .eq('parse_status', 'confirmed')
      .order('service_date', { ascending: false })
    const list = (visits ?? []) as ServiceVisit[]
    const linesByVisit: Record<string, LineItem[]> = {}
    for (const visit of list) {
      const { data: lines } = await supabase
        .from('line_items')
        .select('*')
        .eq('service_visit_id', visit.id)
        .order('sort_order')
      linesByVisit[visit.id] = (lines ?? []) as LineItem[]
    }
    exportVehicleHistory(v, list, linesByVisit)
    setExportingId(null)
  }

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
      vin: vin.trim() || null,
      shop_concerns: null,
      current_odometer: null,
      odometer_updated_at: null,
    })
    if (result.error) setError(result.error)
    else {
      setNickname('')
      setYear('')
      setMake('')
      setModel('')
      setVin('')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Cars" subtitle="Vehicles shared with your household." />

      <ul className="space-y-2">
        {vehicles.map((v) => {
          const expanded = expandedId === v.id
          const editing = editingId === v.id
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
                      {v.vin ? ` · VIN …${v.vin.slice(-6)}` : ''}
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
                  aria-label={`Edit ${v.nickname}`}
                  className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-faint transition-colors active:bg-brand-soft active:text-brand"
                  onClick={() => startEdit(v)}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${v.nickname}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-faint transition-colors active:bg-danger-soft active:text-danger"
                  onClick={() => setPendingDelete(v)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {expanded && (
                <div className="mt-3 space-y-3 border-t border-line pt-3">
                  {editing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <h3 className="text-sm font-semibold">Edit vehicle</h3>
                      <input
                        className="field"
                        required
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="Nickname"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="field"
                          inputMode="numeric"
                          placeholder="Year"
                          value={editYear}
                          onChange={(e) => setEditYear(e.target.value)}
                        />
                        <input
                          className="field"
                          placeholder="Make"
                          value={editMake}
                          onChange={(e) => setEditMake(e.target.value)}
                        />
                        <input
                          className="field"
                          placeholder="Model"
                          value={editModel}
                          onChange={(e) => setEditModel(e.target.value)}
                        />
                      </div>
                      <input
                        className="field"
                        placeholder="VIN (optional)"
                        value={editVin}
                        onChange={(e) => setEditVin(e.target.value)}
                      />
                      {editError && <p className="text-sm text-danger">{editError}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="btn-ghost py-2.5 text-sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" disabled={editSaving} className="btn-primary py-2.5 text-sm">
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : null}
                  <UpdateMileageCard vehicleId={v.id} />
                  <VehicleCostSummary vehicleId={v.id} />
                  <button
                    type="button"
                    className="btn-ghost w-full py-2.5 text-sm"
                    disabled={exportingId === v.id}
                    onClick={() => void handleExport(v)}
                  >
                    {exportingId === v.id ? 'Exporting…' : 'Export service history'}
                  </button>
                </div>
              )}
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
        <input
          placeholder="VIN (optional)"
          className="field"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
        />
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

import { useHousehold } from '../contexts/HouseholdContext'
import type { Vehicle } from '../types'

function vehicleLabel(v: Vehicle): string {
  const ymm = [v.year, v.make, v.model].filter(Boolean).join(' ')
  return ymm ? `${v.nickname} (${ymm})` : v.nickname
}

export function VehicleSelect() {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, loading } = useHousehold()

  if (loading) return <p className="text-sm text-slate-400">Loading vehicles…</p>
  if (!vehicles.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-400">
        Add a vehicle under <strong className="text-slate-200">Cars</strong> to start logging services.
      </p>
    )
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Vehicle
      </span>
      <select
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-base"
        value={selectedVehicleId ?? ''}
        onChange={(e) => setSelectedVehicleId(e.target.value || null)}
      >
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {vehicleLabel(v)}
          </option>
        ))}
      </select>
    </label>
  )
}

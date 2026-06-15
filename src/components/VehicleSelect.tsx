import { Car, ChevronDown } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import type { Vehicle } from '../types'

function vehicleLabel(v: Vehicle): string {
  const ymm = [v.year, v.make, v.model].filter(Boolean).join(' ')
  return ymm ? `${v.nickname} (${ymm})` : v.nickname
}

export function VehicleSelect({ label = true }: { label?: boolean }) {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, loading } = useHousehold()

  if (loading) return <p className="text-sm text-muted">Loading vehicles…</p>
  if (!vehicles.length) {
    return (
      <div className="card flex items-center gap-3 border-dashed p-4 text-sm text-muted">
        <Car size={20} className="text-faint" aria-hidden />
        <span>
          Add a vehicle under <strong className="text-content">Cars</strong> to start logging.
        </span>
      </div>
    )
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-faint">
          Vehicle
        </span>
      )}
      <div className="card relative flex items-center gap-3 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white"
          style={{ background: 'var(--grad)' }}
          aria-hidden
        >
          <Car size={18} />
        </span>
        <select
          className="peer w-full appearance-none bg-transparent pr-6 text-base font-medium text-content focus:outline-none"
          value={selectedVehicleId ?? ''}
          onChange={(e) => setSelectedVehicleId(e.target.value || null)}
          aria-label="Select vehicle"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id} className="bg-surface text-content">
              {vehicleLabel(v)}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute right-4 text-faint" aria-hidden />
      </div>
    </div>
  )
}

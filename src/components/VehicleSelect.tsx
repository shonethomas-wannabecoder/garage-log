import { Link } from 'react-router-dom'
import { ArrowRight, Car, ChevronDown } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import { BrandAvatar } from './BrandAvatar'
import type { Vehicle } from '../types'

function vehicleYmm(v: Vehicle): string {
  return [v.year, v.make, v.model].filter(Boolean).join(' ')
}

/** Option label without repeating the nickname when it's part of the year/make/model. */
function optionLabel(v: Vehicle): string {
  const ymm = vehicleYmm(v)
  if (!ymm) return v.nickname
  if (ymm.toLowerCase().includes(v.nickname.trim().toLowerCase())) return ymm
  return `${v.nickname} — ${ymm}`
}

export function VehicleSelect({ label = true }: { label?: boolean }) {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, loading } = useHousehold()

  if (loading) {
    return <div className="skeleton h-[68px]" aria-label="Loading vehicles" role="status" />
  }
  if (!vehicles.length) {
    return (
      <Link
        to="/vehicles"
        className="card flex items-center gap-3 border-dashed p-4 text-sm text-muted active:bg-surface-2"
      >
        <Car size={20} className="shrink-0 text-faint" aria-hidden />
        <span className="flex-1">
          Add your first vehicle to start logging service.
        </span>
        <span className="flex shrink-0 items-center gap-1 font-medium text-brand">
          Add <ArrowRight size={14} aria-hidden />
        </span>
      </Link>
    )
  }

  const selected = vehicles.find((v) => v.id === selectedVehicleId)
  const ymm = selected ? vehicleYmm(selected) : ''
  const single = vehicles.length === 1

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-faint">
          Vehicle
        </span>
      )}
      <div className="card relative flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-brand/40">
        <BrandAvatar make={selected?.make} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-content">{selected?.nickname}</p>
          {ymm && ymm.toLowerCase() !== selected?.nickname.trim().toLowerCase() && (
            <p className="truncate text-sm text-muted">{ymm}</p>
          )}
        </div>
        {!single && (
          <>
            <ChevronDown size={18} className="pointer-events-none shrink-0 text-faint" aria-hidden />
            <select
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 focus:outline-none"
              value={selectedVehicleId ?? ''}
              onChange={(e) => setSelectedVehicleId(e.target.value || null)}
              aria-label="Select vehicle"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-surface text-content">
                  {optionLabel(v)}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  )
}

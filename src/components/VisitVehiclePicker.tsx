import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import { BrandAvatar } from './BrandAvatar'
import type { Vehicle } from '../types'

export function vehicleLabel(v: Vehicle): string {
  const ymm = [v.year, v.make, v.model].filter(Boolean).join(' ')
  if (!ymm) return v.nickname
  // Avoid "Passat (2020 Volkswagen Passat)" — skip the nickname when it's already in the YMM
  if (ymm.toLowerCase().includes(v.nickname.trim().toLowerCase())) return ymm
  return `${v.nickname} — ${ymm}`
}

export function VisitVehiclePicker({
  vehicleId,
  onVehicleChange,
  disabled,
}: {
  vehicleId: string
  onVehicleChange: (nextId: string) => void | Promise<void>
  disabled?: boolean
}) {
  const { vehicles, loading } = useHousehold()
  const selected = vehicles.find((v) => v.id === vehicleId)
  const canMove = vehicles.length >= 2

  if (loading) {
    return (
      <section className="card space-y-2 p-4">
        <h2 className="text-base font-semibold">Vehicle</h2>
        <p className="text-sm text-muted">Loading vehicles…</p>
      </section>
    )
  }

  if (!vehicles.length) return null

  return (
    <section className="card space-y-3 p-4">
      <div>
        <h2 className="text-base font-semibold">Vehicle</h2>
        <p className="mt-0.5 text-sm text-muted">
          {canMove
            ? 'Wrong car? Choose the correct vehicle below.'
            : 'This visit is saved under this vehicle.'}
        </p>
      </div>

      {canMove ? (
        <label className="block">
          <div className="relative flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <BrandAvatar make={selected?.make} size={38} />
            <select
              className="peer w-full appearance-none bg-transparent pr-6 text-base font-medium text-content focus:outline-none disabled:opacity-50"
              value={vehicleId}
              disabled={disabled}
              onChange={(e) => void onVehicleChange(e.target.value)}
              aria-label="Select vehicle for this visit"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className="bg-surface text-content">
                  {vehicleLabel(v)}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 text-faint" aria-hidden />
          </div>
          <p className="mt-1.5 text-xs text-faint">
            Invoice photos and line items move with the visit.
          </p>
        </label>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <BrandAvatar make={selected?.make} size={38} />
            <span className="text-base font-medium text-content">
              {selected ? vehicleLabel(selected) : 'Unknown vehicle'}
            </span>
          </div>
          <p className="text-xs text-faint">
            Logged to the wrong car?{' '}
            <Link to="/vehicles" className="font-medium text-brand">
              Add your other vehicle under Cars
            </Link>
            , then return here to move this visit.
          </p>
        </>
      )}
    </section>
  )
}

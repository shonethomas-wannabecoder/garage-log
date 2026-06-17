import { ChevronDown } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import { BrandAvatar } from './BrandAvatar'
import type { Vehicle } from '../types'

export function vehicleLabel(v: Vehicle): string {
  const ymm = [v.year, v.make, v.model].filter(Boolean).join(' ')
  return ymm ? `${v.nickname} (${ymm})` : v.nickname
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

  if (loading || vehicles.length < 2) return null

  const selected = vehicles.find((v) => v.id === vehicleId)

  return (
    <label className="block">
      <span className="text-sm text-muted">Vehicle</span>
      <div className="card relative mt-1 flex items-center gap-3 px-4 py-3">
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
        Wrong car? Pick the correct vehicle — invoice and line items move with it.
      </p>
    </label>
  )
}

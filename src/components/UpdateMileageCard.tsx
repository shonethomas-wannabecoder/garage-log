import { type FormEvent, useEffect, useState } from 'react'
import { Gauge } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'
import { formatDate, formatMileage } from '../lib/format'

export function UpdateMileageCard({ vehicleId }: { vehicleId: string | null }) {
  const { vehicles, updateVehicleMileage } = useHousehold()
  const vehicle = vehicles.find((v) => v.id === vehicleId)
  const [miles, setMiles] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMiles(vehicle?.current_odometer != null ? String(vehicle.current_odometer) : '')
    setError(null)
    setSaved(false)
  }, [vehicle?.id, vehicle?.current_odometer])

  if (!vehicle) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseInt(miles.replace(/,/g, ''), 10)
    if (!Number.isFinite(value) || value < 0) {
      setError('Enter a valid mileage.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await updateVehicleMileage(vehicle!.id, value)
    setSaving(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-4">
      <div className="flex items-center gap-2 text-brand">
        <Gauge size={18} aria-hidden />
        <h2 className="text-sm font-semibold text-content">Current mileage</h2>
      </div>
      <p className="text-xs text-muted">
        Keep this updated between visits so “Up next” and reminders stay accurate for{' '}
        {vehicle.nickname}.
      </p>
      {vehicle.current_odometer != null && (
        <p className="text-sm text-faint">
          Last saved: {formatMileage(vehicle.current_odometer)}
          {vehicle.odometer_updated_at
            ? ` · ${formatDate(vehicle.odometer_updated_at.slice(0, 10))}`
            : ''}
        </p>
      )}
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          className="field flex-1"
          placeholder="e.g. 94500"
          value={miles}
          onChange={(e) => setMiles(e.target.value)}
          aria-label="Current odometer"
        />
        <button type="submit" disabled={saving} className="btn-primary px-4 py-2.5 text-sm">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-ok">Saved</p>}
    </form>
  )
}

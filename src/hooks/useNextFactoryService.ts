import { useMemo } from 'react'
import { useHousehold } from '../contexts/HouseholdContext'
import { computeNextFactoryService } from '../lib/nextFactoryService'
import type { ServiceVisit } from '../types'

// Derives the next factory-service recommendation from visits the caller already
// has, to avoid issuing a second identical query for the same vehicle.
export function useNextFactoryService(vehicleId: string | null, visits: ServiceVisit[]) {
  const { vehicles } = useHousehold()

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  )

  const currentMiles = useMemo(() => {
    const readings = visits.map((v) => v.odometer).filter((o): o is number => o != null)
    if (!readings.length) return null
    return Math.max(...readings)
  }, [visits])

  const recommendation = useMemo(() => {
    if (!vehicle) return null
    return computeNextFactoryService(vehicle, currentMiles)
  }, [vehicle, currentMiles])

  return { recommendation, currentMiles, vehicle }
}

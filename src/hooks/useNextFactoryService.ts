import { useMemo } from 'react'
import { useHousehold } from '../contexts/HouseholdContext'
import { computeNextFactoryService } from '../lib/nextFactoryService'
import { useVisits } from './useVisits'

export function useNextFactoryService(vehicleId: string | null) {
  const { vehicles } = useHousehold()
  const { visits, loading } = useVisits(vehicleId)

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null

  const currentMiles = useMemo(() => {
    const readings = visits.map((v) => v.odometer).filter((o): o is number => o != null)
    if (!readings.length) return null
    return Math.max(...readings)
  }, [visits])

  const recommendation = useMemo(() => {
    if (!vehicle) return null
    return computeNextFactoryService(vehicle, currentMiles)
  }, [vehicle, currentMiles])

  return { recommendation, currentMiles, vehicle, loading }
}

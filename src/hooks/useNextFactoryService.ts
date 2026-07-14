import { useMemo } from 'react'
import { useHousehold } from '../contexts/HouseholdContext'
import { computeNextFactoryService } from '../lib/nextFactoryService'
import type { ServiceVisit } from '../types'

/** Prefer standalone vehicle mileage when newer/higher than visit odometers. */
export function useNextFactoryService(vehicleId: string | null, visits: ServiceVisit[]) {
  const { vehicles } = useHousehold()

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  )

  const { currentMiles, currentMilesDate } = useMemo(() => {
    let miles: number | null = null
    let date: string | null = null
    for (const v of visits) {
      if (v.odometer != null && (miles == null || v.odometer > miles)) {
        miles = v.odometer
        date = v.service_date
      }
    }

    if (
      vehicle?.current_odometer != null &&
      (miles == null || vehicle.current_odometer >= miles)
    ) {
      return {
        currentMiles: vehicle.current_odometer,
        currentMilesDate: vehicle.odometer_updated_at?.slice(0, 10) ?? date,
      }
    }

    return { currentMiles: miles, currentMilesDate: date }
  }, [visits, vehicle])

  const recommendation = useMemo(() => {
    if (!vehicle) return null
    return computeNextFactoryService(vehicle, currentMiles)
  }, [vehicle, currentMiles])

  return { recommendation, currentMiles, currentMilesDate, vehicle }
}

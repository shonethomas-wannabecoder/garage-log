import { useCallback, useEffect, useState } from 'react'
import { useDemoData } from '../demo/DemoDataProvider'
import { supabase } from '../lib/supabase'
import type { ServiceVisit } from '../types'

export interface VehicleCostBreakdown {
  sinceLastService: number | null
  thisYear: number
  lastYear: number
  lifetime: number
  visitCount: number
}

function computeCosts(visits: ServiceVisit[]): VehicleCostBreakdown {
  const now = new Date()
  const thisYear = now.getFullYear()
  const lastYear = thisYear - 1

  let lifetime = 0
  let yearCurrent = 0
  let yearPrevious = 0
  let count = 0

  const sorted = [...visits]
    .filter((v) => v.parse_status === 'confirmed' && v.total_cents != null)
    .sort((a, b) => b.service_date.localeCompare(a.service_date))

  for (const v of sorted) {
    const cents = v.total_cents!
    lifetime += cents
    count++

    const visitYear = parseInt(v.service_date.slice(0, 4), 10)
    if (visitYear === thisYear) yearCurrent += cents
    if (visitYear === lastYear) yearPrevious += cents
  }

  return {
    sinceLastService: sorted.length >= 2 ? sorted[0].total_cents : null,
    thisYear: yearCurrent,
    lastYear: yearPrevious,
    lifetime,
    visitCount: count,
  }
}

export function useVehicleCosts(vehicleId: string | null) {
  const demo = useDemoData()
  const [costs, setCosts] = useState<VehicleCostBreakdown | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (demo) {
      const visits = demo.confirmedVisits.filter(
        (v) => !vehicleId || v.vehicle_id === vehicleId,
      )
      setCosts(computeCosts(visits))
      setLoading(false)
      return
    }
    if (!vehicleId) {
      setCosts(null)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('service_visits')
      .select('id, service_date, total_cents, parse_status')
      .eq('vehicle_id', vehicleId)
      .eq('parse_status', 'confirmed')
      .order('service_date', { ascending: false })

    setCosts(computeCosts((data ?? []) as ServiceVisit[]))
    setLoading(false)
  }, [vehicleId, demo])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { costs, loading }
}

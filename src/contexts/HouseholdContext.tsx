import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember, Vehicle } from '../types'
import { useAuth } from './AuthContext'

interface HouseholdContextValue {
  household: Household | null
  members: HouseholdMember[]
  vehicles: Vehicle[]
  selectedVehicleId: string | null
  setSelectedVehicleId: (id: string | null) => void
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateHouseholdName: (name: string) => Promise<{ error: string | null }>
  addVehicle: (input: Omit<Vehicle, 'id' | 'household_id' | 'created_at'>) => Promise<{ error: string | null }>
  deleteVehicle: (id: string) => Promise<{ error: string | null }>
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

const VEHICLE_STORAGE_KEY = 'garage-log-selected-vehicle'

export function HouseholdProvider({
  children,
  demoSnapshot,
}: {
  children: ReactNode
  demoSnapshot?: HouseholdContextValue
}) {
  const { user, configured } = useAuth()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleIdState] = useState<string | null>(() =>
    localStorage.getItem(VEHICLE_STORAGE_KEY),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setSelectedVehicleId = useCallback((id: string | null) => {
    setSelectedVehicleIdState(id)
    if (id) localStorage.setItem(VEHICLE_STORAGE_KEY, id)
    else localStorage.removeItem(VEHICLE_STORAGE_KEY)
  }, [])

  const refresh = useCallback(async () => {
    if (demoSnapshot) return
    if (!user || !configured) {
      setHousehold(null)
      setMembers([])
      setVehicles([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: householdId, error: bootstrapError } = await supabase.rpc('bootstrap_household')
    if (bootstrapError) {
      setError(bootstrapError.message)
      setLoading(false)
      return
    }

    const { data: householdRow, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', householdId)
      .single()

    if (householdError) {
      setError(householdError.message)
      setLoading(false)
      return
    }

    const [{ data: memberRows }, { data: vehicleRows }] = await Promise.all([
      supabase.from('household_members').select('*').eq('household_id', householdId),
      supabase.from('vehicles').select('*').eq('household_id', householdId).order('nickname'),
    ])

    setHousehold(householdRow as Household)
    setMembers((memberRows ?? []) as HouseholdMember[])
    setVehicles((vehicleRows ?? []) as Vehicle[])

    const ids = new Set((vehicleRows ?? []).map((v: Vehicle) => v.id))
    if (selectedVehicleId && ids.has(selectedVehicleId)) {
      // keep selection
    } else if (vehicleRows?.length) {
      setSelectedVehicleId((vehicleRows[0] as Vehicle).id)
    } else {
      setSelectedVehicleId(null)
    }

    setLoading(false)
  }, [user, configured, selectedVehicleId, setSelectedVehicleId, demoSnapshot])

  useEffect(() => {
    if (demoSnapshot) return
    void refresh()
  }, [user?.id, configured]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateHouseholdName = useCallback(
    async (name: string) => {
      if (!household) return { error: 'No household loaded' }
      const { error: updateError } = await supabase
        .from('households')
        .update({ name })
        .eq('id', household.id)
      if (!updateError) await refresh()
      return { error: updateError?.message ?? null }
    },
    [household, refresh],
  )

  const addVehicle = useCallback(
    async (input: Omit<Vehicle, 'id' | 'household_id' | 'created_at'>) => {
      if (!household) return { error: 'No household loaded' }
      const { data, error: insertError } = await supabase
        .from('vehicles')
        .insert({ ...input, household_id: household.id })
        .select()
        .single()
      if (!insertError && data) setSelectedVehicleId(data.id)
      await refresh()
      return { error: insertError?.message ?? null }
    },
    [household, refresh, setSelectedVehicleId],
  )

  const deleteVehicle = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', id)
      await refresh()
      return { error: deleteError?.message ?? null }
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      household,
      members,
      vehicles,
      selectedVehicleId,
      setSelectedVehicleId,
      loading,
      error,
      refresh,
      updateHouseholdName,
      addVehicle,
      deleteVehicle,
    }),
    [
      household,
      members,
      vehicles,
      selectedVehicleId,
      setSelectedVehicleId,
      loading,
      error,
      refresh,
      updateHouseholdName,
      addVehicle,
      deleteVehicle,
    ],
  )

  return (
    <HouseholdContext.Provider value={demoSnapshot ?? value}>{children}</HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider')
  return ctx
}

import { Outlet, useLocation } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { AuthProvider } from '../contexts/AuthContext'
import { HouseholdProvider } from '../contexts/HouseholdContext'
import { DemoDataProvider, type JourneyScreen } from './DemoDataProvider'
import {
  demoHousehold,
  demoMembers,
  demoVehicle,
  demoVehicle2,
  DEMO_USER_ID,
  DEMO_VEHICLE_ID,
} from './fixtures'

const demoUser = { id: DEMO_USER_ID, email: 'demo@garage-log.app' } as User

function journeyScreenFromPath(pathname: string): JourneyScreen {
  if (pathname.includes('/visits/new')) return 'log'
  if (pathname.includes('/review')) return 'review'
  if (pathname.includes('/compare')) return 'compare'
  if (pathname.includes('/vehicles')) return 'vehicles'
  return 'home'
}

export function JourneyDemoLayout() {
  const { pathname } = useLocation()
  const journeyScreen = journeyScreenFromPath(pathname)

  return (
    <AuthProvider demoUser={demoUser}>
      <HouseholdProvider
        demoSnapshot={{
          household: demoHousehold,
          members: demoMembers,
          vehicles: [demoVehicle, demoVehicle2],
          selectedVehicleId: DEMO_VEHICLE_ID,
          setSelectedVehicleId: () => {},
          loading: false,
          error: null,
          refresh: async () => {},
          updateHouseholdName: async () => ({ error: null }),
          addVehicle: async () => ({ error: null }),
          updateVehicle: async () => ({ error: null }),
          updateVehicleMileage: async () => ({ error: null }),
          updateVehicleShopConcerns: async () => ({ error: null }),
          deleteVehicle: async () => ({ error: null }),
        }}
      >
        <DemoDataProvider journeyScreen={journeyScreen}>
          <Outlet />
        </DemoDataProvider>
      </HouseholdProvider>
    </AuthProvider>
  )
}

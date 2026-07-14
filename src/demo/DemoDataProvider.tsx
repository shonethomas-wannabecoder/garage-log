import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { CategoryHistory } from '../hooks/useVisits'
import {
  demoAttachments,
  demoCompareSeed,
  demoConfirmedLineItems,
  demoConfirmedVisit,
  demoLogPageNames,
  demoReviewLineItems,
  demoReviewVisit,
  DEMO_VEHICLE_ID,
  DEMO_VISIT_CONFIRMED_ID,
} from './fixtures'
import type { Attachment, LineItem, ServiceVisit } from '../types'

export type JourneyScreen =
  | 'log'
  | 'review'
  | 'home'
  | 'compare'
  | 'vehicles'
  | 'search'
  | 'household'

export interface DemoDataContextValue {
  confirmedVisits: ServiceVisit[]
  pendingVisits: ServiceVisit[]
  visitById: (id: string | undefined) => ServiceVisit | null
  lineItemsForVisit: (id: string | undefined) => LineItem[]
  attachmentsForVisit: (id: string | undefined) => Attachment[]
  categoryHistory: Record<string, CategoryHistory>
  journeyScreen: JourneyScreen
  logPageNames: string[]
  compareSeed: typeof demoCompareSeed
}

const DemoDataContext = createContext<DemoDataContextValue | null>(null)

const demoCategoryHistory: Record<string, CategoryHistory> = {
  oil_fluid: {
    category: 'oil_fluid',
    visitId: DEMO_VISIT_CONFIRMED_ID,
    serviceDate: '2026-03-20',
    odometer: 91966,
    shopName: 'Onion Creek Volkswagen',
    advisorNotes: 'Recommend cabin filter at next visit.',
    descriptions: ['ENGINE OIL SERVICE', 'Brake fluid flush'],
  },
  filters: {
    category: 'filters',
    visitId: DEMO_VISIT_CONFIRMED_ID,
    serviceDate: '2024-08-10',
    odometer: 72000,
    shopName: 'Onion Creek Volkswagen',
    advisorNotes: null,
    descriptions: ['Cabin filter'],
  },
}

export function DemoDataProvider({
  journeyScreen,
  children,
}: {
  journeyScreen: JourneyScreen
  children: ReactNode
}) {
  const value = useMemo<DemoDataContextValue>(
    () => ({
      confirmedVisits: [demoConfirmedVisit],
      pendingVisits: [],
      visitById: (id) => {
        if (id === demoReviewVisit.id) return demoReviewVisit
        if (id === demoConfirmedVisit.id) return demoConfirmedVisit
        return null
      },
      lineItemsForVisit: (id) => {
        if (id === demoReviewVisit.id) return demoReviewLineItems
        if (id === demoConfirmedVisit.id) return demoConfirmedLineItems
        return []
      },
      attachmentsForVisit: () => demoAttachments,
      categoryHistory: demoCategoryHistory,
      journeyScreen,
      logPageNames: demoLogPageNames,
      compareSeed: demoCompareSeed,
    }),
    [journeyScreen],
  )

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>
}

export function useDemoData() {
  return useContext(DemoDataContext)
}

export function isDemoVehicle(vehicleId: string | null) {
  return vehicleId === DEMO_VEHICLE_ID
}

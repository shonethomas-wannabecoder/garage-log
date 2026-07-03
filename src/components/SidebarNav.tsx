import { NavLink, useLocation } from 'react-router-dom'
import { Car as CarIcon, Camera, Home, Search, Users, type LucideIcon } from 'lucide-react'
import { VehicleSelect } from './VehicleSelect'
import { useHousehold } from '../contexts/HouseholdContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function SidebarNav() {
  const { pathname } = useLocation()
  const { household } = useHousehold()
  const base = pathname.startsWith('/__journey__') ? '/__journey__' : ''

  const links: NavItem[] = [
    { to: `${base}/`, label: 'Home', icon: Home, end: true },
    { to: `${base}/visits/new`, label: 'Log', icon: Camera },
    { to: `${base}/search`, label: 'Search', icon: Search },
    { to: `${base}/vehicles`, label: 'Cars', icon: CarIcon },
    { to: `${base}/household`, label: 'Family', icon: Users },
  ]

  return (
    <aside className="sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[260px] lg:flex-col">
      {/* Logo + household */}
      <div className="px-5 pt-6 pb-2">
        <NavLink to={`${base}/`} className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: 'var(--grad)' }}
            aria-hidden
          >
            <CarIcon size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-content">Garage Log</span>
        </NavLink>
        {household?.name && (
          <p className="mt-1.5 pl-[46px] text-xs text-faint">{household.name}</p>
        )}
      </div>

      {/* Vehicle selector */}
      <div className="px-4 py-3">
        <VehicleSelect label={false} />
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-muted hover:bg-surface-2 hover:text-content'
              }`
            }
          >
            <Icon size={19} strokeWidth={2} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom spacer */}
      <div className="px-5 pb-5 pt-4">
        <p className="text-[11px] text-faint">Garage Log</p>
      </div>
    </aside>
  )
}

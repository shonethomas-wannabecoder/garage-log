import { NavLink, Outlet } from 'react-router-dom'
import { Home, Camera, Search, Car, Users, type LucideIcon } from 'lucide-react'

const tabs: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/visits/new', label: 'Log', icon: Camera },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/vehicles', label: 'Cars', icon: Car },
  { to: '/household', label: 'Family', icon: Users },
]

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-5">
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--bg) 72%, transparent)' }}
      >
        <div
          className="mx-auto flex max-w-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-faint'
                }`
              }
            >
              <Icon size={22} strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

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
      <main id="app-main" className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-5">
        <Outlet />
      </main>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="card pointer-events-auto mx-auto flex max-w-md items-center justify-around gap-1 px-2 py-2"
          style={{
            borderRadius: '999px',
            background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
          }}
        >
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-faint'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                    style={isActive ? { background: 'var(--brand-soft)' } : undefined}
                  >
                    <Icon size={21} strokeWidth={2} aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

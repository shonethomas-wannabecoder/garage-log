import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, Camera, Search, Car, Users, type LucideIcon } from 'lucide-react'
import { SidebarNav } from './SidebarNav'

export function AppShell() {
  const { pathname } = useLocation()
  const base = pathname.startsWith('/__journey__') ? '/__journey__' : ''

  const tabs: { to: string; label: string; icon: LucideIcon; end?: boolean; primary?: boolean }[] = [
    { to: `${base}/`, label: 'Home', icon: Home, end: true },
    { to: `${base}/search`, label: 'Search', icon: Search },
    { to: `${base}/visits/new`, label: 'Log', icon: Camera, primary: true },
    { to: `${base}/vehicles`, label: 'Cars', icon: Car },
    { to: `${base}/household`, label: 'Family', icon: Users },
  ]

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Desktop sidebar — hidden below lg */}
      <SidebarNav />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 lg:pl-[260px]">
        <main
          id="app-main"
          className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 lg:max-w-3xl lg:py-8"
          style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs — hidden at lg and above */}
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 lg:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div
          className="card pointer-events-auto mx-auto flex max-w-md items-center justify-around gap-1 px-2 py-2"
          style={{
            borderRadius: '999px',
            background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
          }}
        >
          {tabs.map(({ to, label, icon: Icon, end, primary }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-faint'
                }`
              }
            >
              {({ isActive }) =>
                primary ? (
                  <>
                    <span
                      className="-mt-7 flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform active:scale-95"
                      style={{
                        background: 'var(--grad)',
                        boxShadow: '0 8px 22px var(--brand-glow)',
                        border: '3px solid var(--bg)',
                      }}
                    >
                      <Icon size={22} strokeWidth={2.25} aria-hidden />
                    </span>
                    {label}
                  </>
                ) : (
                  <>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                      style={isActive ? { background: 'var(--brand-soft)' } : undefined}
                    >
                      <Icon size={21} strokeWidth={2} aria-hidden />
                    </span>
                    {label}
                  </>
                )
              }
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

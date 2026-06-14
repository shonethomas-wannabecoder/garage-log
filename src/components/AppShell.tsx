import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
    isActive ? 'text-sky-400' : 'text-slate-400'
  }`

export function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          <NavLink to="/" end className={linkClass}>
            <span aria-hidden>🏠</span>
            Home
          </NavLink>
          <NavLink to="/visits/new" className={linkClass}>
            <span aria-hidden>➕</span>
            Log
          </NavLink>
          <NavLink to="/search" className={linkClass}>
            <span aria-hidden>🔍</span>
            Search
          </NavLink>
          <NavLink to="/vehicles" className={linkClass}>
            <span aria-hidden>🚗</span>
            Cars
          </NavLink>
          <NavLink to="/household" className={linkClass}>
            <span aria-hidden>👥</span>
            Household
          </NavLink>
        </div>
      </nav>
    </div>
  )
}

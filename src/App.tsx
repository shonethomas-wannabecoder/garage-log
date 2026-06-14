import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HouseholdProvider } from './contexts/HouseholdContext'
import { HomePage } from './pages/HomePage'
import { HouseholdPage } from './pages/HouseholdPage'
import { LoginPage } from './pages/LoginPage'
import { NewVisitPage } from './pages/NewVisitPage'
import { SearchPage } from './pages/SearchPage'
import { SetupPage } from './pages/SetupPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { VisitPage } from './pages/VisitPage'

function ProtectedRoutes() {
  const { user, loading, configured } = useAuth()

  if (!configured) return <Navigate to="/setup" replace />
  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-slate-400">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  return (
    <HouseholdProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="visits/new" element={<NewVisitPage />} />
          <Route path="visits/:visitId" element={<VisitPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="household" element={<HouseholdPage />} />
        </Route>
      </Routes>
    </HouseholdProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

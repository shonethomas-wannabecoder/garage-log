import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HouseholdProvider } from './contexts/HouseholdContext'
import { ComparePage } from './pages/ComparePage'
import { HomePage } from './pages/HomePage'
import { HouseholdPage } from './pages/HouseholdPage'
import { NewVisitPage } from './pages/NewVisitPage'
import { SearchPage } from './pages/SearchPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { VisitPage } from './pages/VisitPage'
import { ReviewVisitPage } from './pages/ReviewVisitPage'

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const SetupPage = lazy(() =>
  import('./pages/SetupPage').then((m) => ({ default: m.SetupPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const WaitlistAdminPage = lazy(() =>
  import('./pages/WaitlistAdminPage').then((m) => ({ default: m.WaitlistAdminPage })),
)
const JourneyDemoLayout = lazy(() =>
  import('./demo/JourneyDemoLayout').then((m) => ({ default: m.JourneyDemoLayout })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-full items-center justify-center text-muted">
      Loading…
    </div>
  )
}

function ProtectedRoutes() {
  const { user, loading, configured } = useAuth()

  if (!configured) return <Navigate to="/setup" replace />
  if (loading) return <RouteFallback />
  if (!user) return <Navigate to="/login" replace />

  return (
    <HouseholdProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="visits/new" element={<NewVisitPage />} />
          <Route path="visits/:visitId/review" element={<ReviewVisitPage />} />
          <Route path="visits/:visitId" element={<VisitPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="household" element={<HouseholdPage />} />
          <Route path="admin/waitlist" element={<WaitlistAdminPage />} />
        </Route>
      </Routes>
    </HouseholdProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/__journey__" element={<JourneyDemoLayout />}>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="compare" element={<ComparePage />} />
                <Route path="visits/new" element={<NewVisitPage />} />
                <Route path="visits/:visitId/review" element={<ReviewVisitPage />} />
                <Route path="vehicles" element={<VehiclesPage />} />
              </Route>
            </Route>
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, CONSOLE_ROLES } from './context/AuthContext'
import { StoreProvider } from './lib/store.jsx'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Dispatch from './pages/Dispatch.jsx'
import Vehicles from './pages/Vehicles.jsx'
import Fuel from './pages/Fuel.jsx'
import Compliance from './pages/Compliance.jsx'
import Drivers from './pages/Drivers.jsx'
import Reports from './pages/Reports.jsx'
import Faults from './pages/Faults.jsx'
import Expenses from './pages/Expenses.jsx'
import Analytics from './pages/Analytics.jsx'
import Billing from './pages/Billing.jsx'
import Payroll from './pages/Payroll.jsx'
import Settings from './pages/Settings.jsx'
import Staff from './pages/Staff.jsx'
import ClientTrack from './pages/ClientTrack.jsx'
import DriverPortal from './pages/DriverPortal.jsx'
import InstallGate from './components/InstallGate.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'

// Gate a route to a set of roles; bounce drivers to their portal and vice-versa.
function Require({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/app'} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/track/:ref" element={<ClientTrack />} />

      {/* Driver portal */}
      <Route path="/driver" element={<InstallGate><Require roles={['driver']}><DriverPortal /></Require></InstallGate>} />

      {/* Operations console */}
      <Route path="/app" element={<Require roles={CONSOLE_ROLES}><Layout /></Require>}>
        <Route index element={<Dashboard />} />
        <Route path="dispatch" element={<Dispatch />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="fuel" element={<Fuel />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="faults" element={<Faults />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="billing" element={<Require roles={['admin', 'operator']}><Billing /></Require>} />
        <Route path="payroll" element={<Require roles={['admin']}><Payroll /></Require>} />
        <Route path="settings" element={<Require roles={['admin']}><Settings /></Require>} />
        <Route path="staff" element={<Require roles={['admin']}><Staff /></Require>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AuthProvider>
          <AppRoutes />
          <OfflineBanner />
        </AuthProvider>
      </StoreProvider>
    </ErrorBoundary>
  )
}

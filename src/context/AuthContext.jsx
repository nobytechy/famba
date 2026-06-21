import { createContext, useContext, useState } from 'react'
import { useStore } from '../lib/store.jsx'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// Console roles (sidebar app) vs the driver portal.
export const CONSOLE_ROLES = ['admin', 'operator', 'staff']

export function AuthProvider({ children }) {
  const { staff } = useStore()
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('famba_user') || 'null') } catch { return null }
  })

  // Authenticate a PIN against the staff list. Returns the user or null.
  const login = (pin) => {
    const m = (staff || []).find((s) => s.pin === pin && s.active !== false)
    if (!m) return null
    const u = { id: m.id, name: m.name, role: m.role, driver_id: m.driver_id || null }
    sessionStorage.setItem('famba_user', JSON.stringify(u))
    setUser(u)
    return u
  }
  const logout = () => { sessionStorage.removeItem('famba_user'); setUser(null) }

  const hasRole = (...roles) => user && roles.includes(user.role)

  return <AuthCtx.Provider value={{ user, login, logout, hasRole }}>{children}</AuthCtx.Provider>
}

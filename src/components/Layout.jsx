import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Container, Send, Fuel, ShieldCheck, Users, BarChart3,
  Wrench, UserCog, Wallet, LineChart, FileText, Banknote, Settings as SettingsIcon, LogOut, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo.jsx'
import AlertCenter from './AlertCenter.jsx'
import AlertsBell from './AlertsBell.jsx'
import { useAuth } from '../context/AuthContext'
import { useStore, complianceAlerts } from '../lib/store.jsx'
import { ROLE_LABEL } from '../lib/seed'
import { thanosSnap, thanosRestore } from '../lib/thanos'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/dispatch', label: 'Dispatch', icon: Send, roles: ['admin', 'operator'] },
  { to: '/app/vehicles', label: 'Vehicles', icon: Truck, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/skips', label: 'Skips', icon: Container, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/fuel', label: 'Fuel', icon: Fuel, roles: ['admin', 'operator'] },
  { to: '/app/compliance', label: 'Compliance', icon: ShieldCheck, roles: ['admin', 'operator'] },
  { to: '/app/faults', label: 'Faults', icon: Wrench, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/expenses', label: 'Expenses', icon: Wallet, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/drivers', label: 'Drivers', icon: Users, roles: ['admin', 'operator'] },
  { to: '/app/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/analytics', label: 'Analytics', icon: LineChart, roles: ['admin', 'operator', 'staff'] },
  { to: '/app/billing', label: 'Billing', icon: FileText, roles: ['admin', 'operator'] },
  { to: '/app/payroll', label: 'Payroll', icon: Banknote, roles: ['admin'] },
  { to: '/app/staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
]

export default function Layout() {
  const { logout, user } = useAuth()
  const { compliance, fault_reports, source } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const alerts = complianceAlerts(compliance).filter((a) => a.level === 'expired' || a.level === 'critical').length
  const openFaults = (fault_reports || []).filter((f) => f.status === 'Open').length
  const items = NAV.filter((n) => n.roles.includes(user?.role))

  return (
    <div className="min-h-screen flex">
      <AlertCenter />
      <aside className={`fixed lg:static z-30 inset-y-0 left-0 w-64 bg-slate-900 text-slate-200 flex-col
        ${open ? 'flex' : 'hidden'} lg:flex`}>
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <Logo light />
          <button className="lg:hidden text-slate-400" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Icon size={18} />
              <span>{label}</span>
              {to === '/app/compliance' && alerts > 0 && (
                <span className="ml-auto text-[11px] bg-rose-500 text-white rounded-full px-2 py-0.5">{alerts}</span>
              )}
              {to === '/app/faults' && openFaults > 0 && (
                <span className="ml-auto text-[11px] bg-amber-500 text-white rounded-full px-2 py-0.5">{openFaults}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-800">
          <button onClick={() => thanosSnap(() => { logout(); nav('/'); thanosRestore() })}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
            <LogOut size={18} /> Sign out
          </button>
          <a href="https://nobie.netlify.app" target="_blank" rel="noreferrer"
            className="block mt-2 px-3 text-[11px] text-slate-500 hover:text-slate-300">
            Powered by Noby · nobie.netlify.app
          </a>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-20">
          <button className="lg:hidden text-slate-600" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${source === 'supabase' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
              <span className={`w-2 h-2 rounded-full live-dot ${source === 'supabase' ? 'bg-teal-500' : 'bg-amber-500'}`} />
              {source === 'supabase' ? 'Live data' : 'Demo data'}
            </span>
            <AlertsBell />
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-700 leading-none">{user?.name}</div>
              <div className="text-[11px] text-slate-400">{ROLE_LABEL[user?.role]}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white grid place-items-center font-semibold">
              {user?.name?.split(' ').map((x) => x[0]).join('').slice(0, 2)}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

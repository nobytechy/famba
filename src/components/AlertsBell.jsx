import { useState } from 'react'
import { Bell, Siren, PhoneOff, AlertTriangle, Wrench, X } from 'lucide-react'
import { useStore } from '../lib/store.jsx'

const iconFor = (k) => (k || '').startsWith('sos') ? Siren : k === 'driver_closed' ? PhoneOff
  : k === 'fault_escalation' ? AlertTriangle : k === 'driver_background' ? Wrench : Bell
const toneFor = (a) => (a.kind || '').startsWith('sos') || a.severity === 'high' ? 'text-rose-600 bg-rose-50'
  : a.severity === 'warning' ? 'text-amber-600 bg-amber-50' : 'text-teal-600 bg-teal-50'
const ago = (ts) => {
  if (!ts) return ''
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  return `${Math.round(s / 3600)}h ago`
}

export default function AlertsBell() {
  const { alerts, dismissAlert, markAlertsRead } = useStore()
  const [open, setOpen] = useState(false)
  const unread = alerts.filter((a) => !a.read).length

  const toggle = () => { setOpen((o) => !o); if (!open) markAlertsRead() }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-600 btn-press">
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center live-dot">{unread}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[min(92vw,360px)] bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Alerts</span>
              <span className="text-xs text-slate-400">{alerts.length} total</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
              {alerts.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">No alerts yet.</div>}
              {alerts.map((a) => {
                const I = iconFor(a.kind)
                return (
                  <div key={a._key} className="px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50">
                    <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${toneFor(a)}`}><I size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-700">{a.message}</div>
                      <div className="text-[11px] text-slate-400">{ago(a.ts)}</div>
                    </div>
                    <button onClick={() => dismissAlert(a._key)} className="text-slate-300 hover:text-slate-500"><X size={15} /></button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { AlertTriangle, BellRing, X, PhoneOff, Siren } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { beep, alarm, notify, ensureNotifyPermission } from '../lib/sound'

// How long a High fault may stay unresolved before it auto-escalates (demo: 30s).
const ESCALATE_AFTER_MS = 30_000

export default function AlertCenter() {
  const { fault_reports, alerts, addAlert, dismissAlert } = useStore()
  const seen = useRef(new Set())        // alert keys we've already sounded
  const faultSeen = useRef(new Map())   // fault id -> first seen open time
  const escalated = useRef(new Set())

  useEffect(() => { ensureNotifyPermission() }, [])

  // Sound + browser notification whenever a new alert appears in the feed.
  useEffect(() => {
    alerts.forEach((a) => {
      if (seen.current.has(a._key)) return
      seen.current.add(a._key)
      const isSos = (a.kind || '').startsWith('sos')
      if (isSos) { alarm(); setTimeout(alarm, 900) }
      else if (a.severity === 'high') alarm()
      else beep()
      notify(isSos ? '🆘 SOS — driver emergency' : 'Famba Fleet alert', a.message)
    })
  }, [alerts])

  // Auto-escalate unresolved High faults into the alert feed.
  useEffect(() => {
    const run = () => {
      const now = Date.now()
      ;(fault_reports || []).forEach((f) => {
        if (f.severity !== 'High' || f.status === 'Resolved') { faultSeen.current.delete(f.id); escalated.current.delete(f.id); return }
        if (!faultSeen.current.has(f.id)) faultSeen.current.set(f.id, now)
        if (now - faultSeen.current.get(f.id) >= ESCALATE_AFTER_MS && !escalated.current.has(f.id)) {
          escalated.current.add(f.id)
          addAlert({ id: `esc-${f.id}`, ts: now, severity: 'high', kind: 'fault_escalation',
            message: `Unresolved HIGH fault on ${f.vehicle_reg}: ${f.category}. ${f.note}` })
        }
      })
    }
    run()
    const iv = setInterval(run, 10_000)
    return () => clearInterval(iv)
  }, [fault_reports, addAlert])

  const visible = alerts.filter((a) => !a.read).slice(0, 5)
  if (!visible.length) return null

  const tone = { high: 'bg-rose-600 border-rose-700', warning: 'bg-amber-500 border-amber-600', info: 'bg-teal-600 border-teal-700' }
  const Icon = (k) => (k || '').startsWith('sos') ? Siren : k === 'driver_closed' ? PhoneOff : k === 'fault_escalation' ? AlertTriangle : BellRing
  const title = (a) => (a.kind || '').startsWith('sos') ? '🆘 DRIVER SOS'
    : a.kind === 'fault_escalation' ? 'HIGH ALERT — unresolved fault'
    : a.kind === 'driver_closed' ? 'Driver closed app mid-trip'
    : a.kind === 'driver_background' ? 'Driver minimised app'
    : a.severity === 'high' ? 'HIGH ALERT' : 'Alert'

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,440px)] space-y-2">
      {visible.map((a) => {
        const I = Icon(a.kind)
        return (
          <div key={a._key}
            className={`${tone[a.severity] || tone.info} text-white rounded-xl shadow-lg border p-3 flex items-start gap-3 ${a.severity === 'high' ? 'animate-pulse' : ''}`}>
            <I size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <div className="font-semibold">{title(a)}</div>
              <div className="opacity-95">{a.message}</div>
            </div>
            <button onClick={() => dismissAlert(a._key)} className="opacity-80 hover:opacity-100"><X size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}

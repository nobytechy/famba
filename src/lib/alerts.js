// Alert bus: carries driver/fault alerts from the source to the admin console.
//  • Same browser (demo, two tabs): BroadcastChannel + localStorage fallback.
//  • Cross-device (live): Supabase realtime on the famba_alerts table.
//  • Optional: POST to the FastAPI backend so it has a record too.
import { supabase, SUPABASE_READY, API_BASE } from './supabase'

const CHANNEL = 'famba-alerts'
const LS_KEY = 'famba_alert_last'
let bc
try { bc = new BroadcastChannel(CHANNEL) } catch { bc = null }

export function publishAlert(alert) {
  const payload = { id: `al-${Date.now()}-${Math.round(Math.random() * 1e4)}`, ts: Date.now(), ...alert }

  // 1a) same tab (driver → console navigation in one tab)
  try { window.dispatchEvent(new CustomEvent('famba-local-alert', { detail: payload })) } catch { /* noop */ }
  // 1b) other tabs in the same browser
  try { bc?.postMessage(payload) } catch { /* noop */ }
  try { localStorage.setItem(LS_KEY, JSON.stringify(payload)) } catch { /* noop */ }

  // 2) cross-device via Supabase
  if (SUPABASE_READY) {
    supabase.from('famba_alerts').insert({
      kind: payload.kind, driver_id: payload.driver_id || null, driver_name: payload.driver_name || null,
      vehicle_id: payload.vehicle_id || null, vehicle_reg: payload.vehicle_reg || null,
      severity: payload.severity || 'info', message: payload.message || '',
    }).then(() => {}, () => {})
  }

  // 3) best-effort beacon to the backend (survives a page being closed)
  if (API_BASE) {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
      if (navigator.sendBeacon) navigator.sendBeacon(`${API_BASE}/api/trip-event`, blob)
      else fetch(`${API_BASE}/api/trip-event`, { method: 'POST', body: blob, keepalive: true }).catch(() => {})
    } catch { /* noop */ }
  }
  return payload
}

// Subscribe to alerts. Returns an unsubscribe function.
export function subscribeAlerts(cb) {
  const onBc = (e) => cb(e.data)
  const onLocal = (e) => cb(e.detail)
  const onStorage = (e) => { if (e.key === LS_KEY && e.newValue) try { cb(JSON.parse(e.newValue)) } catch { /* noop */ } }
  bc?.addEventListener('message', onBc)
  window.addEventListener('famba-local-alert', onLocal)
  window.addEventListener('storage', onStorage)

  let sub
  if (SUPABASE_READY) {
    sub = supabase
      .channel('famba_alerts_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'famba_alerts' },
        (p) => cb({ id: p.new.id, ts: Date.now(), kind: p.new.kind, driver_name: p.new.driver_name, vehicle_reg: p.new.vehicle_reg, severity: p.new.severity, message: p.new.message }))
      .subscribe()
  }

  return () => {
    bc?.removeEventListener('message', onBc)
    window.removeEventListener('famba-local-alert', onLocal)
    window.removeEventListener('storage', onStorage)
    if (sub) supabase.removeChannel(sub)
  }
}

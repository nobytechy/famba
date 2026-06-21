// Central data + live-simulation store. Works against Supabase when configured,
// otherwise against the bundled synthetic seed. The vehicle live-positions are
// always animated client-side (the "phone-as-tracker" stream is simulated for
// the demo; the Driver page can post a real GPS ping to override a vehicle).

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { buildSeed, ROUTES } from './seed'
import { supabase, SUPABASE_READY } from './supabase'
import { subscribeAlerts } from './alerts'
import { OPERATING_ZONE } from './config'

const kmBetween = (a, b) => {
  const R = 6371, toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const StoreCtx = createContext(null)
export const useStore = () => useContext(StoreCtx)

const lerp = (a, b, t) => a + (b - a) * t
function bearing([la1, lo1], [la2, lo2]) {
  const y = Math.sin((lo2 - lo1)) * Math.cos(la2)
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(lo2 - lo1)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// Advance one vehicle one tick along its route (ping-pong at the ends).
function step(v) {
  if (v._pinned) return v // real GPS ping has control
  const r = ROUTES[v.route]
  if (!r) return v
  const dir = v._dir ?? 1
  let leg = v._leg, t = v._t + 0.07 + Math.random() * 0.03
  let nd = dir
  if (t >= 1) {
    t = 0; leg += dir
    if (leg >= r.pts.length - 1) { leg = r.pts.length - 1; nd = -1 }
    if (leg <= 0) { leg = 0; nd = 1 }
  }
  const a = r.pts[leg], b = r.pts[Math.min(Math.max(leg + nd, 0), r.pts.length - 1)]
  const lat = lerp(a[0], b[0], t), lng = lerp(a[1], b[1], t)
  const speed = 28 + Math.round(Math.random() * 34)
  const fuel = Math.max(6, v.fuel_pct - 0.06)
  return { ...v, lat, lng, _leg: leg, _t: t, _dir: nd, speed_kmh: speed, fuel_pct: fuel, odo_km: v.odo_km + 0.3, status: 'Moving', heading: bearing(a, b) }
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => buildSeed())
  const [loading, setLoading] = useState(SUPABASE_READY)
  const [source, setSource] = useState(SUPABASE_READY ? 'supabase' : 'demo')
  const [alerts, setAlerts] = useState([])   // live SOS / driver / escalation feed
  const tick = useRef(null)

  const addAlert = useCallback((a) => {
    setAlerts((list) => {
      if (a.id && list.some((x) => x.id === a.id)) return list
      return [{ _key: a.id || `al-${list.length}-${a.ts || ''}`, read: false, ...a }, ...list].slice(0, 40)
    })
  }, [])
  const dismissAlert = useCallback((key) => setAlerts((l) => l.filter((x) => x._key !== key)), [])
  const markAlertsRead = useCallback(() => setAlerts((l) => l.map((x) => ({ ...x, read: true }))), [])

  // Subscribe to the alert bus once, at the top of the app, so alerts persist
  // no matter which page the operator is on.
  useEffect(() => subscribeAlerts((a) => addAlert(a)), [addAlert])

  // Load persistent records from Supabase when configured; keep sim fields local.
  useEffect(() => {
    if (!SUPABASE_READY) return
    let alive = true
    ;(async () => {
      try {
        const tbl = (n) => supabase.from(`famba_${n}`).select('*')
        const [veh, drv, job, fuel, comp, mnt, stf, trp, flt, exp, inv] = await Promise.all([
          tbl('vehicles'), tbl('drivers'), tbl('jobs'), tbl('fuel_logs'), tbl('compliance'), tbl('maintenance'),
          tbl('staff'), tbl('trips'), tbl('fault_reports'), tbl('expenses'), tbl('invoices'),
        ])
        if (!alive) return
        if (veh.error || !veh.data?.length) { setSource('demo'); setLoading(false); return }
        const seed = buildSeed()
        setData({
          drivers: drv.data || seed.drivers,
          vehicles: (veh.data || []).map((v) => ({
            ...v,
            lat: ROUTES[v.route]?.pts[0][0] ?? -17.8252,
            lng: ROUTES[v.route]?.pts[0][1] ?? 31.0335,
            _leg: 0, _t: Math.random(), _dir: 1, status: 'Moving',
          })),
          jobs: job.data || seed.jobs,
          fuel_logs: fuel.data || seed.fuel_logs,
          compliance: comp.data || seed.compliance,
          maintenance: mnt.data || seed.maintenance,
          clients: seed.clients,
          staff: stf.data?.length ? stf.data : seed.staff,
          trips: trp.data || seed.trips,
          fault_reports: flt.data || seed.fault_reports,
          expenses: exp.data || seed.expenses,
          invoices: inv.data || seed.invoices,
        })
        setSource('supabase')
      } catch {
        setSource('demo')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // Live simulation loop.
  useEffect(() => {
    tick.current = setInterval(() => {
      setData((d) => ({ ...d, vehicles: d.vehicles.map(step) }))
    }, 1600)
    return () => clearInterval(tick.current)
  }, [])

  // Geofence / route-deviation watcher: alert when a vehicle leaves the zone.
  const geoOut = useRef(new Set())
  const vehRef = useRef([])
  useEffect(() => { vehRef.current = data.vehicles }, [data.vehicles])
  useEffect(() => {
    const iv = setInterval(() => {
      vehRef.current.forEach((v) => {
        if (v.lat == null) return
        const out = kmBetween([v.lat, v.lng], OPERATING_ZONE.center) > OPERATING_ZONE.radiusKm
        if (out && !geoOut.current.has(v.id)) {
          geoOut.current.add(v.id)
          addAlert({ id: `geo-${v.id}-${Date.now()}`, ts: Date.now(), severity: 'warning', kind: 'geofence',
            message: `${v.name || v.reg} has left the operating area (route deviation).` })
        } else if (!out) geoOut.current.delete(v.id)
      })
    }, 8000)
    return () => clearInterval(iv)
  }, [])

  // ---- actions -------------------------------------------------------------
  const persist = useCallback(async (table, row) => {
    if (SUPABASE_READY && source === 'supabase') {
      try { await supabase.from(`famba_${table}`).upsert(row) } catch { /* keep local */ }
    }
  }, [source])

  const assignJob = useCallback((jobId, vehicleId) => {
    setData((d) => {
      const veh = d.vehicles.find((v) => v.id === vehicleId)
      const jobs = d.jobs.map((j) => j.id === jobId
        ? { ...j, vehicle_id: vehicleId, driver_id: veh?.driver_id ?? null, status: 'Assigned' } : j)
      const row = jobs.find((j) => j.id === jobId)
      persist('jobs', { id: row.id, ref: row.ref, client: row.client, pickup: row.pickup, dropoff: row.dropoff, cargo: row.cargo, vehicle_id: row.vehicle_id, driver_id: row.driver_id, status: row.status })
      return { ...d, jobs }
    })
  }, [persist])

  const setJobStatus = useCallback((jobId, status) => {
    setData((d) => {
      const jobs = d.jobs.map((j) => j.id === jobId ? { ...j, status } : j)
      const row = jobs.find((j) => j.id === jobId)
      persist('jobs', { id: row.id, status })
      return { ...d, jobs }
    })
  }, [persist])

  // Proof of delivery: photo + signature captured when a job is delivered.
  const savePOD = useCallback((jobId, pod) => {
    setData((d) => {
      const jobs = d.jobs.map((j) => j.id === jobId
        ? { ...j, status: 'Delivered', pod_photo: pod.photo, pod_signature: pod.signature, pod_to: pod.to, pod_time: new Date().toISOString() } : j)
      const row = jobs.find((j) => j.id === jobId)
      persist('jobs', { id: row.id, status: 'Delivered', pod_to: row.pod_to, pod_time: row.pod_time })
      return { ...d, jobs }
    })
  }, [persist])

  const addInvoice = useCallback((inv) => {
    setData((d) => {
      const total = (inv.items || []).reduce((a, b) => a + (+b.qty || 0) * (+b.price || 0), 0)
      const seqRef = `${inv.type === 'Quote' ? 'QTE' : 'INV'}-${1000 + d.invoices.length + 1}`
      const row = { id: `inv-${Date.now()}`, ref: seqRef, created_at: new Date().toISOString(), status: 'Draft', total, ...inv, total }
      persist('invoices', { id: row.id, ref: row.ref, type: row.type, client: row.client, items: row.items, total: row.total, status: row.status, created_at: row.created_at })
      return { ...d, invoices: [row, ...d.invoices] }
    })
  }, [persist])

  const setInvoiceStatus = useCallback((id, status) => {
    setData((d) => {
      const invoices = d.invoices.map((x) => x.id === id ? { ...x, status } : x)
      persist('invoices', { id, status })
      return { ...d, invoices }
    })
  }, [persist])

  const addFuelLog = useCallback((log) => {
    setData((d) => {
      const veh = d.vehicles.find((v) => v.id === log.vehicle_id)
      const prev = d.fuel_logs.filter((f) => f.vehicle_id === log.vehicle_id).sort((a, b) => b.odo_km - a.odo_km)[0]
      const dist = prev ? Math.max(1, log.odo_km - prev.odo_km) : 400
      const kmpl = Math.round((dist / log.litres) * 100) / 100
      const row = { id: `fuel-${Date.now()}`, ...log, kmpl, cost_usd: Math.round(log.litres * 1.58 * 100) / 100 }
      persist('fuel_logs', { id: row.id, vehicle_id: row.vehicle_id, date: row.date, litres: row.litres, odo_km: row.odo_km, cost_usd: row.cost_usd, kmpl: row.kmpl })
      return { ...d, fuel_logs: [row, ...d.fuel_logs] }
    })
  }, [persist])

  const addCompliance = useCallback((doc) => {
    setData((d) => {
      const veh = d.vehicles.find((v) => v.id === doc.vehicle_id)
      const row = { id: `doc-${Date.now()}`, vehicle_reg: veh?.reg, ...doc }
      persist('compliance', { id: row.id, vehicle_id: row.vehicle_id, vehicle_reg: row.vehicle_reg, type: row.type, ref: row.ref, expiry: row.expiry })
      return { ...d, compliance: [...d.compliance, row] }
    })
  }, [persist])

  // ---- staff / users -------------------------------------------------------
  const saveStaff = useCallback((member) => {
    setData((d) => {
      const exists = d.staff.find((s) => s.id === member.id)
      const row = exists ? { ...exists, ...member } : { id: `usr-${Date.now()}`, active: true, ...member }
      persist('staff', { id: row.id, name: row.name, role: row.role, pin: row.pin, phone: row.phone, driver_id: row.driver_id, active: row.active })
      return { ...d, staff: exists ? d.staff.map((s) => s.id === row.id ? row : s) : [...d.staff, row] }
    })
  }, [persist])

  const toggleStaff = useCallback((id) => {
    setData((d) => {
      const staff = d.staff.map((s) => s.id === id ? { ...s, active: !s.active } : s)
      const row = staff.find((s) => s.id === id)
      persist('staff', { id, active: row.active })
      return { ...d, staff }
    })
  }, [persist])

  const updateDriver = useCallback((driverId, patch) => {
    setData((d) => {
      const drivers = d.drivers.map((x) => x.id === driverId ? { ...x, ...patch } : x)
      const row = drivers.find((x) => x.id === driverId)
      // Only persist lightweight profile fields (not large data URLs) by default.
      persist('drivers', { id: driverId, nok_name: row.nok_name, nok_phone: row.nok_phone })
      return { ...d, drivers }
    })
  }, [persist])

  // ---- trips ---------------------------------------------------------------
  const startTrip = useCallback((driverId, vehicleId) => {
    const id = `trip-${Date.now()}`
    setData((d) => {
      const drv = d.drivers.find((x) => x.id === driverId)
      const veh = d.vehicles.find((x) => x.id === vehicleId)
      const row = {
        id, driver_id: driverId, driver_name: drv?.name, vehicle_id: vehicleId, vehicle_reg: veh?.reg,
        route: 'Live trip', date: new Date().toISOString().slice(0, 10), distance_km: 0, duration_min: 0,
        status: 'In Progress', note: '', started_at: Date.now(),
      }
      persist('trips', { id: row.id, driver_id: driverId, vehicle_id: vehicleId, vehicle_reg: row.vehicle_reg, driver_name: row.driver_name, date: row.date, status: row.status })
      return { ...d, trips: [row, ...d.trips] }
    })
    return id
  }, [persist])

  const endTrip = useCallback((tripId, { distance_km = 0, note = '', faults = [] } = {}) => {
    setData((d) => {
      const trips = d.trips.map((t) => {
        if (t.id !== tripId) return t
        const mins = t.started_at ? Math.max(1, Math.round((Date.now() - t.started_at) / 60000)) : t.duration_min
        return { ...t, status: 'Completed', distance_km: Math.round(distance_km) || t.distance_km, duration_min: mins, note }
      })
      const trip = trips.find((t) => t.id === tripId)
      persist('trips', { id: tripId, status: 'Completed', distance_km: trip.distance_km, duration_min: trip.duration_min, note })
      const valid = (faults || []).filter((f) => f && f.note?.trim())
      const stamp = new Date().toISOString().slice(0, 10)
      const newFaults = valid.map((f, i) => ({
        id: `flt-${Date.now()}-${i}`, vehicle_id: trip.vehicle_id, vehicle_reg: trip.vehicle_reg,
        driver_id: trip.driver_id, driver_name: trip.driver_name, category: f.category, severity: f.severity,
        note: f.note.trim(), status: 'Open', created_at: stamp,
      }))
      newFaults.forEach((fr) => persist('fault_reports', fr))
      return { ...d, trips, fault_reports: [...newFaults, ...d.fault_reports] }
    })
  }, [persist])

  // ---- expenses ------------------------------------------------------------
  const addExpense = useCallback((exp) => {
    setData((d) => {
      const veh = d.vehicles.find((v) => v.id === exp.vehicle_id)
      const row = {
        id: `exp-${Date.now()}`, created_at: new Date().toISOString(),
        vehicle_reg: veh?.reg || null, ...exp,
        amount_usd: Number(exp.amount_usd) || 0,
      }
      persist('expenses', { id: row.id, kind: row.kind, category: row.category, vehicle_id: row.vehicle_id || null, vehicle_reg: row.vehicle_reg, amount_usd: row.amount_usd, note: row.note, recorded_by: row.recorded_by, created_at: row.created_at })
      return { ...d, expenses: [row, ...d.expenses] }
    })
  }, [persist])

  // ---- fault reports -------------------------------------------------------
  const setFaultStatus = useCallback((id, status) => {
    setData((d) => {
      const fault_reports = d.fault_reports.map((f) => f.id === id ? { ...f, status } : f)
      persist('fault_reports', { id, status })
      return { ...d, fault_reports }
    })
  }, [persist])

  // Real GPS ping from the Driver page → pin that vehicle to a true location.
  const postPing = useCallback((vehicleId, lat, lng, speed) => {
    setData((d) => ({
      ...d,
      vehicles: d.vehicles.map((v) => v.id === vehicleId
        ? { ...v, lat, lng, speed_kmh: Math.round(speed || 0), status: 'Moving', _pinned: true } : v),
    }))
  }, [])

  return (
    <StoreCtx.Provider value={{
      ...data, loading, source,
      alerts, addAlert, dismissAlert, markAlertsRead,
      assignJob, setJobStatus, savePOD, addFuelLog, addCompliance, postPing,
      saveStaff, toggleStaff, startTrip, endTrip, setFaultStatus, addExpense, updateDriver,
      addInvoice, setInvoiceStatus,
    }}>
      {children}
    </StoreCtx.Provider>
  )
}

// ---- derived selectors (pure) ----------------------------------------------
export function complianceAlerts(compliance) {
  return compliance
    .map((d) => ({ ...d, days: differenceInCalendarDays(parseISO(d.expiry), new Date()) }))
    .map((d) => ({ ...d, level: d.days < 0 ? 'expired' : d.days <= 14 ? 'critical' : d.days <= 30 ? 'soon' : 'ok' }))
    .sort((a, b) => a.days - b.days)
}

export function fuelAnomalies(fuel_logs, vehicles) {
  // Flag any fill whose km/l is < 70% of that vehicle-type's healthy baseline.
  const base = { Truck: 2.6, Van: 8.2, Pickup: 9.1 }
  return fuel_logs
    .map((f) => {
      const v = vehicles.find((x) => x.id === f.vehicle_id)
      const expected = base[v?.type] || 6
      const ratio = f.kmpl / expected
      return { ...f, reg: v?.reg, expected, ratio, flagged: ratio < 0.7 }
    })
    .filter((f) => f.flagged)
    .sort((a, b) => a.ratio - b.ratio)
}

export function maintenanceDue(maintenance, vehicles) {
  return maintenance.map((m) => {
    const v = vehicles.find((x) => x.id === m.vehicle_id)
    const since = (v?.odo_km || 0) - m.last_service_odo
    const pct = Math.min(120, Math.round((since / m.service_interval_km) * 100))
    return { ...m, reg: v?.reg, since: Math.round(since), pct, due: pct >= 90 }
  }).sort((a, b) => b.pct - a.pct)
}

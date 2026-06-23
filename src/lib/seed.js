// Synthetic Harare fleet for the live demo. Realistic regs, routes and docs.
// Used as the fallback store when Supabase isn't configured, and to power the
// live-map simulation in all modes.

import { addDays, subDays, formatISO } from 'date-fns'

const today = new Date()
const iso = (d) => formatISO(d, { representation: 'date' })

// A few real-ish Harare corridors (lat,lng waypoints). Vehicles loop along these.
export const ROUTES = {
  msasa: {
    name: 'CBD → Msasa Industrial',
    pts: [
      [-17.8292, 31.0522], [-17.8316, 31.0613], [-17.8334, 31.0719],
      [-17.8351, 31.0824], [-17.8377, 31.0931], [-17.8392, 31.1042],
    ],
  },
  airport: {
    name: 'CBD → R.G. Mugabe Airport',
    pts: [
      [-17.8252, 31.0335], [-17.8388, 31.0496], [-17.8556, 31.0662],
      [-17.8741, 31.0858], [-17.8919, 31.1011], [-17.9318, 31.0928],
    ],
  },
  chitungwiza: {
    name: 'CBD → Chitungwiza',
    pts: [
      [-17.8312, 31.0466], [-17.8771, 31.0541], [-17.9226, 31.0606],
      [-17.9681, 31.0671], [-18.0136, 31.0736], [-18.0127, 31.0756],
    ],
  },
  norton: {
    name: 'CBD → Norton',
    pts: [
      [-17.8252, 31.0335], [-17.8201, 31.0001], [-17.8154, 30.9512],
      [-17.8211, 30.9011], [-17.8388, 30.8512], [-17.8847, 30.7011],
    ],
  },
  borrowdale: {
    name: 'CBD → Borrowdale',
    pts: [
      [-17.8252, 31.0335], [-17.8016, 31.0411], [-17.7781, 31.0512],
      [-17.7556, 31.0641], [-17.7388, 31.0772], [-17.7281, 31.0866],
    ],
  },
}

const DRIVERS = [
  { id: 'drv-1', name: 'Tendai Moyo',     phone: '263771234501', score: 92, license_expiry: iso(addDays(today, 240)), nok_name: 'Maria Moyo',    nok_phone: '263772990001', photo_url: null, license_url: null, id_url: null },
  { id: 'drv-2', name: 'Farai Chikomo',   phone: '263771234502', score: 88, license_expiry: iso(addDays(today, 18)),  nok_name: 'Grace Chikomo', nok_phone: '263772990002', photo_url: null, license_url: null, id_url: null },
  { id: 'drv-3', name: 'Blessing Ncube',  phone: '263771234503', score: 75, license_expiry: iso(addDays(today, 410)), nok_name: 'Peter Ncube',   nok_phone: '263772990003', photo_url: null, license_url: null, id_url: null },
  { id: 'drv-4', name: 'Kudzai Marira',   phone: '263771234504', score: 81, license_expiry: iso(subDays(today, 4)),   nok_name: '', nok_phone: '', photo_url: null, license_url: null, id_url: null },
  { id: 'drv-5', name: 'Rumbidzai Phiri', phone: '263771234505', score: 95, license_expiry: iso(addDays(today, 120)), nok_name: '', nok_phone: '', photo_url: null, license_url: null, id_url: null },
  { id: 'drv-6', name: 'Tapiwa Sibanda',  phone: '263771234506', score: 67, license_expiry: iso(addDays(today, 55)),  nok_name: '', nok_phone: '', photo_url: null, license_url: null, id_url: null },
]

const VEHICLES = [
  { id: 'veh-1', name: 'Truck 1',  reg: 'AEX 1234', make: 'Isuzu',  model: 'FVR Truck',  type: 'Truck',  route: 'msasa',       driver_id: 'drv-1', fuel_pct: 62, odo_km: 184320, tank_l: 200 },
  { id: 'veh-2', name: 'Van 1',    reg: 'AFG 5821', make: 'Toyota', model: 'Hiace',      type: 'Van',    route: 'airport',     driver_id: 'drv-2', fuel_pct: 28, odo_km: 96540,  tank_l: 70 },
  { id: 'veh-3', name: 'Truck 2',  reg: 'ACD 9087', make: 'Nissan', model: 'UD Truck',   type: 'Truck',  route: 'chitungwiza', driver_id: 'drv-3', fuel_pct: 81, odo_km: 233110, tank_l: 200 },
  { id: 'veh-4', name: 'Pickup 1', reg: 'AEB 4410', make: 'Toyota', model: 'Hilux',      type: 'Pickup', route: 'norton',      driver_id: 'drv-5', fuel_pct: 45, odo_km: 142870, tank_l: 80 },
  { id: 'veh-5', name: 'Van 2',    reg: 'AGH 2299', make: 'Mercedes',model: 'Sprinter',  type: 'Van',    route: 'borrowdale',  driver_id: 'drv-6', fuel_pct: 90, odo_km: 51240,  tank_l: 75 },
]

const CLIENTS = ['Halsted Builders', 'OK Mart Distribution', 'Delta Beverages', 'Schweppes ZW', 'TM Pick n Pay']

function makeJobs() {
  const stops = ['Graniteside Depot', 'Msasa Yard', 'Workington', 'Belgravia', 'Chitungwiza Town', 'Norton Centre', 'Borrowdale Village']
  const statuses = ['In Transit', 'In Transit', 'Assigned', 'Pending', 'Delivered']
  return VEHICLES.slice(0, 5).map((v, i) => ({
    id: `job-${i + 1}`,
    ref: `FMB-${String(2041 + i)}`,
    client: CLIENTS[i % CLIENTS.length],
    pickup: stops[i % stops.length],
    dropoff: stops[(i + 3) % stops.length],
    cargo: ['Cement 12t', 'Beverages 4t', 'Retail mixed', 'Hardware 2t', 'Spares'][i],
    vehicle_id: statuses[i] === 'Pending' ? null : v.id,
    driver_id: statuses[i] === 'Pending' ? null : v.driver_id,
    status: statuses[i],
    eta_min: [22, 41, 0, 0, 0][i],
    created_at: iso(today),
  }))
}

function makeFuelLogs() {
  // ~6 logs/vehicle; one deliberately anomalous (low km/l → flagged as possible theft).
  const logs = []
  let n = 0
  VEHICLES.forEach((v) => {
    let odo = v.odo_km - 2400
    for (let k = 6; k >= 1; k--) {
      const dist = 360 + Math.round(Math.random() * 140)
      odo += dist
      // expected ~ truck 2.5km/l, van 8, pickup 9
      const base = v.type === 'Truck' ? 2.6 : v.type === 'Van' ? 8.2 : 9.1
      let kmpl = base * (0.9 + Math.random() * 0.2)
      if (v.id === 'veh-3' && k === 2) kmpl = base * 0.55 // <-- anomaly
      const litres = Math.round((dist / kmpl) * 10) / 10
      logs.push({
        id: `fuel-${++n}`,
        vehicle_id: v.id,
        date: iso(subDays(today, k * 4)),
        litres,
        odo_km: odo,
        cost_usd: Math.round(litres * 1.58 * 100) / 100,
        kmpl: Math.round(kmpl * 100) / 100,
      })
    }
  })
  return logs
}

function makeCompliance() {
  const docs = []
  let n = 0
  VEHICLES.forEach((v, i) => {
    const defs = [
      { type: 'ZINARA Licence',   days: [200, 9, 140, -3, 64][i] },
      { type: 'Insurance',        days: [80, 30, 410, 12, 300][i] },
      { type: 'Vehicle Fitness',  days: [150, -10, 60, 220, 18][i] },
      { type: 'ZIMRA Route Permit', days: [45, 120, 5, 90, 240][i] },
    ]
    defs.forEach((d) => {
      docs.push({
        id: `doc-${++n}`,
        vehicle_id: v.id,
        vehicle_reg: v.reg,
        type: d.type,
        ref: `${d.type.split(' ')[0].toUpperCase()}-${10000 + n}`,
        expiry: iso(addDays(today, d.days)),
      })
    })
  })
  return docs
}

function makeMaintenance() {
  return VEHICLES.map((v, i) => ({
    id: `mnt-${i + 1}`,
    vehicle_id: v.id,
    service_interval_km: v.type === 'Truck' ? 15000 : 10000,
    last_service_odo: v.odo_km - [13800, 4200, 9600, 7100, 1500][i],
    last_service_date: iso(subDays(today, [70, 24, 51, 38, 12][i])),
  }))
}

// --- skips (waste / skip-hire asset lifecycle) ------------------------------
// A "skip" is the steel waste container the company hires out. Unlike a vehicle,
// it earns (or leaks) money while sitting at a customer site — so each one is
// tracked through its lifecycle and its dwell time drives demurrage billing.
export const SKIP_SIZES = ['6 m³', '8 m³', '12 m³', '14 m³']
export const SKIP_STATUSES = ['In Yard', 'Deployed', 'Full', 'In Transit']

function makeSkips() {
  const rows = [
    { code: 'SKP-01', size: '6 m³',  status: 'Deployed',   client: 'Halsted Builders',  site: 'Borrowdale — Pomona build',  d: 9,  rate: 8,  free: 3 },
    { code: 'SKP-02', size: '8 m³',  status: 'Full',       client: 'Avondale Hardware', site: 'Avondale — shop refit',      d: 5,  rate: 9,  free: 3 },
    { code: 'SKP-03', size: '12 m³', status: 'Deployed',   client: 'Delta Beverages',   site: 'Graniteside depot',          d: 2,  rate: 12, free: 5 },
    { code: 'SKP-04', size: '6 m³',  status: 'In Yard',    client: null, site: null, d: 0, rate: 8,  free: 3 },
    { code: 'SKP-05', size: '8 m³',  status: 'In Yard',    client: null, site: null, d: 0, rate: 9,  free: 3 },
    { code: 'SKP-06', size: '14 m³', status: 'Full',       client: 'City of Harare',    site: 'Workington factory yard',    d: 11, rate: 14, free: 5 },
    { code: 'SKP-07', size: '12 m³', status: 'In Transit', client: 'OK Mart',           site: 'Chitungwiza — Unit L',       d: 1,  rate: 12, free: 5 },
    { code: 'SKP-08', size: '6 m³',  status: 'Deployed',   client: 'Mr Chideya',        site: 'Mt Pleasant residence',      d: 4,  rate: 6,  free: 7 },
    { code: 'SKP-09', size: '8 m³',  status: 'In Yard',    client: null, site: null, d: 0, rate: 9,  free: 3 },
  ]
  return rows.map((r, i) => ({
    id: `skip-${i + 1}`,
    code: r.code,
    size: r.size,
    status: r.status,
    client: r.client,
    site: r.site,
    deployed_at: r.status === 'In Yard' ? null : iso(subDays(today, r.d)),
    daily_rate: r.rate,
    free_days: r.free,
  }))
}

export function buildSeed() {
  return {
    drivers: DRIVERS.map((d) => ({ ...d })),
    vehicles: VEHICLES.map((v) => ({
      ...v,
      status: 'Moving',
      lat: ROUTES[v.route].pts[0][0],
      lng: ROUTES[v.route].pts[0][1],
      _leg: 0,
      _t: Math.random(),          // progress along current leg 0..1
      speed_kmh: 0,
    })),
    jobs: makeJobs(),
    fuel_logs: makeFuelLogs(),
    compliance: makeCompliance(),
    maintenance: makeMaintenance(),
    skips: makeSkips(),
    clients: CLIENTS.map((name, i) => ({ id: `cl-${i + 1}`, name })),
    staff: STAFF.map((s) => ({ ...s })),
    trips: makeTrips(),
    fault_reports: makeFaults(),
    expenses: makeExpenses(),
    invoices: makeInvoices(),
  }
}

function makeInvoices() {
  const mk = (i, type, client, items, status, days) => {
    const total = items.reduce((a, b) => a + b.qty * b.price, 0)
    return { id: `inv-${i}`, ref: `${type === 'Quote' ? 'QTE' : 'INV'}-${1000 + i}`, type, client, items, total,
      status, created_at: subDays(today, days).toISOString() }
  }
  return [
    mk(1, 'Invoice', 'Halsted Builders', [{ desc: 'Cement delivery — 12t', qty: 1, price: 240 }], 'Paid', 4),
    mk(2, 'Invoice', 'OK Mart Distribution', [{ desc: 'Beverage run x3', qty: 3, price: 85 }], 'Sent', 2),
    mk(3, 'Quote', 'Delta Beverages', [{ desc: 'Monthly distribution contract', qty: 1, price: 4200 }], 'Draft', 1),
    mk(4, 'Invoice', 'TM Pick n Pay', [{ desc: 'Retail mixed load', qty: 2, price: 130 }], 'Sent', 6),
  ]
}

export const GENERAL_EXPENSE_CATEGORIES = ['Office', 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Bank charges', 'Other']
export const VEHICLE_EXPENSE_CATEGORIES = ['Fuel', 'Service', 'Repairs', 'Tyres', 'ZINARA tolls', 'Licensing', 'Insurance', 'Fines', 'Parts']

function makeExpenses() {
  const now = today
  const rows = [
    { kind: 'Vehicle', category: 'Service',   vehicle_id: 'veh-1', amount_usd: 180, note: 'Full service + oil', days: 2 },
    { kind: 'Vehicle', category: 'Tyres',     vehicle_id: 'veh-3', amount_usd: 320, note: '2 rear tyres', days: 5 },
    { kind: 'Vehicle', category: 'ZINARA tolls', vehicle_id: 'veh-2', amount_usd: 24, note: 'Harare–Chitungwiza tolls', days: 1 },
    { kind: 'Vehicle', category: 'Repairs',   vehicle_id: 'veh-4', amount_usd: 95,  note: 'Brake pads front', days: 8 },
    { kind: 'General', category: 'Salaries',  vehicle_id: null,    amount_usd: 1450, note: 'Driver wages — week', days: 3 },
    { kind: 'General', category: 'Utilities', vehicle_id: null,    amount_usd: 68,  note: 'Yard electricity', days: 6 },
    { kind: 'General', category: 'Marketing', vehicle_id: null,    amount_usd: 40,  note: 'Flyers & airtime', days: 10 },
  ]
  return rows.map((r, i) => {
    const veh = VEHICLES.find((v) => v.id === r.vehicle_id)
    return {
      id: `exp-${i + 1}`, kind: r.kind, category: r.category, vehicle_id: r.vehicle_id,
      vehicle_reg: veh?.reg || null, amount_usd: r.amount_usd, note: r.note,
      recorded_by: 'Patience Dube', created_at: subDays(now, r.days).toISOString(),
    }
  })
}

// --- staff / users (role-based access) --------------------------------------
export const ROLES = ['admin', 'operator', 'driver', 'staff']
export const ROLE_LABEL = {
  admin: 'Administrator',
  operator: 'Operations',
  driver: 'Driver',
  staff: 'Workshop / Staff',
}

// driver_id links a staff login to its driver record (and trips/vehicle).
const STAFF = [
  { id: 'usr-1', name: 'Rumbidzai Admin', role: 'admin',    pin: '1975', phone: '263772110571', driver_id: null,  active: true },
  { id: 'usr-2', name: 'Patience Dube',   role: 'operator', pin: '2200', phone: '263772110572', driver_id: null,  active: true },
  { id: 'usr-3', name: 'Workshop Desk',   role: 'staff',    pin: '3300', phone: '263772110573', driver_id: null,  active: true },
  { id: 'usr-4', name: 'Tendai Moyo',     role: 'driver',   pin: '1001', phone: '263771234501', driver_id: 'drv-1', active: true },
  { id: 'usr-5', name: 'Farai Chikomo',   role: 'driver',   pin: '1002', phone: '263771234502', driver_id: 'drv-2', active: true },
  { id: 'usr-6', name: 'Blessing Ncube',  role: 'driver',   pin: '1003', phone: '263771234503', driver_id: 'drv-3', active: true },
  { id: 'usr-7', name: 'Kudzai Marira',   role: 'driver',   pin: '1004', phone: '263771234504', driver_id: 'drv-4', active: true },
  { id: 'usr-8', name: 'Rumbidzai Phiri', role: 'driver',   pin: '1005', phone: '263771234505', driver_id: 'drv-5', active: true },
  { id: 'usr-9', name: 'Tapiwa Sibanda',  role: 'driver',   pin: '1006', phone: '263771234506', driver_id: 'drv-6', active: true },
]

// Which vehicle each driver typically uses (drv-4 is a relief driver on veh-4).
const DRIVER_VEHICLE = { 'drv-1': 'veh-1', 'drv-2': 'veh-2', 'drv-3': 'veh-3', 'drv-4': 'veh-4', 'drv-5': 'veh-4', 'drv-6': 'veh-5' }

function makeTrips() {
  const routes = Object.values(ROUTES)
  const trips = []
  let n = 0
  DRIVERS.forEach((d) => {
    const vid = DRIVER_VEHICLE[d.id]
    const veh = VEHICLES.find((v) => v.id === vid)
    const count = 4 + Math.floor(Math.random() * 4)
    for (let k = count; k >= 1; k--) {
      const r = routes[Math.floor(Math.random() * routes.length)]
      const dist = 30 + Math.round(Math.random() * 120)
      const dur = Math.round(dist / (38 + Math.random() * 12) * 60)
      trips.push({
        id: `trip-${++n}`,
        driver_id: d.id,
        driver_name: d.name,
        vehicle_id: vid,
        vehicle_reg: veh?.reg,
        route: r.name,
        date: iso(subDays(today, k * 2)),
        distance_km: dist,
        duration_min: dur,
        status: 'Completed',
        note: '',
      })
    }
  })
  return trips
}

function makeFaults() {
  // Open faults waiting on the workshop — one ties to the fuel-anomaly vehicle.
  return [
    { id: 'flt-1', vehicle_id: 'veh-2', vehicle_reg: 'AFG 5821', driver_id: 'drv-2', driver_name: 'Farai Chikomo', category: 'Brakes', severity: 'High',   note: 'Brake pedal soft, pulls left under braking.', status: 'Open',         created_at: iso(subDays(today, 2)) },
    { id: 'flt-2', vehicle_id: 'veh-3', vehicle_reg: 'ACD 9087', driver_id: 'drv-3', driver_name: 'Blessing Ncube', category: 'Fuel',   severity: 'High',   note: 'Smell of diesel near tank, gauge dropping fast.', status: 'Open',       created_at: iso(subDays(today, 1)) },
    { id: 'flt-3', vehicle_id: 'veh-4', vehicle_reg: 'AEB 4410', driver_id: 'drv-5', driver_name: 'Rumbidzai Phiri', category: 'Body',  severity: 'Low',    note: 'Windscreen chip on passenger side.', status: 'Acknowledged', created_at: iso(subDays(today, 5)) },
    { id: 'flt-4', vehicle_id: 'veh-1', vehicle_reg: 'AEX 1234', driver_id: 'drv-1', driver_name: 'Tendai Moyo',    category: 'Tyres',  severity: 'Medium', note: 'Front-left tyre wearing on the inside edge.', status: 'Resolved',    created_at: iso(subDays(today, 8)) },
  ]
}

export const DEMO_PIN = '1975'
export const FAULT_CATEGORIES = ['Mechanical', 'Brakes', 'Tyres', 'Body', 'Fuel', 'Electrical', 'Other']
export const SEVERITIES = ['Low', 'Medium', 'High']

// Zimbabwe emergency numbers for the "Outside" SOS. Next-of-kin is per-driver.
export const EMERGENCY_CONTACTS = [
  { label: 'National Emergency', number: '999' },
  { label: 'Police (ZRP)', number: '995' },
  { label: 'Ambulance', number: '994' },
  { label: 'Fire Brigade', number: '993' },
]

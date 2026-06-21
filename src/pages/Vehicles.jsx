import { useState } from 'react'
import { Truck, Wrench, Route, AlertTriangle, Wallet, Users, Eye, ArrowLeft, MapPin, PlayCircle } from 'lucide-react'
import FleetMap from '../components/FleetMap.jsx'
import TripReplay from '../components/TripReplay.jsx'
import { Btn } from '../components/ui.jsx'
import { useStore, maintenanceDue } from '../lib/store.jsx'

const fmtDate = (v) => v ? new Date(v).toLocaleDateString() : ''
const fmtDateTime = (v) => v ? new Date(v).toLocaleDateString() + ' ' + new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

export default function Vehicles() {
  const s = useStore()
  const [openId, setOpenId] = useState(null)
  const dueMap = Object.fromEntries(maintenanceDue(s.maintenance, s.vehicles).map((m) => [m.vehicle_id, m]))
  const open = s.vehicles.find((v) => v.id === openId)

  const fuelColor = (p) => p < 20 ? 'bg-rose-500' : p < 40 ? 'bg-amber-500' : 'bg-teal-500'

  // ---- Detail view -----------------------------------------------------------
  if (open) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Btn size="sm" variant="subtle" icon={ArrowLeft} onClick={() => setOpenId(null)}>All vehicles</Btn>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{open.name} · {open.reg}</h1>
            <p className="text-slate-500 text-sm">{open.make} {open.model} · {open.type} · {s.drivers.find((d) => d.id === open.driver_id)?.name || 'unassigned'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3">
          <div className="px-2 py-1 text-sm font-semibold text-slate-800 flex items-center gap-2">
            <MapPin size={16} className="text-teal-600" /> Live location
          </div>
          <FleetMap vehicles={[open]} drivers={s.drivers} focus={open} height={340} showRoutes={false} />
        </div>

        <VehicleHistory v={open} s={s} />
      </div>
    )
  }

  // ---- List view -------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vehicles</h1>
        <p className="text-slate-500 text-sm">Your fleet at a glance. Tap the view icon to see a vehicle's history and live location.</p>
      </div>

      <div className="space-y-3">
        {s.vehicles.map((v) => {
          const drv = s.drivers.find((d) => d.id === v.driver_id)
          const m = dueMap[v.id]
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-100 grid place-items-center text-slate-600"><Truck size={20} /></div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800">{v.name} <span className="text-slate-400 font-normal">· {v.reg}</span></div>
                  <div className="text-xs text-slate-500">{v.make} {v.model} · {v.type} · {drv?.name || 'unassigned'}</div>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">{Math.round(v.odo_km).toLocaleString()} km</div>
                    <div className="text-xs font-semibold text-teal-600">{Math.round(v.speed_kmh)} km/h</div>
                  </div>
                  <Btn size="sm" variant="primary" icon={Eye} onClick={() => setOpenId(v.id)}>View</Btn>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Fuel</span><span>{Math.round(v.fuel_pct)}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${fuelColor(v.fuel_pct)}`} style={{ width: `${v.fuel_pct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="flex items-center gap-1"><Wrench size={11} /> Service</span>
                    <span className={m?.due ? 'text-amber-600 font-semibold' : ''}>{m?.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${m?.due ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${Math.min(100, m?.pct)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function VehicleHistory({ v, s }) {
  const [replay, setReplay] = useState(null)
  const trips = (s.trips || []).filter((t) => t.vehicle_id === v.id).sort((a, b) => new Date(b.date) - new Date(a.date))
  const faults = (s.fault_reports || []).filter((f) => f.vehicle_id === v.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const expenses = (s.expenses || []).filter((e) => e.vehicle_id === v.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const driversUsed = [...new Set(trips.map((t) => t.driver_name).filter(Boolean))]
  const totalKm = trips.reduce((a, b) => a + (+b.distance_km || 0), 0)
  const totalSpend = expenses.reduce((a, b) => a + (+b.amount_usd || 0), 0)

  const sevTone = { High: 'bg-rose-100 text-rose-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-slate-100 text-slate-600' }
  const stTone = { Open: 'text-rose-600', Acknowledged: 'text-amber-600', Resolved: 'text-emerald-600' }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-slate-900">History</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <Chip>{trips.length} trips · {Math.round(totalKm)} km</Chip>
          <Chip>{faults.length} faults</Chip>
          <Chip>${totalSpend.toLocaleString()} spent</Chip>
        </div>
      </div>

      {driversUsed.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={13} /> Drivers used:</span>
          {driversUsed.map((d) => <span key={d} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{d}</span>)}
        </div>
      )}

      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <Section icon={Route} title="Trips">
          {trips.length === 0 && <Empty />}
          {trips.slice(0, 8).map((t) => (
            <div key={t.id} className="bg-white rounded-lg border border-slate-100 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-slate-700 truncate">{t.route}</div>
                <button onClick={() => setReplay(t)} title="Replay trip" className="text-teal-600 hover:text-teal-700 shrink-0"><PlayCircle size={16} /></button>
              </div>
              <div className="text-xs text-slate-500 truncate">{t.driver_name} · {t.distance_km} km · {t.duration_min} min · {fmtDate(t.date)}</div>
            </div>
          ))}
        </Section>

        <Section icon={AlertTriangle} title="Faults">
          {faults.length === 0 && <Empty />}
          {faults.slice(0, 8).map((f) => (
            <Item key={f.id} title={<span className="flex items-center gap-2">{f.category}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sevTone[f.severity]}`}>{f.severity}</span></span>}
              meta={<span className={stTone[f.status]}>{f.status} · {f.note}</span>} date={fmtDate(f.created_at)} />
          ))}
        </Section>

        <Section icon={Wallet} title="Expenses">
          {expenses.length === 0 && <Empty />}
          {expenses.slice(0, 8).map((e) => (
            <Item key={e.id} title={`${e.category} · $${(+e.amount_usd).toLocaleString()}`} meta={e.note} date={fmtDateTime(e.created_at)} />
          ))}
        </Section>
      </div>

      {replay && <TripReplay trip={replay} vehicle={v} onClose={() => setReplay(null)} />}
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2"><Icon size={15} className="text-teal-600" /> {title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
function Item({ title, meta, date }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-slate-700 truncate">{title}</div>
        <div className="text-[11px] text-slate-400 shrink-0">{date}</div>
      </div>
      {meta && <div className="text-xs text-slate-500 truncate">{meta}</div>}
    </div>
  )
}
function Chip({ children }) { return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{children}</span> }
function Empty() { return <div className="text-xs text-slate-400 py-2 text-center">No records yet.</div> }

import { Truck, Send, ShieldAlert, Fuel, Wrench, Gauge, Siren } from 'lucide-react'
import { Link } from 'react-router-dom'
import FleetMap from '../components/FleetMap.jsx'
import StatCard from '../components/StatCard.jsx'
import { useStore, complianceAlerts, fuelAnomalies, maintenanceDue } from '../lib/store.jsx'

export default function Dashboard() {
  const s = useStore()
  const alerts = complianceAlerts(s.compliance)
  const critical = alerts.filter((a) => a.level === 'expired' || a.level === 'critical')
  const anomalies = fuelAnomalies(s.fuel_logs, s.vehicles)
  const dueSoon = maintenanceDue(s.maintenance, s.vehicles).filter((m) => m.due)
  const active = s.jobs.filter((j) => j.status === 'In Transit' || j.status === 'Assigned').length
  const moving = s.vehicles.filter((v) => v.status === 'Moving').length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations dashboard</h1>
          <p className="text-slate-500 text-sm">Live view of every vehicle, job and alert.</p>
        </div>
        <Link to="/app/dispatch" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          + New dispatch
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Truck} label="Vehicles moving" value={`${moving}/${s.vehicles.length}`} tone="teal" />
        <StatCard icon={Send} label="Active jobs" value={active} tone="blue" />
        <StatCard icon={ShieldAlert} label="Compliance alerts" value={critical.length} tone={critical.length ? 'rose' : 'slate'} sub="expired / ≤14 days" />
        <StatCard icon={Fuel} label="Fuel flags" value={anomalies.length} tone={anomalies.length ? 'amber' : 'slate'} />
        <StatCard icon={Wrench} label="Service due" value={dueSoon.length} tone={dueSoon.length ? 'amber' : 'slate'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Gauge size={18} className="text-teal-600" /> Live fleet map</h2>
            <span className="text-xs text-slate-400">phone-as-tracker · updates every ~1.6s</span>
          </div>
          <FleetMap vehicles={s.vehicles} drivers={s.drivers} height={440} />
        </div>

        <div className="space-y-4">
          {s.alerts.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100">
                <h3 className="font-semibold text-rose-700 text-sm flex items-center gap-2"><Siren size={15} /> Live alerts</h3>
                <span className="text-xs text-slate-400">{s.alerts.length}</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                {s.alerts.slice(0, 6).map((a) => (
                  <div key={a._key} className="px-4 py-2.5 text-sm">
                    <div className="text-slate-700">{a.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Panel title="Compliance — expiring first" to="/app/compliance">
            {alerts.slice(0, 5).map((a) => (
              <Row key={a.id}
                left={<span className="font-medium">{a.vehicle_reg}</span>}
                mid={a.type}
                right={<Badge level={a.level} days={a.days} />} />
            ))}
          </Panel>

          <Panel title="Fuel anomalies" to="/app/fuel">
            {anomalies.length === 0 && <Empty>No anomalies detected.</Empty>}
            {anomalies.slice(0, 4).map((f) => (
              <Row key={f.id}
                left={<span className="font-medium">{f.reg}</span>}
                mid={`${f.kmpl} km/l`}
                right={<span className="text-xs font-semibold text-amber-700">{Math.round(f.ratio * 100)}% of normal</span>} />
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, to, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        <Link to={to} className="text-xs text-teal-600 hover:underline">View all</Link>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  )
}
function Row({ left, mid, right }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <div className="w-20 shrink-0 text-slate-700">{left}</div>
      <div className="flex-1 text-slate-500 truncate">{mid}</div>
      <div className="shrink-0">{right}</div>
    </div>
  )
}
function Badge({ level, days }) {
  const map = {
    expired: ['bg-rose-100 text-rose-700', `Expired ${Math.abs(days)}d`],
    critical: ['bg-rose-50 text-rose-600', `${days}d left`],
    soon: ['bg-amber-50 text-amber-700', `${days}d left`],
    ok: ['bg-slate-100 text-slate-500', `${days}d`],
  }
  const [cls, txt] = map[level]
  return <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${cls}`}>{txt}</span>
}
function Empty({ children }) { return <div className="px-4 py-6 text-center text-sm text-slate-400">{children}</div> }

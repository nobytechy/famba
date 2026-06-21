import { Gauge, DollarSign, Route, Clock, Trophy } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts'
import { useStore } from '../lib/store.jsx'
import { printDocument } from '../lib/pdf'
import { Btn } from '../components/ui.jsx'

const COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#e11d48', '#0891b2']

export default function Analytics() {
  const s = useStore()

  const perVehicle = s.vehicles.map((v) => {
    const trips = (s.trips || []).filter((t) => t.vehicle_id === v.id)
    const km = trips.reduce((a, b) => a + (+b.distance_km || 0), 0)
    const exp = (s.expenses || []).filter((e) => e.vehicle_id === v.id).reduce((a, b) => a + (+b.amount_usd || 0), 0)
    const fuel = (s.fuel_logs || []).filter((f) => f.vehicle_id === v.id).reduce((a, b) => a + (+b.cost_usd || 0), 0)
    const cost = exp + fuel
    return { id: v.id, name: v.name || v.reg, km, trips: trips.length, cost, cpk: km ? cost / km : 0 }
  })

  const totalKm = perVehicle.reduce((a, b) => a + b.km, 0)
  const totalCost = perVehicle.reduce((a, b) => a + b.cost, 0)
  const cpk = totalKm ? totalCost / totalKm : 0
  const active = perVehicle.filter((v) => v.trips > 0).length
  const utilisation = Math.round((active / Math.max(1, s.vehicles.length)) * 100)
  const idle = s.vehicles.length - active

  const league = s.drivers.map((d) => {
    const trips = (s.trips || []).filter((t) => t.driver_id === d.id)
    const km = trips.reduce((a, b) => a + (+b.distance_km || 0), 0)
    return { name: d.name, score: d.score, trips: trips.length, km }
  }).sort((a, b) => b.score - a.score || b.km - a.km)

  const expenseByCat = {}
  ;(s.expenses || []).forEach((e) => { expenseByCat[e.category] = (expenseByCat[e.category] || 0) + (+e.amount_usd || 0) })
  const pie = Object.entries(expenseByCat).map(([name, value]) => ({ name, value }))

  const exportPdf = () => {
    const rows = perVehicle.map((v) => `<tr><td>${v.name}</td><td class="right">${v.trips}</td><td class="right">${Math.round(v.km)}</td><td class="right">$${v.cost.toFixed(0)}</td><td class="right">$${v.cpk.toFixed(2)}</td></tr>`).join('')
    printDocument('Fleet analytics', `<h1>Fleet analytics</h1>
      <p class="muted">Utilisation ${utilisation}% · ${Math.round(totalKm)} km · $${totalCost.toFixed(0)} cost · $${cpk.toFixed(2)}/km</p>
      <table><thead><tr><th>Vehicle</th><th class="right">Trips</th><th class="right">Km</th><th class="right">Cost</th><th class="right">$/km</th></tr></thead><tbody>${rows}</tbody></table>`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm">Utilisation, cost-per-km and driver performance.</p>
        </div>
        <Btn size="md" variant="outline" onClick={exportPdf}>Export PDF</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Gauge} label="Fleet utilisation" value={`${utilisation}%`} sub={`${active} active · ${idle} idle`} tone="bg-teal-50 text-teal-700" />
        <Stat icon={Route} label="Total distance" value={`${Math.round(totalKm).toLocaleString()} km`} tone="bg-blue-50 text-blue-700" />
        <Stat icon={DollarSign} label="Running cost" value={`$${Math.round(totalCost).toLocaleString()}`} tone="bg-amber-50 text-amber-700" />
        <Stat icon={Clock} label="Cost per km" value={`$${cpk.toFixed(2)}`} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Distance by vehicle</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perVehicle}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
              <Bar dataKey="km" radius={[4, 4, 0, 0]}>{perVehicle.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Expense breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={(e) => e.name}>
                {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800 text-sm flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Driver league</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-2.5 font-medium">#</th><th className="px-4 py-2.5 font-medium">Driver</th><th className="px-4 py-2.5 font-medium text-right">Score</th><th className="px-4 py-2.5 font-medium text-right">Trips</th><th className="px-4 py-2.5 font-medium text-right">Km</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {league.map((d, i) => (
              <tr key={d.name}>
                <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{d.name}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-teal-600">{d.score}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{d.trips}</td>
                <td className="px-4 py-2.5 text-right text-slate-500">{Math.round(d.km)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${tone}`}><Icon size={20} /></div>
      <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

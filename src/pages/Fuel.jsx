import { useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, Plus, Camera } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useStore, fuelAnomalies } from '../lib/store.jsx'

export default function Fuel() {
  const s = useStore()
  const anomalies = fuelAnomalies(s.fuel_logs, s.vehicles)
  const flaggedIds = new Set(anomalies.map((a) => a.id))
  const [form, setForm] = useState({ vehicle_id: s.vehicles[0]?.id, litres: '', odo_km: '', date: new Date().toISOString().slice(0, 10), odo_photo: null })

  const logs = [...s.fuel_logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 24)
  const chart = logs.slice(0, 12).reverse().map((l) => ({
    name: s.vehicles.find((v) => v.id === l.vehicle_id)?.reg.split(' ')[1] || '',
    kmpl: l.kmpl, flagged: flaggedIds.has(l.id),
  }))
  const totalSpend = s.fuel_logs.reduce((a, b) => a + (b.cost_usd || 0), 0)

  const submit = (e) => {
    e.preventDefault()
    if (!form.litres || !form.odo_km) return toast.error('Enter litres and odometer')
    s.addFuelLog({ vehicle_id: form.vehicle_id, litres: +form.litres, odo_km: +form.odo_km, date: form.date, odo_photo: form.odo_photo })
    toast.success('Fuel log added — analysed instantly')
    setForm({ ...form, litres: '', odo_km: '', odo_photo: null })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fuel control</h1>
        <p className="text-slate-500 text-sm">Every fill is checked against the vehicle's healthy km/litre — outliers are flagged as possible theft or faults.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {anomalies.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold"><AlertTriangle size={18} /> {anomalies.length} fuel anomaly flagged</div>
              <div className="mt-2 space-y-1.5">
                {anomalies.map((a) => (
                  <div key={a.id} className="text-sm text-amber-900 flex items-center gap-2">
                    <span className="font-semibold">{a.reg}</span>
                    <span className="text-amber-700">{a.date}</span>
                    <span>· {a.kmpl} km/l vs ~{a.expected} expected</span>
                    <span className="ml-auto font-bold">{Math.round(a.ratio * 100)}% of normal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Recent efficiency (km / litre)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <ReferenceLine y={2.6} stroke="#cbd5e1" strokeDasharray="3 3" />
                <Bar dataKey="kmpl" radius={[4, 4, 0, 0]}>
                  {chart.map((c, i) => <Cell key={i} fill={c.flagged ? '#f59e0b' : '#0f766e'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr><th className="px-4 py-2.5 font-medium">Vehicle</th><th className="px-4 py-2.5 font-medium">Date</th><th className="px-4 py-2.5 font-medium">Litres</th><th className="px-4 py-2.5 font-medium">km/l</th><th className="px-4 py-2.5 font-medium">Cost</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className={flaggedIds.has(l.id) ? 'bg-amber-50/60' : ''}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{s.vehicles.find((v) => v.id === l.vehicle_id)?.reg}</td>
                    <td className="px-4 py-2.5 text-slate-500">{l.date}</td>
                    <td className="px-4 py-2.5">{l.litres}</td>
                    <td className={`px-4 py-2.5 font-semibold ${flaggedIds.has(l.id) ? 'text-amber-700' : ''}`}>{l.kmpl}</td>
                    <td className="px-4 py-2.5 text-slate-500">${l.cost_usd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-teal-600 text-white rounded-2xl p-4">
            <div className="text-sm opacity-80">Fuel spend (logged)</div>
            <div className="text-3xl font-bold mt-1">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Plus size={16} /> Log a refuel</h3>
            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {s.vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg}</option>)}
            </select>
            <input type="number" step="0.1" placeholder="Litres" value={form.litres}
              onChange={(e) => setForm({ ...form, litres: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Odometer (km)" value={form.odo_km}
              onChange={(e) => setForm({ ...form, odo_km: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer">
              <Camera size={15} /> {form.odo_photo ? 'Odometer photo added' : 'Odometer photo (anti-fraud)'}
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setForm((x) => ({ ...x, odo_photo: r.result })); r.readAsDataURL(f) }} />
            </label>
            <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm">Add & analyse</button>
            <p className="text-xs text-slate-400">No fuel sensor needed — km/litre is computed from the odometer gap between fills.</p>
          </form>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Wallet, Printer } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { PAY } from '../lib/config'
import { printDocument } from '../lib/pdf'
import { Btn } from '../components/ui.jsx'

export default function Payroll() {
  const s = useStore()
  const [perKm, setPerKm] = useState(PAY.perKmUsd)
  const [perTrip, setPerTrip] = useState(PAY.perTripUsd)

  const rows = s.drivers.map((d) => {
    const trips = (s.trips || []).filter((t) => t.driver_id === d.id)
    const km = trips.reduce((a, b) => a + (+b.distance_km || 0), 0)
    const pay = trips.length * perTrip + km * perKm
    return { name: d.name, trips: trips.length, km, pay }
  })
  const total = rows.reduce((a, b) => a + b.pay, 0)

  const exportPdf = () => {
    const body = rows.map((r) => `<tr><td>${r.name}</td><td class="right">${r.trips}</td><td class="right">${Math.round(r.km)}</td><td class="right">$${r.pay.toFixed(2)}</td></tr>`).join('')
    printDocument('Driver payroll', `<h1>Driver payroll</h1>
      <p class="muted">Rates: $${perTrip}/trip + $${perKm}/km</p>
      <table><thead><tr><th>Driver</th><th class="right">Trips</th><th class="right">Km</th><th class="right">Pay</th></tr></thead>
      <tbody>${body}</tbody></table>
      <p class="right total" style="margin-top:14px">Total payroll: $${total.toFixed(2)}</p>`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-slate-500 text-sm">Driver pay calculated from completed trips and distance.</p>
        </div>
        <Btn size="md" variant="outline" icon={Printer} onClick={exportPdf}>Export PDF</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="text-xs text-slate-500 block mb-1">Pay per trip ($)</span>
          <input type="number" step="0.5" value={perTrip} onChange={(e) => setPerTrip(+e.target.value)} className="w-28 border border-slate-300 rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="text-xs text-slate-500 block mb-1">Pay per km ($)</span>
          <input type="number" step="0.05" value={perKm} onChange={(e) => setPerKm(+e.target.value)} className="w-28 border border-slate-300 rounded-lg px-3 py-2" />
        </label>
        <div className="ml-auto text-right">
          <div className="text-xs text-slate-500">Total payroll</div>
          <div className="text-2xl font-bold text-teal-600">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-3 font-medium">Driver</th><th className="px-4 py-3 font-medium text-right">Trips</th><th className="px-4 py-3 font-medium text-right">Km</th><th className="px-4 py-3 font-medium text-right">Pay</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                <td className="px-4 py-3 text-right text-slate-500">{r.trips}</td>
                <td className="px-4 py-3 text-right text-slate-500">{Math.round(r.km)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">${r.pay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

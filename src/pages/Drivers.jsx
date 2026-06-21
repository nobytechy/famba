import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Phone, Star } from 'lucide-react'
import { useStore } from '../lib/store.jsx'

export default function Drivers() {
  const s = useStore()

  const scoreTone = (n) => n >= 90 ? 'text-emerald-600' : n >= 75 ? 'text-teal-600' : 'text-amber-600'
  const barTone = (n) => n >= 90 ? 'bg-emerald-500' : n >= 75 ? 'bg-teal-500' : 'bg-amber-500'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
        <p className="text-slate-500 text-sm">Roster, performance scores and licence status. Drivers sign in to their own trip portal with their PIN.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {s.drivers.map((d) => {
          const veh = s.vehicles.find((v) => v.driver_id === d.id)
          const lic = differenceInCalendarDays(parseISO(d.license_expiry), new Date())
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-600 text-white grid place-items-center font-bold">
                  {d.name.split(' ').map((x) => x[0]).join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800">{d.name}</div>
                  <a href={`tel:+${d.phone}`} className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> +{d.phone}</a>
                </div>
                <div className={`ml-auto flex items-center gap-1 font-bold ${scoreTone(d.score)}`}>
                  <Star size={15} fill="currentColor" />{d.score}
                </div>
              </div>

              <div className="mt-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barTone(d.score)}`} style={{ width: `${d.score}%` }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">{veh ? veh.reg : 'Unassigned'}</span>
                <span className={lic < 0 ? 'text-rose-600 font-semibold' : lic <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                  Licence {lic < 0 ? `expired ${Math.abs(lic)}d` : `${lic}d left`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

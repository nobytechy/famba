import toast from 'react-hot-toast'
import { Wrench, MessageCircle, AlertTriangle } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { Btn, IconBtn } from '../components/ui.jsx'

const sevBadge = { High: 'bg-rose-100 text-rose-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-slate-100 text-slate-600' }
const statusBadge = { Open: 'bg-rose-50 text-rose-600', Acknowledged: 'bg-amber-50 text-amber-700', Resolved: 'bg-emerald-50 text-emerald-700' }
const FLOW = { Open: 'Acknowledged', Acknowledged: 'Resolved' }

export default function Faults() {
  const s = useStore()
  const faults = [...(s.fault_reports || [])].sort((a, b) => {
    const rank = { Open: 0, Acknowledged: 1, Resolved: 2 }
    return rank[a.status] - rank[b.status] || new Date(b.created_at) - new Date(a.created_at)
  })
  const open = faults.filter((f) => f.status === 'Open').length

  const advance = (f) => {
    const next = FLOW[f.status]
    if (next) { s.setFaultStatus(f.id, next); toast.success(`${f.vehicle_reg}: ${next}`) }
  }
  const notifyDriver = (f) => {
    const drv = s.drivers.find((d) => d.id === f.driver_id)
    const msg = `Workshop update — ${f.vehicle_reg} (${f.category}, ${f.severity}): "${f.note}". Status: ${f.status}.`
    window.open(`https://wa.me/${drv?.phone || ''}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fault & damage reports</h1>
        <p className="text-slate-500 text-sm">Submitted by drivers at the end of a trip — so the workshop is alerted before a small fault becomes a breakdown.</p>
      </div>

      {open > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-2 text-rose-800 font-semibold">
          <AlertTriangle size={18} /> {open} open report{open > 1 ? 's' : ''} need attention
        </div>
      )}

      <div className="space-y-2">
        {faults.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center text-slate-500"><Wrench size={18} /></div>
              <div>
                <div className="font-semibold text-slate-800">{f.vehicle_reg} · {f.category}</div>
                <div className="text-xs text-slate-500">Reported by {f.driver_name} · {f.created_at}</div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sevBadge[f.severity]}`}>{f.severity}</span>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusBadge[f.status]}`}>{f.status}</span>
              <div className="ml-auto flex items-center gap-2">
                <IconBtn icon={MessageCircle} variant="ghostGreen" onClick={() => notifyDriver(f)} title="Message driver" />
                {FLOW[f.status] && (
                  <Btn size="sm" variant="dark" onClick={() => advance(f)}>Mark {FLOW[f.status]}</Btn>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600 pl-12">{f.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

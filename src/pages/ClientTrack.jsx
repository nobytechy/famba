import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Package, MapPin, ArrowRight, CheckCircle2, Truck, PackageCheck } from 'lucide-react'
import FleetMap from '../components/FleetMap.jsx'
import Logo from '../components/Logo.jsx'
import { useStore } from '../lib/store.jsx'
import { reverseGeocode } from '../lib/geocode'

const STEPS = ['Pending', 'Assigned', 'In Transit', 'Delivered']

// Public, no-login page a client opens from the WhatsApp link to watch their
// delivery move in real time.
export default function ClientTrack() {
  const { ref } = useParams()
  const s = useStore()
  const job = s.jobs.find((j) => j.ref?.toLowerCase() === ref?.toLowerCase())

  if (!job) {
    return (
      <Shell>
        <div className="text-center py-20">
          <Package className="mx-auto text-slate-300" size={48} />
          <p className="mt-3 text-slate-500">No delivery found for reference <b>{ref}</b>.</p>
        </div>
      </Shell>
    )
  }

  const veh = s.vehicles.find((v) => v.id === job.vehicle_id)
  const stepIdx = STEPS.indexOf(job.status)
  const [addr, setAddr] = useState('')
  useEffect(() => {
    if (veh && (job.status === 'In Transit' || job.status === 'Assigned')) {
      reverseGeocode(veh.lat, veh.lng).then(setAddr)
    }
  }, [veh?.lat, veh?.lng, job.status])

  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs text-slate-400">Delivery</div>
              <div className="text-xl font-bold text-slate-900">{job.ref}</div>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 text-teal-700">{job.status}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} className="text-slate-400" />{job.pickup}
            <ArrowRight size={14} className="text-slate-300" />{job.dropoff}
          </div>
          <div className="text-xs text-slate-500 mt-1">{job.cargo} · for {job.client}</div>
        </div>

        {/* progress */}
        <div className="px-5 py-4 flex items-center">
          {STEPS.map((st, i) => (
            <div key={st} className="flex-1 flex items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full grid place-items-center
                  ${i <= stepIdx ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {i < stepIdx ? <CheckCircle2 size={16} /> : i === stepIdx ? <Truck size={15} /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 ${i <= stepIdx ? 'text-slate-700' : 'text-slate-400'}`}>{st}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-1 mx-1 rounded ${i < stepIdx ? 'bg-teal-600' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        {veh && (job.status === 'In Transit' || job.status === 'Assigned') && (
          <div className="p-3">
            <div className="text-xs text-slate-500 px-2 pb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 live-dot" /> Live · {veh.name || veh.reg}{addr ? ` · near ${addr}` : ''}
              {job.eta_min > 0 && <span className="ml-auto text-teal-600 font-semibold">ETA ~{job.eta_min} min</span>}
            </div>
            <FleetMap vehicles={[veh]} drivers={s.drivers} focus={veh} height={300} showRoutes={false} />
          </div>
        )}
        {job.status === 'Delivered' && (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
            <p className="mt-2 font-semibold text-slate-700">Delivered</p>
            {(job.pod_to || job.pod_photo || job.pod_signature) && (
              <div className="mt-4 bg-slate-50 rounded-xl p-4 text-left max-w-xs mx-auto">
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><PackageCheck size={14} className="text-teal-600" /> Proof of delivery</div>
                {job.pod_to && <div className="mt-1 text-sm text-slate-700">Received by <b>{job.pod_to}</b></div>}
                {job.pod_time && <div className="text-xs text-slate-400">{new Date(job.pod_time).toLocaleString()}</div>}
                <div className="mt-2 flex gap-2">
                  {job.pod_photo && <img src={job.pod_photo} alt="delivery" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />}
                  {job.pod_signature && <img src={job.pod_signature} alt="signature" className="h-20 flex-1 rounded-lg object-contain bg-white border border-slate-200" />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3"><Logo /></div>
      </div>
      <div className="max-w-lg mx-auto p-4">{children}</div>
      <div className="text-center text-[11px] text-slate-400 pb-6">Powered by Noby · nobie.netlify.app</div>
    </div>
  )
}

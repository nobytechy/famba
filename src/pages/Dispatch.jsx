import { useState } from 'react'
import toast from 'react-hot-toast'
import { MessageCircle, MapPin, ArrowRight, X, Camera, PackageCheck } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { Btn } from '../components/ui.jsx'
import SignaturePad from '../components/SignaturePad.jsx'

const FLOW = ['Pending', 'Assigned', 'In Transit', 'Delivered']
const statusCls = {
  Pending: 'bg-slate-100 text-slate-600',
  Assigned: 'bg-blue-50 text-blue-700',
  'In Transit': 'bg-teal-50 text-teal-700',
  Delivered: 'bg-emerald-50 text-emerald-700',
}

export default function Dispatch() {
  const { jobs, vehicles, drivers, assignJob, setJobStatus, savePOD } = useStore()
  const [podJob, setPodJob] = useState(null)

  const driverFor = (id) => drivers.find((d) => d.id === id)
  const vehFor = (id) => vehicles.find((v) => v.id === id)

  const notify = (job) => {
    const veh = vehFor(job.vehicle_id)
    const text = encodeURIComponent(
      `Famba Fleet update — Job ${job.ref}\nCargo: ${job.cargo}\nFrom ${job.pickup} to ${job.dropoff}\n` +
      `Status: ${job.status}${veh ? `\nVehicle: ${veh.reg}` : ''}\nTrack: ${location.origin}/track/${job.ref}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const advance = (job) => {
    const i = FLOW.indexOf(job.status)
    if (i >= FLOW.length - 1) return
    const next = FLOW[i + 1]
    if (next === 'Delivered') { setPodJob(job); return }   // capture proof of delivery first
    setJobStatus(job.id, next); toast.success(`${job.ref} → ${next}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispatch board</h1>
          <p className="text-slate-500 text-sm">Assign vehicles, move jobs through to delivery, update clients on WhatsApp.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Vehicle / Driver</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const veh = vehFor(job.vehicle_id)
              const drv = driverFor(job.driver_id)
              return (
                <tr key={job.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{job.ref}</div>
                    <div className="text-xs text-slate-500">{job.client} · {job.cargo}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin size={13} className="text-slate-400" />{job.pickup}
                      <ArrowRight size={13} className="text-slate-300" />{job.dropoff}
                    </div>
                    {job.eta_min > 0 && <div className="text-xs text-teal-600 mt-0.5">ETA {job.eta_min} min</div>}
                  </td>
                  <td className="px-4 py-3">
                    {veh ? (
                      <div>
                        <div className="font-medium text-slate-700">{veh.reg}</div>
                        <div className="text-xs text-slate-500">{drv?.name}</div>
                      </div>
                    ) : (
                      <select defaultValue="" onChange={(e) => e.target.value && assignJob(job.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1.5">
                        <option value="" disabled>Assign vehicle…</option>
                        {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg} · {driverFor(v.driver_id)?.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls[job.status]}`}>{job.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {job.status !== 'Delivered' && job.vehicle_id && (
                        <Btn size="xs" variant="primary" onClick={() => advance(job)}>Advance</Btn>
                      )}
                      <Btn size="xs" variant="ghostGreen" icon={MessageCircle} onClick={() => notify(job)} title="Notify client on WhatsApp">
                        Notify
                      </Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Tip: “Notify” opens WhatsApp with a pre-filled status message and a live tracking link — the same channel your clients already use.
      </p>

      {podJob && (
        <PodModal job={podJob} onClose={() => setPodJob(null)}
          onSave={(pod) => { savePOD(podJob.id, pod); toast.success(`${podJob.ref} delivered · proof captured`); setPodJob(null) }} />
      )}
    </div>
  )
}

function PodModal({ job, onClose, onSave }) {
  const [to, setTo] = useState('')
  const [photo, setPhoto] = useState(null)
  const [signature, setSignature] = useState(null)

  const onPhoto = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 3 * 1024 * 1024) return toast.error('Photo too large (max 3 MB)')
    const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f)
  }
  const submit = (e) => {
    e.preventDefault()
    if (!to) return toast.error('Enter who received the delivery')
    onSave({ to, photo, signature })
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><PackageCheck size={18} className="text-teal-600" /> Proof of delivery · {job.ref}</h3>
          <button type="button" onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Received by</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Name of person who received"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <div>
          <span className="text-xs font-medium text-slate-600">Photo (optional)</span>
          <div className="mt-1 flex items-center gap-3">
            <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5">
              <Camera size={15} /> {photo ? 'Replace' : 'Add photo'}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
            </label>
            {photo && <img src={photo} alt="" className="w-12 h-12 rounded-lg object-cover" />}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-600">Signature</span>
          <div className="mt-1"><SignaturePad onChange={setSignature} /></div>
        </div>
        <Btn as="button" size="md" variant="primary" className="w-full" type="submit">Confirm delivery</Btn>
      </form>
    </div>
  )
}

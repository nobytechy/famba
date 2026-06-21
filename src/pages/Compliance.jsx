import { useState } from 'react'
import toast from 'react-hot-toast'
import { ShieldCheck, MessageCircle, Plus, BellRing } from 'lucide-react'
import { useStore, complianceAlerts } from '../lib/store.jsx'

const TYPES = ['ZINARA Licence', 'Insurance', 'Vehicle Fitness', 'ZIMRA Route Permit']

export default function Compliance() {
  const s = useStore()
  // Driver licences fold into the same expiry-alert pipeline.
  const licenceDocs = (s.drivers || []).filter((d) => d.license_expiry).map((d) => ({
    id: `lic-${d.id}`, vehicle_id: null, vehicle_reg: d.name, type: 'Driver Licence',
    ref: `LIC-${d.phone?.slice(-4) || d.id}`, expiry: d.license_expiry,
  }))
  const alerts = complianceAlerts([...s.compliance, ...licenceDocs])
  const [form, setForm] = useState({ vehicle_id: s.vehicles[0]?.id, type: TYPES[0], ref: '', expiry: '' })

  const counts = {
    expired: alerts.filter((a) => a.level === 'expired').length,
    critical: alerts.filter((a) => a.level === 'critical').length,
    soon: alerts.filter((a) => a.level === 'soon').length,
  }

  const remind = (a) => {
    const drv = s.drivers.find((d) => d.id === s.vehicles.find((v) => v.id === a.vehicle_id)?.driver_id)
    const msg = a.days < 0
      ? `⚠️ ${a.vehicle_reg}: ${a.type} EXPIRED ${Math.abs(a.days)} days ago (ref ${a.ref}). Vehicle must not operate until renewed.`
      : `Reminder — ${a.vehicle_reg}: ${a.type} expires in ${a.days} days (${a.expiry}, ref ${a.ref}). Please renew to avoid fines.`
    const phone = drv?.phone ? drv.phone : ''
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.ref || !form.expiry) return toast.error('Enter reference and expiry date')
    s.addCompliance(form)
    toast.success('Document added — alerts update automatically')
    setForm({ ...form, ref: '', expiry: '' })
  }

  const rowCls = { expired: 'border-l-rose-500', critical: 'border-l-rose-400', soon: 'border-l-amber-400', ok: 'border-l-slate-200' }
  const badge = { expired: 'bg-rose-100 text-rose-700', critical: 'bg-rose-50 text-rose-600', soon: 'bg-amber-50 text-amber-700', ok: 'bg-slate-100 text-slate-500' }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regulatory compliance</h1>
        <p className="text-slate-500 text-sm">ZINARA, ZIMRA, insurance & fitness — tracked with automatic expiry alerts before they cost you a fine.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Expired" value={counts.expired} tone="bg-rose-50 text-rose-700" />
        <Stat label="Critical (≤14 days)" value={counts.critical} tone="bg-rose-50 text-rose-600" />
        <Stat label="Due soon (≤30 days)" value={counts.soon} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${rowCls[a.level]} p-3.5 flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center text-slate-500"><ShieldCheck size={18} /></div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-sm">{a.vehicle_reg} · {a.type}</div>
                <div className="text-xs text-slate-500">Ref {a.ref} · expires {a.expiry}</div>
              </div>
              <span className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge[a.level]}`}>
                {a.days < 0 ? `Expired ${Math.abs(a.days)}d` : `${a.days}d left`}
              </span>
              {(a.level === 'expired' || a.level === 'critical' || a.level === 'soon') && (
                <button onClick={() => remind(a)} title="Send WhatsApp reminder"
                  className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg p-2"><MessageCircle size={16} /></button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 h-fit">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Plus size={16} /> Add a document</h3>
          <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {s.vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg}</option>)}
          </select>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input placeholder="Reference / certificate no." value={form.ref}
            onChange={(e) => setForm({ ...form, ref: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <label className="text-xs text-slate-500">Expiry date</label>
          <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
            <BellRing size={15} /> Track & alert
          </button>
        </form>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`inline-flex text-2xl font-bold px-2 rounded-lg ${tone}`}>{value}</div>
      <div className="text-sm text-slate-500 mt-2">{label}</div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Navigation, Play, Square, Radio, LogOut, History, Truck, Clock, MapPin, X, AlertTriangle,
  Plus, Trash2, Menu, Siren, Upload, User, FileText, Phone, MessageSquare, CheckCircle2, ChevronRight,
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../lib/store.jsx'
import { API_BASE } from '../lib/supabase'
import { publishAlert } from '../lib/alerts'
import { thanosSnap, thanosRestore } from '../lib/thanos'
import { FAULT_CATEGORIES, SEVERITIES, EMERGENCY_CONTACTS } from '../lib/seed'

function haversine(a, b) {
  const R = 6371, toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const MENU = [
  { key: 'trip', label: 'Current trip', icon: Navigation },
  { key: 'history', label: 'My history', icon: History },
  { key: 'reports', label: 'My reports', icon: MessageSquare },
  { key: 'documents', label: 'My documents', icon: FileText },
  { key: 'profile', label: 'Profile', icon: User },
]

export default function DriverPortal() {
  const { user, logout } = useAuth()
  const store = useStore()
  const { vehicles, trips, fault_reports, startTrip, endTrip, postPing } = store
  const nav = useNavigate()
  const me = store.drivers.find((d) => d.id === user?.driver_id)

  const [view, setView] = useState('trip')
  const [drawer, setDrawer] = useState(false)
  const [sos, setSos] = useState(false)

  const myVehicle = vehicles.find((v) => v.driver_id === user?.driver_id)
  const [vehicleId, setVehicleId] = useState(myVehicle?.id || vehicles[0]?.id || '')
  const [tripId, setTripId] = useState(null)
  const [on, setOn] = useState(false)
  const [pos, setPos] = useState(null)
  const [pings, setPings] = useState(0)
  const [dist, setDist] = useState(0)
  const [err, setErr] = useState('')
  const [ending, setEnding] = useState(false)
  const watch = useRef(null), last = useRef(null), wakeLock = useRef(null)
  const onRef = useRef(false), ctxRef = useRef({}), posRef = useRef(null)

  useEffect(() => { onRef.current = on }, [on])
  useEffect(() => {
    const veh = vehicles.find((v) => v.id === vehicleId)
    ctxRef.current = { driver_id: user?.driver_id, driver_name: user?.name, vehicle_id: vehicleId, vehicle_reg: veh?.reg }
  }, [vehicleId, user, vehicles])

  const myTrips = (trips || []).filter((t) => t.driver_id === user?.driver_id).sort((a, b) => new Date(b.date) - new Date(a.date))
  const myReports = (fault_reports || []).filter((f) => f.driver_id === user?.driver_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const acquireWakeLock = async () => { try { if ('wakeLock' in navigator) wakeLock.current = await navigator.wakeLock.request('screen') } catch { /* */ } }
  const releaseWakeLock = async () => { try { await wakeLock.current?.release() } catch { /* */ } wakeLock.current = null }

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && onRef.current) {
        publishAlert({ kind: 'driver_background', severity: 'warning', ...ctxRef.current,
          message: `${ctxRef.current.driver_name} minimised the app mid-trip (${ctxRef.current.vehicle_reg}) — tracking may pause.` })
      } else if (document.visibilityState === 'visible' && onRef.current && !wakeLock.current) acquireWakeLock()
    }
    const onHide = () => { if (onRef.current) publishAlert({ kind: 'driver_closed', severity: 'high', ...ctxRef.current,
      message: `${ctxRef.current.driver_name} closed the app during an active trip (${ctxRef.current.vehicle_reg}) — broadcasting stopped.` }) }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onHide) }
  }, [])

  useEffect(() => () => { if (watch.current != null) navigator.geolocation.clearWatch(watch.current); releaseWakeLock() }, [])

  const start = () => {
    if (!navigator.geolocation) return setErr('This phone/browser has no GPS access.')
    setErr(''); setDist(0); setPings(0); last.current = null
    const id = startTrip(user.driver_id, vehicleId)
    setTripId(id); setOn(true); onRef.current = true; acquireWakeLock()
    toast.success('Trip started — you are now live')
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const { latitude, longitude, speed } = p.coords
        const kmh = speed ? speed * 3.6 : 0
        const here = [latitude, longitude]
        if (last.current) setDist((d) => d + haversine(last.current, here))
        last.current = here; posRef.current = { lat: latitude, lng: longitude }
        setPos({ lat: latitude, lng: longitude, kmh }); setPings((n) => n + 1)
        postPing(vehicleId, latitude, longitude, kmh)
        if (API_BASE) fetch(`${API_BASE}/api/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicle_id: vehicleId, lat: latitude, lng: longitude, speed_kmh: kmh }) }).catch(() => {})
      },
      (e) => setErr(e.message || 'Location permission denied'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    )
  }
  const stopTracking = () => {
    if (watch.current != null) navigator.geolocation.clearWatch(watch.current)
    watch.current = null; setOn(false); onRef.current = false; releaseWakeLock()
  }
  const finish = (payload) => {
    endTrip(tripId, { distance_km: dist, ...payload })
    const n = (payload.faults || []).filter((f) => f.note?.trim()).length
    stopTracking(); setEnding(false); setTripId(null); setPos(null)
    toast.success(n ? `Trip ended · ${n} fault${n > 1 ? 's' : ''} reported` : 'Trip ended')
    setView('history')
  }

  const go = (k) => { setView(k); setDrawer(false) }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
        <button onClick={() => setDrawer(true)} className="text-slate-300 hover:text-white"><Menu size={22} /></button>
        <Logo light />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setSos(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow">
            <Siren size={16} /> SOS
          </button>
        </div>
      </header>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setDrawer(false)}>
          <div className="w-72 bg-slate-950 h-full p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <Avatar me={me} name={user?.name} size={44} />
              <div>
                <div className="font-semibold">{user?.name}</div>
                <div className="text-[11px] text-slate-400">Driver · {myVehicle?.reg || 'no vehicle'}</div>
              </div>
            </div>
            <nav className="flex-1 py-3 space-y-1">
              {MENU.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => go(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${view === key ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                  <Icon size={18} /> {label}
                </button>
              ))}
            </nav>
            <button onClick={() => thanosSnap(() => { logout(); nav('/'); thanosRestore() })} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
              <LogOut size={18} /> Sign out
            </button>
            <div className="text-center text-[11px] text-slate-600 pt-3">Powered by Noby</div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {view === 'trip' && (
          <TripView {...{ on, vehicles, vehicleId, setVehicleId, start, setEnding, pings, dist, pos, err }} />
        )}
        {view === 'history' && <HistoryView trips={myTrips} />}
        {view === 'reports' && <ReportsView reports={myReports} />}
        {view === 'documents' && <DocumentsView me={me} store={store} />}
        {view === 'profile' && <ProfileView me={me} user={user} store={store} />}
      </div>

      <div className="text-center text-[11px] text-slate-600 py-3">Powered by Noby · nobie.netlify.app</div>

      {ending && <EndTripModal onClose={() => setEnding(false)} onSubmit={finish} dist={dist} />}
      {sos && <SosSheet onClose={() => setSos(false)} me={me} ctx={ctxRef.current} getPos={() => posRef.current} />}
    </div>
  )
}

function Avatar({ me, name, size = 36 }) {
  if (me?.photo_url) return <img src={me.photo_url} alt="" style={{ width: size, height: size }} className="rounded-full object-cover" />
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-teal-600 grid place-items-center font-bold">
      {name?.split(' ').map((x) => x[0]).join('').slice(0, 2)}
    </div>
  )
}

function TripView({ on, vehicles, vehicleId, setVehicleId, start, setEnding, pings, dist, pos, err }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className={`w-32 h-32 rounded-full grid place-items-center mb-6 transition ${on ? 'bg-teal-600/20 ring-4 ring-teal-500' : 'bg-slate-800 ring-2 ring-slate-700'}`}>
        <Navigation size={48} className={on ? 'text-teal-300 live-dot' : 'text-slate-500'} />
      </div>
      <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={on}
        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center font-semibold disabled:opacity-60 mb-5">
        {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg} — {v.make} {v.model}</option>)}
      </select>
      {on ? (
        <button onClick={() => setEnding(true)} className="w-full max-w-xs bg-rose-600 hover:bg-rose-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><Square size={20} /> End trip</button>
      ) : (
        <button onClick={start} className="w-full max-w-xs bg-teal-600 hover:bg-teal-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><Play size={20} /> Start trip</button>
      )}
      {on && (<>
        <div className="mt-6 flex items-center gap-2 text-teal-300 text-sm"><Radio size={16} className="live-dot" /> Broadcasting live · {pings} pings</div>
        <div className="mt-2 text-sm text-slate-300">{dist.toFixed(1)} km this trip</div>
        <div className="mt-1 text-xs text-slate-500 max-w-xs">Screen kept awake — keep the app open to keep broadcasting.</div>
      </>)}
      {pos && <div className="mt-2 text-xs text-slate-400 font-mono">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)} · {Math.round(pos.kmh)} km/h</div>}
      {err && <div className="mt-4 text-sm text-rose-400 max-w-xs">{err}</div>}
    </div>
  )
}

function HistoryView({ trips }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h2 className="font-bold text-lg">My history</h2>
      {trips.length === 0 && <div className="text-center text-slate-500 py-16">No trips yet.</div>}
      {trips.map((t) => (
        <div key={t.id} className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold"><Truck size={16} className="text-teal-300" /> {t.vehicle_reg}</div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.status === 'In Progress' ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-700 text-slate-300'}`}>{t.status}</span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><Clock size={12} /> {t.date}</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> {t.route}</span>
            <span>{t.distance_km} km</span><span>{t.duration_min} min</span>
          </div>
          {t.note && <p className="mt-2 text-xs text-amber-300/90 flex items-start gap-1"><AlertTriangle size={12} className="mt-0.5" /> {t.note}</p>}
        </div>
      ))}
    </div>
  )
}

function ReportsView({ reports }) {
  const stTone = { Open: 'bg-rose-500/20 text-rose-300', Acknowledged: 'bg-amber-500/20 text-amber-300', Resolved: 'bg-emerald-500/20 text-emerald-300' }
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h2 className="font-bold text-lg">My reports</h2>
      <p className="text-xs text-slate-400">Faults you raised and the workshop's current status.</p>
      {reports.length === 0 && <div className="text-center text-slate-500 py-16">No reports yet.</div>}
      {reports.map((f) => (
        <div key={f.id} className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{f.vehicle_reg} · {f.category}</div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${stTone[f.status]}`}>{f.status}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{f.note}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <Clock size={12} /> {f.created_at} · severity {f.severity}
            {f.status === 'Resolved' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Workshop resolved this</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsView({ me, store }) {
  const read = (file, cb) => { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file) }
  const upload = (field) => (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 3 * 1024 * 1024) return toast.error('File too large (max 3 MB)')
    read(file, (dataUrl) => { store.updateDriver(me.id, { [field]: dataUrl }); toast.success('Uploaded') })
  }
  const docs = [
    { field: 'photo_url', label: 'Profile photo', accept: 'image/*' },
    { field: 'license_url', label: "Driver's licence", accept: 'image/*,application/pdf' },
    { field: 'id_url', label: 'National ID', accept: 'image/*,application/pdf' },
  ]
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <h2 className="font-bold text-lg">My documents</h2>
      <p className="text-xs text-slate-400">Your photo and licence appear to the office on the live map while you broadcast.</p>
      {docs.map((d) => {
        const val = me?.[d.field]
        const isImg = val && val.startsWith('data:image')
        return (
          <div key={d.field} className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-slate-700 grid place-items-center overflow-hidden shrink-0">
              {isImg ? <img src={val} alt="" className="w-full h-full object-cover" /> : <FileText size={22} className="text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="font-medium">{d.label}</div>
              <div className="text-xs text-slate-400">{val ? 'Uploaded' : 'Not uploaded'}</div>
            </div>
            <label className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5">
              <Upload size={14} /> {val ? 'Replace' : 'Upload'}
              <input type="file" accept={d.accept} className="hidden" onChange={upload(d.field)} />
            </label>
          </div>
        )
      })}
    </div>
  )
}

function ProfileView({ me, user, store }) {
  const [nok, setNok] = useState({ nok_name: me?.nok_name || '', nok_phone: me?.nok_phone || '' })
  const save = () => { store.updateDriver(me.id, nok); toast.success('Profile saved') }
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <h2 className="font-bold text-lg">Profile</h2>
      <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
        <Avatar me={me} name={user?.name} size={56} />
        <div>
          <div className="font-semibold">{user?.name}</div>
          <div className="text-xs text-slate-400">+{me?.phone} · score {me?.score}</div>
          <div className="text-xs text-slate-400">Licence expires {me?.license_expiry}</div>
        </div>
      </div>
      <div className="bg-slate-800 rounded-xl p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-200">Next of kin (used for SOS)</div>
        <input value={nok.nok_name} onChange={(e) => setNok({ ...nok, nok_name: e.target.value })} placeholder="Name"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
        <input value={nok.nok_phone} onChange={(e) => setNok({ ...nok, nok_phone: e.target.value.replace(/\D/g, '') })} placeholder="Phone (2637…)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
        <button onClick={save} className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Save</button>
      </div>
    </div>
  )
}

function SosSheet({ onClose, me, ctx, getPos }) {
  const [type, setType] = useState(null)   // 'internal' | 'outside'
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const locText = () => {
    const p = getPos?.()
    return p ? `https://maps.google.com/?q=${p.lat},${p.lng}` : 'location unavailable'
  }
  const fire = (scope) => {
    const message = `🆘 SOS (${scope}) from ${ctx.driver_name} · ${ctx.vehicle_reg}. ${note ? `"${note}". ` : ''}Location: ${locText()}`
    publishAlert({
      kind: scope === 'internal' ? 'sos_internal' : 'sos_outside', severity: 'high',
      driver_id: ctx.driver_id, driver_name: ctx.driver_name, vehicle_id: ctx.vehicle_id, vehicle_reg: ctx.vehicle_reg, message,
    })
    // Outside emergencies also try an SMS fallback to next of kin (if backend + keys set).
    if (scope === 'outside' && API_BASE && me?.nok_phone) {
      fetch(`${API_BASE}/api/sms`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+${me.nok_phone}`, text: message }) }).catch(() => {})
    }
    setSent(true)
    toast.success('SOS sent — staff alerted')
  }

  const tel = (n) => `tel:${n}`
  const waText = encodeURIComponent(`🆘 EMERGENCY — ${ctx.driver_name} (${ctx.vehicle_reg}). ${note}. Location: ${locText()}`)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white text-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-rose-600 flex items-center gap-2"><Siren size={20} /> Emergency SOS</h3>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>

        {!type && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Choose who to alert. Your location is attached automatically.</p>
            <button onClick={() => setType('internal')}
              className="w-full bg-slate-900 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-slate-800">
              <User size={22} /><div className="text-left flex-1"><div className="font-bold">Internal staff</div><div className="text-xs text-slate-300">Alert Admin & Operations now</div></div><ChevronRight size={18} />
            </button>
            <button onClick={() => setType('outside')}
              className="w-full bg-rose-600 text-white rounded-xl p-4 flex items-center gap-3 hover:bg-rose-700">
              <Siren size={22} /><div className="text-left flex-1"><div className="font-bold">Outside emergency</div><div className="text-xs text-rose-100">Police, ambulance, fire, next of kin</div></div><ChevronRight size={18} />
            </button>
          </div>
        )}

        {type && (
          <div className="space-y-3">
            <button onClick={() => setType(null)} className="text-xs text-slate-400">← back</button>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional) — what's happening?"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

            {type === 'internal' ? (
              <button onClick={() => fire('internal')} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <Siren size={18} /> Alert internal staff
              </button>
            ) : (
              <div className="space-y-2">
                <button onClick={() => fire('outside')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <Siren size={18} /> Broadcast emergency to staff
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {EMERGENCY_CONTACTS.map((c) => (
                    <a key={c.number} href={tel(c.number)} className="bg-slate-100 hover:bg-slate-200 rounded-lg p-2.5 text-sm font-medium flex items-center gap-2">
                      <Phone size={15} className="text-rose-600" /> {c.label} <span className="ml-auto font-mono">{c.number}</span>
                    </a>
                  ))}
                  {me?.nok_phone && (
                    <a href={tel(me.nok_phone)} className="bg-slate-100 hover:bg-slate-200 rounded-lg p-2.5 text-sm font-medium flex items-center gap-2 col-span-2">
                      <Phone size={15} className="text-teal-600" /> Next of kin · {me.nok_name} <span className="ml-auto font-mono">{me.nok_phone}</span>
                    </a>
                  )}
                  {me?.nok_phone && (
                    <a href={`https://wa.me/${me.nok_phone}?text=${waText}`} target="_blank" rel="noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg p-2.5 text-sm font-medium flex items-center justify-center gap-2 col-span-2">
                      <MessageSquare size={15} /> WhatsApp next of kin
                    </a>
                  )}
                </div>
              </div>
            )}
            {sent && <div className="text-center text-emerald-600 text-sm font-medium flex items-center justify-center gap-1"><CheckCircle2 size={16} /> Alert sent to staff</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function EndTripModal({ onClose, onSubmit, dist }) {
  const [note, setNote] = useState('')
  const [hasFault, setHasFault] = useState(false)
  const blank = () => ({ category: FAULT_CATEGORIES[0], severity: 'Medium', note: '' })
  const [faults, setFaults] = useState([blank()])
  const setFault = (i, patch) => setFaults((fs) => fs.map((f, j) => j === i ? { ...f, ...patch } : f))
  const addRow = () => setFaults((fs) => [...fs, blank()])
  const removeRow = (i) => setFaults((fs) => fs.filter((_, j) => j !== i))
  const submit = (e) => { e.preventDefault(); onSubmit({ note, faults: hasFault ? faults : [] }) }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/70 grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="bg-white text-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">End trip · {dist.toFixed(1)} km</h3>
          <button type="button" onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Trip notes (optional)</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. heavy traffic on Seke road"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={hasFault} onChange={(e) => setHasFault(e.target.checked)} className="w-4 h-4" />
          Report fault(s) / damage on this vehicle
        </label>
        {hasFault && (
          <div className="space-y-3">
            {faults.map((f, i) => (
              <div key={i} className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800">Fault {i + 1}</span>
                  {faults.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="text-rose-500 hover:text-rose-700 flex items-center gap-1 text-xs"><Trash2 size={13} /> Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={f.category} onChange={(e) => setFault(i, { category: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white">
                    {FAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <select value={f.severity} onChange={(e) => setFault(i, { severity: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white">
                    {SEVERITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <textarea rows={2} value={f.note} onChange={(e) => setFault(i, { note: e.target.value })} placeholder="Describe the fault — the workshop is notified immediately"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
            ))}
            <button type="button" onClick={addRow} className="w-full border border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-1">
              <Plus size={15} /> Add another fault
            </button>
          </div>
        )}
        <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl">Finish trip</button>
      </form>
    </div>
  )
}

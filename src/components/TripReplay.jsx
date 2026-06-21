import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import { ROUTES } from '../lib/seed'

const dot = L.divIcon({ className: '', html: '<div class="veh-marker" style="background:#0f766e;width:20px;height:20px"></div>', iconSize: [20, 20], iconAnchor: [10, 10] })
const lerp = (a, b, t) => a + (b - a) * t

// Build a dense path (interpolated) from a route's waypoints, ping-ponged.
function buildPath(pts) {
  const out = []
  for (let i = 0; i < pts.length - 1; i++) {
    for (let t = 0; t < 1; t += 0.05) out.push([lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)])
  }
  return out
}

export default function TripReplay({ trip, vehicle, onClose }) {
  const route = ROUTES[vehicle?.route]
  const path = route ? buildPath(route.pts) : []
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing || !path.length) return
    const iv = setInterval(() => setI((x) => (x + 1 >= path.length ? (setPlaying(false), x) : x + 1)), 120)
    return () => clearInterval(iv)
  }, [playing, path.length])

  const pos = path[i] || (route?.pts[0]) || [-17.8252, 31.0335]
  const pct = path.length ? Math.round((i / (path.length - 1)) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Trip replay · {vehicle?.name || vehicle?.reg}</h3>
            <p className="text-xs text-slate-500">{trip?.route || route?.name} · {trip?.date}</p>
          </div>
          <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <MapContainer center={pos} zoom={12} style={{ height: 360, width: '100%' }} scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          {route && <Polyline positions={route.pts} pathOptions={{ color: '#0f766e', weight: 4, opacity: 0.5 }} />}
          {path[i] && <Marker position={pos} icon={dot}><Popup>{vehicle?.name}</Popup></Marker>}
        </MapContainer>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => setPlaying((p) => !p)} className="w-9 h-9 rounded-full bg-teal-600 text-white grid place-items-center btn-press">
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={() => { setI(0); setPlaying(true) }} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 grid place-items-center btn-press"><RotateCcw size={15} /></button>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

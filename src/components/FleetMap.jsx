import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import { ROUTES } from '../lib/seed'

const COLORS = { Truck: '#0f766e', Van: '#2563eb', Pickup: '#7c3aed' }

function vehIcon(v) {
  const c = COLORS[v.type] || '#0f766e'
  const label = v.name || v.reg
  // Dot marker + an always-visible name label beside it.
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap;transform:translate(-9px,-9px)">
        <div class="veh-marker" style="background:${c};width:18px;height:18px"></div>
        <span style="background:#fff;color:#0f172a;font-size:11px;font-weight:700;padding:1px 6px;border-radius:9999px;box-shadow:0 1px 3px rgba(0,0,0,.25)">${label}</span>
      </div>`,
    iconSize: [0, 0], iconAnchor: [0, 0],
  })
}

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.setView(center, map.getZoom()) }, [center])
  return null
}

export default function FleetMap({ vehicles, drivers = [], height = 460, focus = null, showRoutes = true }) {
  const center = focus
    ? [focus.lat, focus.lng]
    : [-17.84, 31.04]
  const driverFor = (v) => drivers.find((d) => d.id === v.driver_id)

  return (
    <MapContainer center={center} zoom={focus ? 13 : 11} style={{ height, width: '100%', borderRadius: 16 }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showRoutes && Object.values(ROUTES).map((r, i) => (
        <Polyline key={i} positions={r.pts} pathOptions={{ color: '#94a3b8', weight: 2, dashArray: '4 6', opacity: 0.7 }} />
      ))}
      {vehicles.map((v) => {
        const drv = driverFor(v)
        return (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={vehIcon(v)}>
            <Popup>
              <div className="text-sm min-w-[180px]">
                {drv && (
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                    {drv.photo_url
                      ? <img src={drv.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <div className="w-9 h-9 rounded-full bg-teal-600 text-white grid place-items-center text-xs font-bold">{drv.name?.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div>}
                    <div>
                      <div className="font-semibold leading-tight">{drv.name}</div>
                      <a href={`tel:+${drv.phone}`} className="text-xs text-teal-600">+{drv.phone}</a>
                    </div>
                  </div>
                )}
                <div className="font-bold">{v.name ? `${v.name} · ${v.reg}` : v.reg}</div>
                <div className="text-slate-500">{v.make} {v.model} · {v.type}</div>
                <div className="mt-1">Speed: <b>{Math.round(v.speed_kmh)} km/h</b></div>
                <div>Fuel: <b>{Math.round(v.fuel_pct)}%</b></div>
                {drv?.license_expiry && <div className="text-xs text-slate-400 mt-1">Licence exp. {drv.license_expiry}</div>}
              </div>
            </Popup>
          </Marker>
        )
      })}
      {focus && <Recenter center={[focus.lat, focus.lng]} />}
    </MapContainer>
  )
}

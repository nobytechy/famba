// Best-effort reverse geocoding via OpenStreetMap Nominatim (free, no key).
// Cached aggressively to respect the usage policy. Falls back to coords.
const cache = new Map()

export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return ''
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`
  if (cache.has(key)) return cache.get(key)
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, {
      headers: { 'Accept': 'application/json' },
    })
    const j = await r.json()
    const a = j.address || {}
    const parts = [a.road || a.suburb || a.neighbourhood, a.suburb && a.road ? a.suburb : null, a.city || a.town || a.village]
    const label = [...new Set(parts.filter(Boolean))].slice(0, 2).join(', ') || j.display_name?.split(',').slice(0, 2).join(',') || key
    cache.set(key, label)
    return label
  } catch {
    return key
  }
}

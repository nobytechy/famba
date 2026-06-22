// Unified location tracking. On a native Capacitor build it uses background
// geolocation (keeps streaming when the app is minimised or closed); on the web
// it falls back to the browser's watchPosition. Same callback shape either way:
//   onPosition({ latitude, longitude, speed })  // speed in m/s or null
import { Capacitor } from '@capacitor/core'

export const isNative = () => {
  try { return Capacitor.isNativePlatform?.() === true } catch { return false }
}

export async function startTracking(onPosition, onError) {
  if (isNative()) {
    const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation')
    const id = await BackgroundGeolocation.addWatcher({
      backgroundMessage: 'Famba Fleet is tracking your trip.',
      backgroundTitle: 'Trip in progress',
      requestPermissions: true,
      stale: false,
      distanceFilter: 15,
    }, (location, err) => {
      if (err) { onError?.(err); return }
      onPosition({ latitude: location.latitude, longitude: location.longitude, speed: location.speed })
    })
    return { stop: () => BackgroundGeolocation.removeWatcher({ id }).catch(() => {}) }
  }

  // Web fallback
  if (!navigator.geolocation) { onError?.(new Error('No GPS access')); return { stop: () => {} } }
  const wid = navigator.geolocation.watchPosition(
    (p) => onPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude, speed: p.coords.speed }),
    (e) => onError?.(e),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
  )
  return { stop: () => navigator.geolocation.clearWatch(wid) }
}

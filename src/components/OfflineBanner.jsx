import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

// Field robustness: a slim banner when the device drops offline. Data entered
// stays in the app; it syncs to Supabase when the connection returns.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-amber-500 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff size={16} /> You're offline — changes are saved locally and will sync when you reconnect.
    </div>
  )
}

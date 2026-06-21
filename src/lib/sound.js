// Tiny Web-Audio beeper — no audio asset needed. Used for admin alerts.
let ctx
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

export function beep({ freq = 880, duration = 0.18, type = 'sine', gain = 0.06 } = {}) {
  try {
    const a = ac()
    if (a.state === 'suspended') a.resume()
    const o = a.createOscillator(), g = a.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.value = gain
    o.connect(g); g.connect(a.destination)
    o.start()
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + duration)
    o.stop(a.currentTime + duration)
  } catch { /* audio not allowed yet */ }
}

// A more insistent pattern for high-priority escalations.
export function alarm() {
  beep({ freq: 740, duration: 0.22, type: 'square', gain: 0.08 })
  setTimeout(() => beep({ freq: 988, duration: 0.22, type: 'square', gain: 0.08 }), 240)
  setTimeout(() => beep({ freq: 740, duration: 0.3, type: 'square', gain: 0.08 }), 500)
}

export function notify(title, body) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' })
    }
  } catch { /* ignore */ }
}

export function ensureNotifyPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  } catch { /* ignore */ }
}

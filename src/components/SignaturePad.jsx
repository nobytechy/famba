import { useEffect, useRef } from 'react'
import { Eraser } from 'lucide-react'

// Lightweight canvas signature capture. Call getDataUrl() via ref-less pattern:
// parent passes onChange and we emit a data URL on each stroke end.
export default function SignaturePad({ onChange, height = 140 }) {
  const ref = useRef(null)
  const drawing = useRef(false)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    cv.width = cv.offsetWidth * dpr
    cv.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a'

    const pos = (e) => {
      const r = cv.getBoundingClientRect()
      const t = e.touches?.[0]
      return { x: (t ? t.clientX : e.clientX) - r.left, y: (t ? t.clientY : e.clientY) - r.top }
    }
    const down = (e) => { drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault() }
    const move = (e) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault() }
    const up = () => { if (!drawing.current) return; drawing.current = false; onChange?.(cv.toDataURL('image/png')) }

    cv.addEventListener('mousedown', down); cv.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    cv.addEventListener('touchstart', down, { passive: false }); cv.addEventListener('touchmove', move, { passive: false }); cv.addEventListener('touchend', up)
    return () => {
      cv.removeEventListener('mousedown', down); cv.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up)
      cv.removeEventListener('touchstart', down); cv.removeEventListener('touchmove', move); cv.removeEventListener('touchend', up)
    }
  }, [height, onChange])

  const clear = () => {
    const cv = ref.current
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height)
    onChange?.(null)
  }

  return (
    <div>
      <canvas ref={ref} style={{ height, touchAction: 'none' }}
        className="w-full bg-white border border-slate-300 rounded-lg" />
      <button type="button" onClick={clear} className="mt-1 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
        <Eraser size={13} /> Clear signature
      </button>
    </div>
  )
}

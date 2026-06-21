import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BackToTop({ threshold = 400 }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  if (!show) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white
        shadow-lg grid place-items-center btn-press fade-up transition">
      <ChevronUp size={22} />
    </button>
  )
}

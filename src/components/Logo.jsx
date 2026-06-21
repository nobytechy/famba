export default function Logo({ size = 28, light = false }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="12" fill={light ? '#fff' : '#0f766e'} />
        <path d="M9 30c4-1 7-9 12-9s5 8 9 8 8-12 9-12" stroke={light ? '#0f766e' : '#fff'} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="14" cy="33" r="3.4" fill="#f59e0b" stroke={light ? '#0f766e' : '#fff'} strokeWidth="1.6" />
      </svg>
      <div className="leading-tight">
        <div className={`font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          Famba<span className="text-amber-500"> Fleet</span>
        </div>
      </div>
    </div>
  )
}

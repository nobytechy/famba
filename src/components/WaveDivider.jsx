// Soft "feather" wave divider in the primary colour — replaces hard section
// borders on the marketing site. Layered, low-opacity teal for a blended look.
export default function WaveDivider({ flip = false, className = '' }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''} ${className}`} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-[60px] sm:h-[90px]">
        <path d="M0,64 C240,120 480,8 720,48 C960,88 1200,24 1440,64 L1440,120 L0,120 Z" fill="#0f766e" fillOpacity="0.06" />
        <path d="M0,80 C260,30 520,110 780,72 C1020,38 1240,96 1440,72 L1440,120 L0,120 Z" fill="#0f766e" fillOpacity="0.10" />
        <path d="M0,96 C300,60 560,118 820,96 C1080,74 1260,110 1440,92 L1440,120 L0,120 Z" fill="#0f766e" fillOpacity="0.16" />
      </svg>
    </div>
  )
}

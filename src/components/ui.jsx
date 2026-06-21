// Shared UI primitives. Buttons look like buttons (solid/affordance + hover +
// press feedback); badges are flat pills with no hover — so the two never get
// confused for one another.

const VARIANTS = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
  outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm',
  ghostGreen: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100',
}
const SIZES = {
  xs: 'text-xs px-2.5 py-1.5 rounded-md gap-1',
  sm: 'text-sm px-3 py-2 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2',
}

export function Btn({ as = 'button', variant = 'primary', size = 'sm', icon: Icon, className = '', children, ...rest }) {
  const Comp = as
  return (
    <Comp
      className={`inline-flex items-center justify-center font-semibold btn-press transition
        focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...(as === 'button' ? { type: rest.type || 'button' } : {})}
      {...rest}
    >
      {Icon && <Icon size={size === 'xs' ? 14 : 16} />}
      {children}
    </Comp>
  )
}

// Icon-only round button.
export function IconBtn({ icon: Icon, variant = 'subtle', className = '', size = 16, ...rest }) {
  return (
    <button type="button"
      className={`inline-grid place-items-center w-8 h-8 rounded-lg btn-press transition
        focus:outline-none focus:ring-2 focus:ring-teal-300 ${VARIANTS[variant]} ${className}`}
      {...rest}>
      <Icon size={size} />
    </button>
  )
}

const BADGE = {
  rose: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-700',
  teal: 'bg-teal-50 text-teal-700', blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700', slate: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-50 text-purple-700',
}
export function Badge({ tone = 'slate', children, className = '' }) {
  return <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${BADGE[tone]} ${className}`}>{children}</span>
}

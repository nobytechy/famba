import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext'

const HINTS = [
  { label: 'Admin', pin: '1975' },
  { label: 'Operator', pin: '2200' },
  { label: 'Workshop', pin: '3300' },
  { label: 'Driver', pin: '1001' },
]

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [pin, setPin] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const u = login(pin)
    if (u) { toast.success(`Welcome, ${u.name}`); nav(u.role === 'driver' ? '/driver' : '/app') }
    else toast.error('Incorrect or inactive PIN')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-10">
        <Logo light size={34} />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Run your fleet<br />from one screen.</h1>
          <p className="mt-4 text-slate-300 max-w-md">
            Dispatch, live tracking, fuel control and ZINARA / ZIMRA compliance — built for Zimbabwean
            transport operations. No tracking devices to buy.
          </p>
        </div>
        <div className="text-xs text-slate-500">Powered by Noby · nobie.netlify.app</div>
      </div>

      <div className="flex items-center justify-center p-6 bg-slate-50">
        <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4"><ArrowLeft size={14} /> Back to site</Link>
          <div className="lg:hidden mb-6"><Logo size={32} /></div>
          <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Enter your staff PIN. Drivers go straight to their trip portal.</p>
          <input
            autoFocus inputMode="numeric" value={pin} maxLength={6}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • •"
            className="mt-6 w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"
          />
          <button type="submit"
            className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition">
            Sign in
          </button>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {HINTS.map((h) => (
              <button key={h.pin} type="button" onClick={() => setPin(h.pin)}
                className="text-xs border border-slate-200 rounded-lg py-1.5 text-slate-500 hover:bg-slate-50">
                {h.label} <span className="font-mono font-semibold text-slate-700">{h.pin}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}

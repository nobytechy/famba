import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, ShieldCheck, Fuel, Send, Smartphone, BarChart3, MessageCircle,
  Mail, Phone, ArrowRight, CheckCircle2, Container, Recycle, TrendingUp, Warehouse,
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import WaveDivider from '../components/WaveDivider.jsx'
import BackToTop from '../components/BackToTop.jsx'
import Reveal from '../components/Reveal.jsx'

const FEATURES = [
  { icon: MapPin, title: 'Live tracking — no hardware', text: "Each driver's phone becomes the tracker. See every vehicle move on one map in real time." },
  { icon: Send, title: 'Dispatch & scheduling', text: 'Assign vehicles and drivers, plan routes and push jobs through to delivery.' },
  { icon: Fuel, title: 'Fuel control', text: 'Every fill checked against healthy km/litre — theft and faults flagged automatically.' },
  { icon: ShieldCheck, title: 'ZINARA / ZIMRA compliance', text: 'Licences, permits, insurance and fitness tracked with automatic expiry alerts.' },
  { icon: Smartphone, title: 'Driver app + SOS', text: 'Drivers log in, run trips, report faults and raise emergency SOS to staff or police.' },
  { icon: BarChart3, title: 'Reports & AI insights', text: 'Automatic summaries plus a plain-English cost-benefit case for management.' },
]

export default function Landing() {
  const [form, setForm] = useState({ name: '', company: '', message: '' })
  const WHATSAPP = '263774603865'

  const send = (e) => {
    e.preventDefault()
    const text = encodeURIComponent(`Famba Fleet enquiry\nName: ${form.name}\nCompany: ${form.company}\n\n${form.message}`)
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm">
            <a href="#features" className="hidden sm:inline text-slate-600 hover:text-teal-700">Features</a>
            <a href="#waste" className="hidden sm:inline text-slate-600 hover:text-teal-700">Skip hire</a>
            <a href="#how" className="hidden sm:inline text-slate-600 hover:text-teal-700">How it works</a>
            <a href="#contact" className="hidden sm:inline text-slate-600 hover:text-teal-700">Contact</a>
            <Link to="/login" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg btn-press shadow-sm">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-slate-900 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="fade-up">
            <span className="inline-block bg-white/10 text-teal-200 text-xs font-semibold px-3 py-1 rounded-full">Built for Zimbabwean fleets</span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">Run your transport operation from one screen.</h1>
            <p className="mt-5 text-slate-300 text-lg max-w-xl">
              Dispatch, live vehicle tracking, fuel control and ZINARA / ZIMRA compliance —
              with <b className="text-white">no tracking devices to buy.</b> Every driver's phone is the tracker.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl btn-press flex items-center gap-2">
                Try the live demo <ArrowRight size={18} />
              </Link>
              <a href="#contact" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl btn-press">Book a walkthrough</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              {['No hardware', 'Works on basic phones', 'WhatsApp updates'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-teal-300" /> {t}</span>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="rounded-xl overflow-hidden bg-slate-800 aspect-[4/3] grid place-items-center">
              <div className="text-center p-8">
                <MapPin size={48} className="mx-auto text-teal-300 live-dot" />
                <p className="mt-3 text-slate-300 text-sm">Live fleet map · 5 vehicles moving across Harare</p>
                <Link to="/login" className="mt-4 inline-block text-amber-300 font-semibold text-sm hover:underline">Open the dashboard →</Link>
              </div>
            </div>
          </div>
        </div>
        {/* feather wave out of the hero */}
        <div className="absolute bottom-0 inset-x-0 leading-[0] overflow-hidden">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-[70px] sm:h-[110px]">
            <path d="M0,64 C240,120 480,8 720,48 C960,88 1200,24 1440,64 L1440,120 L0,120 Z" fill="#ffffff" fillOpacity="0.10" />
            <path d="M0,80 C260,30 520,110 780,72 C1020,38 1240,96 1440,72 L1440,120 L0,120 Z" fill="#ffffff" fillOpacity="0.30" />
            <path d="M0,96 C300,60 560,118 820,96 C1080,74 1260,110 1440,92 L1440,120 L0,120 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="blend-soft">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900">Everything a transport operator does — in software</h2>
              <p className="mt-3 text-slate-500">Coordinating, dispatching, monitoring fuel, staying compliant, managing drivers and reporting. One system, mobile-first.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90}>
                <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm ring-1 ring-teal-900/5 hover:ring-teal-600/20 transition h-full">
                  <div className="w-11 h-11 rounded-xl bg-teal-600 text-white grid place-items-center"><f.icon size={22} /></div>
                  <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Waste / skip-hire vertical */}
      <section id="waste" className="bg-gradient-to-br from-slate-900 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-teal-200 text-xs font-semibold px-3 py-1 rounded-full">
                <Recycle size={14} /> Waste &amp; skip hire
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight">Hiring out skips? Track the container, not just the truck.</h2>
              <p className="mt-4 text-slate-300">
                A skip earns money while it sits at a customer site — and quietly loses it when it overstays or sits idle in
                the yard. Famba tracks every skip through its lifecycle and turns those movements into revenue you can bill.
              </p>
              <div className="mt-7 space-y-4">
                {[
                  [Container, 'Full lifecycle tracking', 'Every skip followed from yard → site → landfill → back, with live status and days-on-site.'],
                  [TrendingUp, 'Demurrage you can recover', 'Skips past their free rental period are flagged automatically — bill the extra days you were missing.'],
                  [Warehouse, 'Lift utilisation', 'See idle skips sitting in the yard earning nothing and push them out to lift fleet utilisation.'],
                  [BarChart3, 'AI revenue insight', 'One tap turns skip movements into a plain-English case: demurrage to recover and smarter collection runs.'],
                ].map(([Icon, t, d], i) => (
                  <div key={t} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center shrink-0"><Icon size={18} className="text-teal-300" /></div>
                    <div><div className="font-semibold">{t}</div><div className="text-sm text-slate-300">{d}</div></div>
                  </div>
                ))}
              </div>
              <Link to="/login" className="mt-8 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl btn-press">
                See the Skips board <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="text-xs text-teal-200 uppercase tracking-wide">Demurrage to recover this month</div>
              <div className="text-4xl font-extrabold mt-1">$1,240</div>
              <div className="mt-5 space-y-2">
                {[
                  ['SKP-06 · 14 m³', 'Workington factory', '+$84', true],
                  ['SKP-01 · 6 m³', 'Borrowdale build', '+$48', true],
                  ['SKP-03 · 12 m³', 'Graniteside depot', '2 free days left', false],
                  ['SKP-04 · 8 m³', 'In yard — available', 'idle', false],
                ].map(([code, site, val, flag]) => (
                  <div key={code} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <Container size={16} className={flag ? 'text-rose-300' : 'text-slate-400'} />
                    <div className="min-w-0"><div className="text-sm font-medium truncate">{code}</div><div className="text-[11px] text-slate-400 truncate">{site}</div></div>
                    <span className={`ml-auto text-xs font-semibold ${flag ? 'text-rose-300' : 'text-slate-400'}`}>{val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[11px] text-slate-400">Illustrative — live figures come from your own skips.</div>
            </div>
          </Reveal>
        </div>
      </section>

      <WaveDivider />

      {/* How it works */}
      <section id="how" className="blend-bottom">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <Reveal><h2 className="text-3xl font-bold text-slate-900 text-center">Up and running in a day</h2></Reveal>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              ['1', 'Add your fleet', 'Capture vehicles, drivers and documents. No installers, no devices.'],
              ['2', 'Drivers sign in', 'Each driver opens the app on their phone and taps Start Trip — tracking begins.'],
              ['3', 'You stay in control', 'Watch the map, get expiry and fault alerts, send WhatsApp updates to clients.'],
            ].map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 110}>
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-teal-900/5 p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white grid place-items-center font-bold">{n}</div>
                  <h3 className="mt-4 font-bold text-slate-900">{t}</h3>
                  <p className="mt-2 text-sm text-slate-500">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider flip />

      {/* Contact */}
      <section id="contact" className="blend-soft">
        <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-2 gap-12">
          <Reveal>
            <h2 className="text-3xl font-bold text-slate-900">Talk to us</h2>
            <p className="mt-3 text-slate-500">Tell us about your fleet and we'll set up a live walkthrough on your own vehicles — at no cost.</p>
            <div className="mt-8 space-y-4">
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-700 hover:text-teal-700">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><MessageCircle size={20} /></span>
                WhatsApp · +263 774 603 865
              </a>
              <a href="tel:+263774603865" className="flex items-center gap-3 text-slate-700 hover:text-teal-700">
                <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center"><Phone size={20} /></span>
                +263 774 603 865
              </a>
              <a href="mailto:nobytechy@gmail.com" className="flex items-center gap-3 text-slate-700 hover:text-teal-700">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><Mail size={20} /></span>
                nobytechy@gmail.com
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
          <form onSubmit={send} className="bg-white rounded-2xl shadow-sm ring-1 ring-teal-900/5 p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Your name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Company / fleet</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Message</label>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none" />
            </div>
            <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl btn-press flex items-center justify-center gap-2">
              <MessageCircle size={18} /> Send via WhatsApp
            </button>
          </form>
          </Reveal>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo light />
          <div>Powered by <a href="https://nobie.netlify.app" className="text-teal-300 hover:underline" target="_blank" rel="noreferrer">Noby</a> · © {new Date().getFullYear()} Famba Fleet</div>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}

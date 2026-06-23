import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Container, Plus, MapPin, Truck, PackageOpen, Warehouse, AlertTriangle,
  Sparkles, TrendingUp, Loader2, X, ArrowRightLeft, CheckCircle2,
} from 'lucide-react'
import { useStore, skipInsights } from '../lib/store.jsx'
import { SKIP_SIZES } from '../lib/seed'
import { API_BASE } from '../lib/supabase'
import { Btn, Badge } from '../components/ui.jsx'
import StatCard from '../components/StatCard.jsx'

const STATUS_TONE = { 'In Yard': 'slate', Deployed: 'teal', Full: 'amber', 'In Transit': 'blue' }

export default function Skips() {
  const s = useStore()
  const rows = skipInsights(s.skips || [])
  const [deployFor, setDeployFor] = useState(null)
  const [adding, setAdding] = useState(false)

  const inYard = rows.filter((r) => r.status === 'In Yard').length
  const onSite = rows.filter((r) => r.status !== 'In Yard').length
  const overdue = rows.filter((r) => r.flagged)
  const atRisk = overdue.reduce((a, r) => a + r.demurrage, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skips</h1>
          <p className="text-slate-500 text-sm">Every container tracked from yard to site to landfill — with the rental days you're owed flagged automatically.</p>
        </div>
        <Btn size="md" variant="primary" icon={Plus} onClick={() => setAdding(true)}>Add skip</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Container} tone="slate" label="Total skips" value={rows.length} />
        <StatCard icon={Warehouse} tone="teal" label="Available in yard" value={inYard} />
        <StatCard icon={MapPin} tone="blue" label="Out on site" value={onSite} />
        <StatCard icon={AlertTriangle} tone={atRisk ? 'rose' : 'slate'} label="Demurrage to recover"
          value={`$${atRisk.toLocaleString()}`} sub={`${overdue.length} skip(s) over rental`} />
      </div>

      <SkipInsight rows={rows} atRisk={atRisk} overdue={overdue} inYard={inYard} />

      <div className="space-y-3">
        {rows.map((sk) => (
          <div key={sk.id} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl grid place-items-center ${sk.flagged ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                <Container size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  {sk.code} <span className="text-slate-400 font-normal">· {sk.size}</span>
                  <Badge tone={STATUS_TONE[sk.status]}>{sk.status}</Badge>
                  {sk.flagged && <Badge tone="rose">Over rental</Badge>}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {sk.status === 'In Yard'
                    ? 'In the yard — available to deploy'
                    : <><MapPin size={11} className="inline -mt-0.5" /> {sk.client} · {sk.site}</>}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4">
                {sk.status !== 'In Yard' && (
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-slate-400">{sk.dwell} day{sk.dwell === 1 ? '' : 's'} on site</div>
                    <div className={`text-xs font-semibold ${sk.flagged ? 'text-rose-600' : 'text-teal-600'}`}>
                      {sk.flagged ? `+$${sk.demurrage} demurrage` : `${sk.free_days - sk.dwell} free day(s) left`}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {sk.status === 'In Yard' && (
                    <Btn size="sm" variant="primary" icon={Truck} onClick={() => setDeployFor(sk)}>Deploy</Btn>
                  )}
                  {sk.status === 'Deployed' && (
                    <Btn size="sm" variant="subtle" icon={PackageOpen} onClick={() => { s.markSkipFull(sk.id); toast.success(`${sk.code} marked full`) }}>Mark full</Btn>
                  )}
                  {sk.status !== 'In Yard' && (
                    <Btn size="sm" variant="success" icon={CheckCircle2} onClick={() => { s.collectSkip(sk.id); toast.success(`${sk.code} collected — back in yard`) }}>Collect</Btn>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-slate-400 py-10 text-center">No skips yet — add your first container.</div>}
      </div>

      {deployFor && <DeployModal skip={deployFor} onClose={() => setDeployFor(null)}
        onDeploy={(payload) => { s.deploySkip(deployFor.id, payload); toast.success(`${deployFor.code} deployed to ${payload.client}`); setDeployFor(null) }} />}
      {adding && <AddModal onClose={() => setAdding(false)}
        onAdd={(skip) => { s.addSkip(skip); toast.success(`${skip.code} added to the yard`); setAdding(false) }} />}
    </div>
  )
}

// --- AI / smart insight ------------------------------------------------------
function SkipInsight({ rows, atRisk, overdue, inYard }) {
  const [insight, setInsight] = useState(null)
  const [busy, setBusy] = useState(false)

  const summary = {
    total_skips: rows.length,
    in_yard: inYard,
    on_site: rows.length - inYard,
    overdue_skips: overdue.length,
    demurrage_at_risk_usd: atRisk,
    idle_ratio: rows.length ? Math.round((inYard / rows.length) * 100) : 0,
  }

  const localInsight = () => ({
    narrative:
      `Of ${summary.total_skips} skips, ${summary.overdue_skips} are sitting past their free rental period — ` +
      `that's $${atRisk.toLocaleString()} in demurrage you can bill today. Meanwhile ${inYard} skip(s) are idle in the yard ` +
      `(${summary.idle_ratio}% of the fleet) earning nothing; pushing those out is the fastest way to lift utilisation.`,
    savings_usd: atRisk * 4,
    actions: [
      overdue.length ? `Invoice demurrage on ${overdue.map((r) => r.code).slice(0, 3).join(', ')}${overdue.length > 3 ? '…' : ''} before collection.` : 'No skips over rental — billing is current.',
      inYard ? `Deploy ${inYard} idle skip(s) to lift utilisation above 80%.` : 'Yard is empty — every skip is earning.',
      'Schedule collections by site cluster to cut truck fuel and turnaround time.',
    ],
    source: 'local',
  })

  const generate = async () => {
    setBusy(true)
    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/skips-insight`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(summary),
        })
        if (res.ok) { const d = await res.json(); setInsight({ ...d, source: d.source || 'ai' }); setBusy(false); return }
      }
      setInsight(localInsight())
    } catch { setInsight(localInsight()) } finally { setBusy(false) }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white rounded-2xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Skip revenue insight</h2>
        <button onClick={generate} disabled={busy}
          className="bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
          {busy ? 'Analysing…' : insight ? 'Regenerate' : 'Generate insight'}
        </button>
      </div>
      {!insight && !busy && (
        <p className="text-slate-300 text-sm mt-3 max-w-2xl">
          Turn skip movements into money — demurrage you can recover, idle containers to redeploy, and smarter collection runs.
        </p>
      )}
      {insight && (
        <div className="mt-4 space-y-4">
          <p className="text-slate-100 leading-relaxed max-w-3xl">{insight.narrative}</p>
          <div className="bg-white/10 rounded-xl p-4 inline-block">
            <div className="text-xs text-teal-200 uppercase tracking-wide">Estimated annual value protected</div>
            <div className="text-3xl font-bold mt-1">${(insight.savings_usd || 0).toLocaleString()}</div>
          </div>
          <ul className="space-y-1.5">
            {insight.actions?.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-100"><span className="text-amber-300 mt-0.5">▸</span>{a}</li>
            ))}
          </ul>
          <div className="text-[11px] text-slate-400">
            {insight.source === 'ai' ? 'Generated by the Famba AI insights service (FastAPI + Gemini).' : 'Generated locally — connect the insights API for AI-written narratives.'}
          </div>
        </div>
      )}
    </div>
  )
}

// --- modals ------------------------------------------------------------------
function Shell({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><Icon size={18} className="text-teal-600" /> {title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs font-medium text-slate-500">{label}</span>{children}</label>
}
const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300'

function DeployModal({ skip, onClose, onDeploy }) {
  const [f, setF] = useState({ client: '', site: '', daily_rate: skip.daily_rate, free_days: skip.free_days })
  const submit = (e) => {
    e.preventDefault()
    if (!f.client.trim() || !f.site.trim()) return toast.error('Client and site are required')
    onDeploy(f)
  }
  return (
    <Shell title={`Deploy ${skip.code}`} icon={ArrowRightLeft} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Client"><input className={inputCls} value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} placeholder="e.g. Halsted Builders" /></Field>
        <Field label="Site / address"><input className={inputCls} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} placeholder="e.g. Borrowdale — Pomona build" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily rate ($)"><input type="number" min="0" className={inputCls} value={f.daily_rate} onChange={(e) => setF({ ...f, daily_rate: e.target.value })} /></Field>
          <Field label="Free rental days"><input type="number" min="0" className={inputCls} value={f.free_days} onChange={(e) => setF({ ...f, free_days: e.target.value })} /></Field>
        </div>
        <p className="text-[11px] text-slate-400">After the free days, each extra day on site is billed at the daily rate (demurrage).</p>
        <Btn as="button" type="submit" size="md" variant="primary" icon={Truck} className="w-full">Deploy to site</Btn>
      </form>
    </Shell>
  )
}

function AddModal({ onClose, onAdd }) {
  const [f, setF] = useState({ code: '', size: SKIP_SIZES[0], daily_rate: 8, free_days: 3 })
  const submit = (e) => {
    e.preventDefault()
    if (!f.code.trim()) return toast.error('Skip number is required')
    onAdd({ ...f, daily_rate: Number(f.daily_rate) || 0, free_days: Number(f.free_days) || 0 })
  }
  return (
    <Shell title="Add skip" icon={Container} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Skip number"><input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="e.g. SKP-10" /></Field>
        <Field label="Size">
          <select className={inputCls} value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })}>
            {SKIP_SIZES.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily rate ($)"><input type="number" min="0" className={inputCls} value={f.daily_rate} onChange={(e) => setF({ ...f, daily_rate: e.target.value })} /></Field>
          <Field label="Free rental days"><input type="number" min="0" className={inputCls} value={f.free_days} onChange={(e) => setF({ ...f, free_days: e.target.value })} /></Field>
        </div>
        <Btn as="button" type="submit" size="md" variant="primary" icon={Plus} className="w-full">Add to yard</Btn>
      </form>
    </Shell>
  )
}

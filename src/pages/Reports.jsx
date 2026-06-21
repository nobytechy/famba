import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Sparkles, TrendingUp, Loader2 } from 'lucide-react'
import { useStore, complianceAlerts, fuelAnomalies, maintenanceDue } from '../lib/store.jsx'
import { API_BASE } from '../lib/supabase'
import { printDocument } from '../lib/pdf'
import { Btn } from '../components/ui.jsx'

export default function Reports() {
  const s = useStore()
  const [insight, setInsight] = useState(null)
  const [busy, setBusy] = useState(false)

  const alerts = complianceAlerts(s.compliance)
  const anomalies = fuelAnomalies(s.fuel_logs, s.vehicles)
  const due = maintenanceDue(s.maintenance, s.vehicles).filter((m) => m.due)
  const fuelSpend = s.fuel_logs.reduce((a, b) => a + (b.cost_usd || 0), 0)
  const delivered = s.jobs.filter((j) => j.status === 'Delivered').length

  const summary = {
    vehicles: s.vehicles.length,
    active_jobs: s.jobs.filter((j) => j.status !== 'Delivered').length,
    delivered,
    fuel_spend_usd: Math.round(fuelSpend),
    fuel_flags: anomalies.length,
    compliance_expired: alerts.filter((a) => a.level === 'expired').length,
    compliance_critical: alerts.filter((a) => a.level === 'critical').length,
    service_due: due.length,
  }

  const exportCsv = () => {
    const rows = [['Metric', 'Value'], ...Object.entries(summary)]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `famba-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    toast.success('Report exported')
  }

  const exportPdf = () => {
    const rows = Object.entries(summary).map(([k, v]) => `<tr><td>${k.replace(/_/g, ' ')}</td><td class="right">${v}</td></tr>`).join('')
    printDocument('Fleet report', `<h1>Fleet operations report</h1>
      <table><thead><tr><th>Metric</th><th class="right">Value</th></tr></thead><tbody>${rows}</tbody></table>`)
  }

  const localInsight = () => {
    const fines = summary.compliance_expired * 700 + summary.compliance_critical * 200
    const fuelLeak = anomalies.reduce((a, f) => a + (f.expected - f.kmpl) / f.expected * 90, 0)
    return {
      narrative:
        `Across ${summary.vehicles} vehicles, Famba Fleet is currently surfacing ${summary.compliance_expired} expired and ` +
        `${summary.compliance_critical} near-expiry documents, ${summary.fuel_flags} fuel anomalies and ${summary.service_due} services due. ` +
        `Acting on these now avoids an estimated $${Math.round(fines)} in ZINARA/ZIMRA fines and roughly $${Math.round(fuelLeak)} ` +
        `per month of fuel leakage, while overdue servicing is the single biggest driver of unplanned breakdowns.`,
      savings_usd: Math.round(fines + fuelLeak * 12),
      actions: [
        summary.compliance_expired > 0 ? `Renew ${summary.compliance_expired} expired document(s) before those vehicles run again.` : 'All documents valid — keep the alert window at 30 days.',
        summary.fuel_flags > 0 ? `Investigate ${summary.fuel_flags} flagged refuel(s) for siphoning or engine faults.` : 'Fuel efficiency within normal range.',
        summary.service_due > 0 ? `Schedule ${summary.service_due} service(s) now to prevent roadside breakdowns.` : 'No services overdue.',
      ],
      source: 'local',
    }
  }

  const generate = async () => {
    setBusy(true)
    try {
      if (API_BASE) {
        const res = await fetch(`${API_BASE}/api/insights`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(summary),
        })
        if (res.ok) { const d = await res.json(); setInsight({ ...d, source: 'ai' }); setBusy(false); return }
      }
      setInsight(localInsight())
    } catch {
      setInsight(localInsight())
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & insights</h1>
          <p className="text-slate-500 text-sm">The numbers your managers and clients ask for — and what they mean for the bottom line.</p>
        </div>
        <div className="flex gap-2">
          <Btn size="md" variant="outline" icon={Download} onClick={exportCsv}>CSV</Btn>
          <Btn size="md" variant="outline" onClick={exportPdf}>PDF</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric label="Vehicles" value={summary.vehicles} />
        <Metric label="Jobs delivered" value={summary.delivered} />
        <Metric label="Fuel spend" value={`$${summary.fuel_spend_usd.toLocaleString()}`} />
        <Metric label="Open alerts" value={summary.compliance_expired + summary.compliance_critical + summary.fuel_flags + summary.service_due} tone="text-rose-600" />
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold flex items-center gap-2"><Sparkles size={18} className="text-amber-300" /> Cost-benefit insight</h2>
          <button onClick={generate} disabled={busy}
            className="bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
            {busy ? 'Analysing…' : insight ? 'Regenerate' : 'Generate insight'}
          </button>
        </div>

        {!insight && !busy && (
          <p className="text-slate-300 text-sm mt-3 max-w-2xl">
            Turn the fleet's raw status into a plain-English business case — estimated fines avoided, fuel leakage and the actions that matter most this week.
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
                <li key={i} className="flex items-start gap-2 text-sm text-slate-100">
                  <span className="text-amber-300 mt-0.5">▸</span>{a}
                </li>
              ))}
            </ul>
            <div className="text-[11px] text-slate-400">
              {insight.source === 'ai' ? 'Generated by the Famba AI insights service (FastAPI + Gemini).' : 'Generated locally — connect the insights API for AI-written narratives.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  )
}

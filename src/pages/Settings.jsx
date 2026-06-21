import { useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, Palette } from 'lucide-react'
import { getCompany, saveCompany } from '../lib/config'
import { Btn } from '../components/ui.jsx'

// White-label settings: rebrand for each transport client, then redeploy.
export default function Settings() {
  const [c, setC] = useState(getCompany())

  const save = () => { saveCompany(c); toast.success('Company settings saved'); }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Rebrand Famba Fleet for this client — the name and contacts appear on invoices, quotes and reports.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Building2 size={18} className="text-teal-600" /> Company</h3>
        <Field label="Company name"><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className="inp" /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Email"><input value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} className="inp" /></Field>
          <Field label="Phone"><input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} className="inp" /></Field>
        </div>
        <Field label="Currency"><input value={c.currency} onChange={(e) => setC({ ...c, currency: e.target.value })} className="inp w-28" /></Field>
        <Btn size="md" variant="primary" onClick={save}>Save settings</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-2"><Palette size={18} className="text-teal-600" /> Branding</h3>
        <p className="text-sm text-slate-500">This build is single-tenant by design — clone the repo per client, set the company details here, swap the logo/colours in <code className="text-xs bg-slate-100 px-1 rounded">src/components/Logo.jsx</code> &amp; <code className="text-xs bg-slate-100 px-1 rounded">index.css</code>, then deploy. See <code className="text-xs bg-slate-100 px-1 rounded">INTEGRATIONS.md</code> for SMS / WhatsApp / push keys.</p>
      </div>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem}`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span><div className="mt-1">{children}</div></label>
}

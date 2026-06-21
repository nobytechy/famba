import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Wallet, Car, Building2, X } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { useAuth } from '../context/AuthContext'
import { GENERAL_EXPENSE_CATEGORIES, VEHICLE_EXPENSE_CATEGORIES } from '../lib/seed'
import { Btn } from '../components/ui.jsx'

const fmtDateTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Expenses() {
  const s = useStore()
  const [open, setOpen] = useState(false)

  const expenses = [...(s.expenses || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const total = expenses.reduce((a, b) => a + (+b.amount_usd || 0), 0)
  const vehicleTotal = expenses.filter((e) => e.kind === 'Vehicle').reduce((a, b) => a + (+b.amount_usd || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 text-sm">Record general or vehicle-related costs. Vehicle expenses appear in each vehicle's history.</p>
        </div>
        <Btn size="md" variant="primary" icon={Plus} onClick={() => setOpen(true)}>Record expense</Btn>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Wallet} label="Total recorded" value={`$${total.toLocaleString()}`} tone="bg-slate-100 text-slate-700" />
        <Stat icon={Car} label="Vehicle costs" value={`$${vehicleTotal.toLocaleString()}`} tone="bg-teal-50 text-teal-700" />
        <Stat icon={Building2} label="General costs" value={`$${(total - vehicleTotal).toLocaleString()}`} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Date & time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">By</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((ex) => (
              <tr key={ex.id}>
                <td className="px-4 py-3 text-slate-500">{fmtDateTime(ex.created_at)}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ex.kind === 'Vehicle' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>{ex.kind}</span></td>
                <td className="px-4 py-3"><div className="text-slate-700">{ex.category}</div>{ex.note && <div className="text-xs text-slate-400">{ex.note}</div>}</td>
                <td className="px-4 py-3 text-slate-500">{ex.vehicle_reg || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{ex.recorded_by}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">${(+ex.amount_usd).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <ExpenseModal onClose={() => setOpen(false)} />}
    </div>
  )
}

function ExpenseModal({ onClose }) {
  const s = useStore()
  const { user } = useAuth()
  const [form, setForm] = useState({ kind: 'General', category: GENERAL_EXPENSE_CATEGORIES[0], vehicle_id: '', amount_usd: '', note: '' })
  const cats = form.kind === 'Vehicle' ? VEHICLE_EXPENSE_CATEGORIES : GENERAL_EXPENSE_CATEGORIES

  const setKind = (kind) => setForm({
    ...form, kind,
    category: (kind === 'Vehicle' ? VEHICLE_EXPENSE_CATEGORIES : GENERAL_EXPENSE_CATEGORIES)[0],
    vehicle_id: kind === 'Vehicle' ? (s.vehicles[0]?.id || '') : '',
  })

  const submit = (e) => {
    e.preventDefault()
    if (!form.amount_usd || +form.amount_usd <= 0) return toast.error('Enter an amount')
    if (form.kind === 'Vehicle' && !form.vehicle_id) return toast.error('Select the vehicle')
    s.addExpense({
      kind: form.kind, category: form.category,
      vehicle_id: form.kind === 'Vehicle' ? form.vehicle_id : null,
      amount_usd: +form.amount_usd, note: form.note, recorded_by: user?.name || 'Staff',
    })
    toast.success('Expense recorded')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><Wallet size={18} className="text-teal-600" /> Record expense</h3>
          <button type="button" onClick={onClose} className="text-slate-400"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['General', 'Vehicle'].map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)}
              className={`py-2 rounded-lg text-sm font-medium border btn-press ${form.kind === k ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-300 text-slate-600'}`}>
              {k}
            </button>
          ))}
        </div>
        <Field label="Category">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="inp">
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        {form.kind === 'Vehicle' && (
          <Field label="Vehicle (required for vehicle expenses)">
            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className="inp">
              <option value="">Select vehicle…</option>
              {s.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.reg}</option>)}
            </select>
          </Field>
        )}
        <Field label="Amount (USD)">
          <input type="number" step="0.01" value={form.amount_usd} onChange={(e) => setForm({ ...form, amount_usd: e.target.value })} className="inp" />
        </Field>
        <Field label="Note (optional)">
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="inp" />
        </Field>
        <Btn as="button" type="submit" size="md" variant="primary" className="w-full">Save expense</Btn>
        <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem}`}</style>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return <label className="block"><span className="text-xs font-medium text-slate-600">{label}</span><div className="mt-1">{children}</div></label>
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${tone}`}><Icon size={20} /></div>
      <div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}

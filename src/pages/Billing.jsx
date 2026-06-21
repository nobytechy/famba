import { useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Plus, Printer, X, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { Btn, Badge } from '../components/ui.jsx'
import { printDocument } from '../lib/pdf'

const statusTone = { Draft: 'slate', Sent: 'blue', Paid: 'emerald', Accepted: 'emerald' }

export default function Billing() {
  const s = useStore()
  const [creating, setCreating] = useState(false)

  const docs = [...(s.invoices || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const outstanding = docs.filter((d) => d.type === 'Invoice' && d.status !== 'Paid').reduce((a, b) => a + (+b.total || 0), 0)
  const paid = docs.filter((d) => d.status === 'Paid').reduce((a, b) => a + (+b.total || 0), 0)

  const print = (d) => {
    const rows = (d.items || []).map((it) => `<tr><td>${it.desc}</td><td class="right">${it.qty}</td><td class="right">$${(+it.price).toFixed(2)}</td><td class="right">$${(it.qty * it.price).toFixed(2)}</td></tr>`).join('')
    printDocument(`${d.type} ${d.ref}`, `<h1>${d.type} ${d.ref}</h1>
      <p class="muted">To: <b>${d.client}</b> · ${new Date(d.created_at).toLocaleDateString()} · Status: ${d.status}</p>
      <table><thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="right total" style="margin-top:14px">Total: $${(+d.total).toFixed(2)}</p>`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-500 text-sm">Quotes and invoices for your clients. Print or save any document as PDF.</p>
        </div>
        <Btn size="md" variant="primary" icon={Plus} onClick={() => setCreating(true)}>New document</Btn>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-2xl font-bold text-amber-600">${outstanding.toLocaleString()}</div><div className="text-sm text-slate-500">Outstanding invoices</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-2xl font-bold text-emerald-600">${paid.toLocaleString()}</div><div className="text-sm text-slate-500">Paid</div></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-3 font-medium">Ref</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium text-right">Total</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-semibold text-slate-800">{d.ref}</td>
                <td className="px-4 py-3"><Badge tone={d.type === 'Quote' ? 'purple' : 'teal'}>{d.type}</Badge></td>
                <td className="px-4 py-3 text-slate-600">{d.client}</td>
                <td className="px-4 py-3 text-right font-semibold">${(+d.total).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <select value={d.status} onChange={(e) => s.setInvoiceStatus(d.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1">
                    {(d.type === 'Quote' ? ['Draft', 'Sent', 'Accepted'] : ['Draft', 'Sent', 'Paid']).map((o) => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right"><Btn size="xs" variant="subtle" icon={Printer} onClick={() => print(d)}>PDF</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} clients={s.clients} onSave={(doc) => { s.addInvoice(doc); toast.success(`${doc.type} created`); setCreating(false) }} />}
    </div>
  )
}

function CreateModal({ onClose, onSave, clients }) {
  const [type, setType] = useState('Invoice')
  const [client, setClient] = useState(clients?.[0]?.name || '')
  const [items, setItems] = useState([{ desc: '', qty: 1, price: '' }])
  const set = (i, p) => setItems((xs) => xs.map((x, j) => j === i ? { ...x, ...p } : x))
  const total = items.reduce((a, b) => a + (+b.qty || 0) * (+b.price || 0), 0)

  const submit = (e) => {
    e.preventDefault()
    const clean = items.filter((it) => it.desc && it.price).map((it) => ({ desc: it.desc, qty: +it.qty || 1, price: +it.price }))
    if (!client || !clean.length) return toast.error('Add a client and at least one line')
    onSave({ type, client, items: clean })
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900 flex items-center gap-2"><FileText size={18} className="text-teal-600" /> New document</h3><button type="button" onClick={onClose} className="text-slate-400"><X size={20} /></button></div>
        <div className="grid grid-cols-2 gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm"><option>Invoice</option><option>Quote</option></select>
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" list="cl" />
          <datalist id="cl">{clients?.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input value={it.desc} onChange={(e) => set(i, { desc: e.target.value })} placeholder="Description" className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
              <input type="number" value={it.qty} onChange={(e) => set(i, { qty: e.target.value })} className="w-14 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
              <input type="number" value={it.price} onChange={(e) => set(i, { price: e.target.value })} placeholder="$" className="w-20 border border-slate-300 rounded-lg px-2 py-2 text-sm" />
              {items.length > 1 && <button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} className="text-rose-500"><Trash2 size={16} /></button>}
            </div>
          ))}
          <Btn as="button" type="button" size="xs" variant="subtle" icon={Plus} onClick={() => setItems((xs) => [...xs, { desc: '', qty: 1, price: '' }])}>Add line</Btn>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-sm text-slate-500">Total</span><span className="text-lg font-bold">${total.toFixed(2)}</span>
        </div>
        <Btn as="button" type="submit" size="md" variant="primary" className="w-full">Create {type}</Btn>
      </form>
    </div>
  )
}

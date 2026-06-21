import { useState } from 'react'
import toast from 'react-hot-toast'
import { UserPlus, Power, X } from 'lucide-react'
import { useStore } from '../lib/store.jsx'
import { ROLES, ROLE_LABEL } from '../lib/seed'
import { Btn } from '../components/ui.jsx'

const roleBadge = {
  admin: 'bg-purple-50 text-purple-700',
  operator: 'bg-blue-50 text-blue-700',
  driver: 'bg-teal-50 text-teal-700',
  staff: 'bg-amber-50 text-amber-700',
}

export default function Staff() {
  const s = useStore()
  const [editing, setEditing] = useState(null) // staff object or {} for new

  const blank = { name: '', role: 'operator', pin: '', phone: '', driver_id: null }

  const save = (e) => {
    e.preventDefault()
    if (!editing.name || !editing.pin) return toast.error('Name and PIN are required')
    if ((s.staff || []).some((m) => m.pin === editing.pin && m.id !== editing.id))
      return toast.error('That PIN is already in use')
    s.saveStaff(editing)
    toast.success(editing.id ? 'Staff updated' : 'Staff member added')
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & access</h1>
          <p className="text-slate-500 text-sm">Create logins for admins, operators, drivers and workshop staff. Each role sees only what it needs.</p>
        </div>
        <Btn size="md" variant="primary" icon={UserPlus} onClick={() => setEditing({ ...blank })}>Add staff</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">PIN</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(s.staff || []).map((m) => (
              <tr key={m.id} className={m.active === false ? 'opacity-50' : ''}>
                <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge[m.role]}`}>{ROLE_LABEL[m.role]}</span></td>
                <td className="px-4 py-3 text-slate-500">+{m.phone}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{m.pin}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${m.active === false ? 'text-slate-400' : 'text-emerald-600'}`}>
                    {m.active === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Btn size="xs" variant="subtle" onClick={() => setEditing({ ...m })}>Edit</Btn>
                    <Btn size="xs" variant="subtle" icon={Power} onClick={() => s.toggleStaff(m.id)} title="Activate / deactivate">
                      {m.active === false ? 'Enable' : 'Disable'}
                    </Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save}
            className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{editing.id ? 'Edit staff' : 'Add staff'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400"><X size={20} /></button>
            </div>
            <Field label="Full name">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </Field>
              <Field label="PIN">
                <input inputMode="numeric" maxLength={6} value={editing.pin}
                  onChange={(e) => setEditing({ ...editing, pin: e.target.value.replace(/\D/g, '') })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono" />
              </Field>
            </div>
            <Field label="Phone (WhatsApp)">
              <input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="2637..." className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            </Field>
            {editing.role === 'driver' && (
              <Field label="Linked driver record">
                <select value={editing.driver_id || ''} onChange={(e) => setEditing({ ...editing, driver_id: e.target.value || null })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2">
                  <option value="">— none —</option>
                  {s.drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            )}
            <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg">
              {editing.id ? 'Save changes' : 'Create login'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

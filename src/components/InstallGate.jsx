import { useState } from 'react'
import { Download, Share, Plus, Smartphone, Check } from 'lucide-react'
import Logo from './Logo.jsx'
import { usePwaInstall } from '../lib/usePwaInstall'

// Shown before the driver portal: pushes the user to install the app to their
// home screen. Installed/standalone users skip straight through. A small
// "continue in browser" link keeps desktop testing unblocked.
export default function InstallGate({ children }) {
  const { installed, canInstall, ios, promptInstall } = usePwaInstall()
  const [bypass, setBypass] = useState(false)

  if (installed || bypass) return children

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <Logo light size={36} />
      <div className="mt-8 w-24 h-24 rounded-3xl bg-teal-600/20 ring-2 ring-teal-500 grid place-items-center">
        <Smartphone size={44} className="text-teal-300" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Install the Driver App</h1>
      <p className="mt-2 text-slate-300 max-w-xs text-sm">
        Add Famba Driver to your home screen for live tracking, offline access and
        automatic updates — it works like a normal app.
      </p>

      {ios ? (
        <div className="mt-8 bg-slate-800 rounded-2xl p-5 max-w-xs text-left space-y-3">
          <p className="text-sm font-semibold text-teal-300">Install on iPhone</p>
          <Step icon={Share} text="Tap the Share button in Safari" />
          <Step icon={Plus} text="Choose “Add to Home Screen”" />
          <Step icon={Check} text="Open Famba Driver from your home screen" />
        </div>
      ) : canInstall ? (
        <button onClick={promptInstall}
          className="mt-8 w-full max-w-xs bg-teal-600 hover:bg-teal-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
          <Download size={20} /> Install app
        </button>
      ) : (
        <div className="mt-8 bg-slate-800 rounded-2xl p-5 max-w-xs text-sm text-slate-300">
          Open this page in <b className="text-white">Chrome</b> and use the menu
          (⋮) → <b className="text-white">Install app / Add to Home screen</b>.
        </div>
      )}

      <button onClick={() => setBypass(true)}
        className="mt-6 text-xs text-slate-500 hover:text-slate-300 underline">
        Continue in browser
      </button>
      <div className="mt-10 text-[11px] text-slate-600">Powered by Noby · nobie.netlify.app</div>
    </div>
  )
}

function Step({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <span className="w-8 h-8 rounded-lg bg-slate-700 grid place-items-center shrink-0"><Icon size={16} /></span>
      {text}
    </div>
  )
}

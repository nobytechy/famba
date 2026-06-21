import { Component } from 'react'

// Prevents a single render error from white-screening the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Famba error:', error, info) }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center">
          <div className="max-w-sm">
            <div className="text-5xl">🚧</div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">The page hit an unexpected error. Reloading usually fixes it.</p>
            <button onClick={() => window.location.reload()}
              className="mt-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl btn-press">
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

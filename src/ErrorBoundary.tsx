import { Component, type ReactNode } from 'react'

// Fängt Renderfehler ab (z. B. IndexedDB im privaten Fenster), statt eine weisse Seite zu zeigen.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return <CrashScreen error={this.state.error} />
  }
}

// Auch als defaultErrorComponent des Routers im Einsatz, damit Routenfehler dieselbe Seite zeigen.
export function CrashScreen({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : String(error)
  return (
      <div className="page crash">
        <h1>Da ist etwas schiefgelaufen</h1>
        <p className="lede">Die Seite konnte nicht angezeigt werden. Deine Daten liegen weiterhin in diesem Browser.</p>
        <pre className="crash-msg">{msg}</pre>
        <div className="row">
          <button className="btn primary" onClick={() => location.reload()}>Neu laden</button>
          <a className="btn" href="https://github.com/blackmath88/sharing-is-caring/issues/new?template=problem.yml" target="_blank" rel="noreferrer">Problem melden</a>
        </div>
        <p className="muted small">Hilft Neu laden nicht: unter Export eine Sicherung speichern, dann „Neu beginnen“.</p>
      </div>
  )
}

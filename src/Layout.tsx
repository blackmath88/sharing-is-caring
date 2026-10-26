import { Link, Outlet } from '@tanstack/react-router'
import { getRecipients, useStore } from './store'
import { wipe } from './db'

export function Layout() {
  const { photos, people, tags, excluded, settings, reset } = useStore()
  const tagged = photos.filter((p) => tags[p.id]?.length).length
  const mails = getRecipients({ photos, people, tags }).filter((r) => !excluded.includes(r.person.id)).length

  const steps = [
    { to: '/', label: 'Import', meta: photos.length || people.length ? `${photos.length} Fotos, ${people.length} Personen` : 'Fotos und Liste', done: photos.length > 0 && people.length > 0 },
    { to: '/taggen', label: 'Markieren', meta: photos.length ? `${tagged} von ${photos.length} Fotos` : 'Wer ist auf welchem Bild', done: photos.length > 0 && tagged === photos.length },
    { to: '/vorlagen', label: 'Texte', meta: 'Mail und LinkedIn', done: false },
    { to: '/export', label: 'Export', meta: mails ? `${mails} Mails bereit` : 'ZIP mit Entwürfen', done: false },
  ] as const

  async function onReset() {
    if (!confirm('Alle Fotos, Personen, Markierungen und Texte löschen?')) return
    await wipe()
    reset()
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-name">Fotodank</div>
          <div className="brand-event">{settings.event}</div>
        </div>
        <nav>
          {steps.map((s, i) => (
            <Link key={s.to} to={s.to} className={`nav-item${s.done ? ' done' : ''}`}
              activeProps={{ className: `nav-item active${s.done ? ' done' : ''}` }} activeOptions={{ exact: true }}>
              <span className="nav-num">{s.done ? '✓' : i + 1}</span>
              <span className="nav-label">{s.label}</span>
              <span className="nav-meta">{s.meta}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p>Alles bleibt in diesem Browser.</p>
          <button className="link-btn" onClick={onReset}>Neu beginnen</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}

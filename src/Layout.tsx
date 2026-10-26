import { Link, Outlet } from '@tanstack/react-router'
import { getRecipients, useStore } from './store'
import { wipe } from './db'
import { IconCheck, IconGitHub, IconSend, IconTag, IconText, IconUpload, Logo } from './icons'

export const REPO = 'https://github.com/blackmath88/sharing-is-caring'

export function Layout() {
  const { photos, people, tags, excluded, settings, reset } = useStore()
  const tagged = photos.filter((p) => tags[p.id]?.length).length
  const mails = getRecipients({ photos, people, tags }).filter((r) => !excluded.includes(r.person.id)).length

  const steps = [
    { to: '/', label: 'Import', icon: IconUpload, meta: photos.length || people.length ? `${photos.length} Fotos, ${people.length} Personen` : 'Fotos und Liste', done: photos.length > 0 && people.length > 0 },
    { to: '/taggen', label: 'Markieren', icon: IconTag, meta: photos.length ? `${tagged} von ${photos.length} Fotos` : 'Wer ist auf welchem Bild', done: photos.length > 0 && tagged === photos.length },
    { to: '/vorlagen', label: 'Texte', icon: IconText, meta: 'Mail und LinkedIn', done: false },
    { to: '/export', label: 'Export', icon: IconSend, meta: mails ? `${mails} Mails bereit` : 'ZIP mit Entwürfen', done: false },
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
          <Logo size={30} />
          <div className="brand-name">Sharing is Caring</div>
          <div className="brand-event">{settings.event}</div>
        </div>
        <nav>
          {steps.map((s) => (
            <Link key={s.to} to={s.to} className={`nav-item${s.done ? ' done' : ''}`}
              activeProps={{ className: `nav-item active${s.done ? ' done' : ''}` }} activeOptions={{ exact: true }}>
              <span className="nav-num">{s.done ? <IconCheck size={16} /> : <s.icon size={16} />}</span>
              <span className="nav-label">{s.label}</span>
              <span className="nav-meta">{s.meta}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p>Alles bleibt in diesem Browser.</p>
          <button className="link-btn" onClick={onReset}>Neu beginnen</button>
          <a className="gh" href={REPO} target="_blank" rel="noreferrer"><IconGitHub /> Open Source</a>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  )
}

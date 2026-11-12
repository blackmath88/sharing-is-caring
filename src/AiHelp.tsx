import { useRef, useState } from 'react'
import { AI_PROMPT } from './aiPrompt'

export function AiHelp() {
  const [status, setStatus] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const prompt = useRef<HTMLTextAreaElement>(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT)
      setStatus('Kopiert. Füge den Prompt in deine KI ein. Die fertigen Texte kommen anschliessend in die drei Felder unten.')
    } catch {
      setShowPrompt(true)
      setStatus('Automatisches Kopieren ist nicht verfügbar. Markiere den Prompt unten und kopiere ihn manuell.')
      requestAnimationFrame(() => { prompt.current?.focus(); prompt.current?.select() })
    }
  }

  return (
    <section className="ai-help" aria-labelledby="ai-help-title">
      <h2 id="ai-help-title">Mit KI-Unterstützung vorbereiten</h2>
      <p>Lass dir von deiner KI beim Dankesmail und LinkedIn-Vorschlag helfen. Kopiere den Prompt, ergänze dort den Anlass und füge die fertigen Texte hier ein.</p>
      <p className="muted small">Der Prompt enthält keine Fotos, Namen, Adressen oder Eingaben aus dieser App. Was du bei deiner KI ergänzt, teilst du mit deren Anbieter.</p>
      <div className="ai-help-actions">
        <button className="btn" onClick={copy}>Prompt kopieren</button>
        <button className="link-btn" aria-expanded={showPrompt} aria-controls="ai-prompt" onClick={() => setShowPrompt(!showPrompt)}>{showPrompt ? 'Prompt ausblenden' : 'Prompt ansehen'}</button>
      </div>
      <p role="status" className="small">{status}</p>
      {showPrompt && <textarea id="ai-prompt" ref={prompt} className="field" aria-label="KI-Prompt zum Kopieren" rows={10} value={AI_PROMPT} readOnly />}
    </section>
  )
}

export function StorageNotice() {
  return (
    <aside className="storage-notice" aria-label="Datenspeicherung">
      <strong>Dein Projekt bleibt in diesem Browser.</strong>
      <p>Fotos, Teilnehmende und Texte werden lokal gespeichert. Kein Upload, keine Cloud-Sicherung, kein Abgleich mit anderen Geräten.</p>
      <details>
        <summary>Was wird gespeichert – und was muss ich sichern?</summary>
        <p>Fotos liegen in IndexedDB, Personen, Markierungen und Texte in localStorage. Das ist Website-Speicher, nicht nur der Seiten-Cache. Er bleibt normalerweise nach dem Schliessen erhalten, ist aber keine verlässliche Sicherung.</p>
        <p>Website-Daten löschen, «Neu beginnen» oder das Ende einer privaten Browsersitzung können dein Projekt entfernen. Auch der Browser kann Speicher freigeben. Ein anderer Browser, ein anderes Gerät oder eine andere Website-Adresse hat einen eigenen Speicher: Es wird nichts automatisch übertragen.</p>
        <p><strong>Unter Export die JSON-Sicherung speichern und die Originalfotos separat behalten.</strong> Die Sicherung enthält Personen, Markierungen, Einstellungen und Texte, aber keine Bilddateien. Zum Wiederherstellen dieselben Originaldateien erneut importieren.</p>
        <p>Der Webhost liefert die App aus und kann dabei übliche Verbindungsdaten sehen, erhält aber keinen Upload deiner Projektinhalte. Erst wenn du Dateien exportierst, Inhalte an eine andere App übergibst oder in eine KI einfügst, liegen diese auch ausserhalb dieses Browsers. Die App verschickt selbst keine Mails.</p>
      </details>
    </aside>
  )
}

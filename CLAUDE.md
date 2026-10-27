# Working in Sharing is Caring

Read [README](README.md), [Architecture](docs/ARCHITECTURE.md) and [Sending](docs/SENDING.md) before changing behaviour. [Contributing](CONTRIBUTING.md) holds the verification routine and the house rules; this file makes them actionable for an agent.

## What the product is

A static browser app that turns a folder of event photos and a participant list into one mail per person, each with their photos and a LinkedIn post suggestion. Sending is manual by design. Nothing leaves the browser: no backend, no analytics, no third-party hosts.

## Non-negotiables

- UI text in German with Swiss spelling (ss, never ß). Code and docs in English.
- No network calls from the app, no analytics, no external font or script hosts.
- No new dependency without a one-line justification. TypeScript 7 is in use; typescript-eslint does not support it, which is why oxlint is the linter.
- Storage keys stay `fotodank` (localStorage via zustand persist, IndexedDB via idb-keyval) so existing users keep their data.
- Demo data is generated or invented. Never add real people, addresses or event photos.
- Design: indigo accent on cool neutrals, tokens in `src/styles.css`, Inter Variable, icons from `src/icons.tsx` in the same stroke style. No gradient blobs, glassmorphism, neon or generic AI illustration. Honour `prefers-color-scheme` and `prefers-reduced-motion`.
- The mail HTML stays table-based with inline styles (Outlook's Word engine). Keep the MIME tree documented in Architecture.

## Definition of done

1. `npm run check`, `npm run lint`, `npm test`, `npm run build` all green.
2. For UI changes: load the example data ("Mit Beispiel ausprobieren") and walk the four steps in light and dark schemes; use Playwright headless if no display is available.
3. For mail changes: generate one .eml, parse it with a MIME parser, render the HTML part in a browser.
4. Screenshots in `.github/media/screens/` retaken at 1280×800, scale 2, if the affected page changed visibly.
5. README, Architecture or Sending updated when behaviour or structure changed.
6. Commit with a clear message, push to `main`; the deploy workflow publishes. Verify the live URL afterwards, including the JS asset and the copy page route.
7. Report: live URL, what changed, what was left out and why, what could not be verified (Outlook rendering, real share sheets).

## Before building something new

Answer in a few lines: which user problem, where in the four-step flow it sits, why this interaction, the smallest technology that does it, and whether it introduces a visual cliché. Then build.

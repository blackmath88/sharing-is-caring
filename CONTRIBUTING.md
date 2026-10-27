# Contributing

Start with a reproducible problem or a concrete improvement for someone sending event photos. Small, focused changes are easiest to review.

## Report a problem

Use the [issue form](https://github.com/blackmath88/sharing-is-caring/issues/new?template=problem.yml). Include the step (Import, Markieren, Texte, Export), the browser and operating system, what you expected and what happened. For a mail client problem, name the client and version and say whether the .eml, the share sheet or the mailto path was used. Remove names, addresses and photos of real people from screenshots and attachments.

For a larger feature, open an issue describing the user need before implementation. A proposal is not an approved change of scope.

## Verify a change

Use Node.js 22. Run `npm ci`, then:

```bash
npm run check
npm run lint
npm test
npm run build
```

For a change to the UI, open the app with `npm run dev`, load the example data with "Mit Beispiel ausprobieren" and walk through all four steps in light and dark colour schemes and at phone width. For a change to the mail, generate one .eml and check its structure with a MIME parser; render the HTML part in a browser. Outlook rendering can only be checked in Outlook. State what you checked and what you could not check; never report an unexecuted command as passing.

If a screenshot in the README is affected, retake it with the example data at 1280×800 and a device scale factor of 2.

## Rules of the house

- The UI is in German with Swiss spelling (ss, never ß). Code, comments where needed, and documentation are in English.
- Nothing leaves the browser. Do not add analytics, fonts from third-party hosts, or network calls.
- No new dependency without a one-line justification in the pull request.
- Demo data is generated or invented. Never commit real participant lists or real event photos.
- Keep the storage keys (`fotodank` in localStorage and IndexedDB) stable so existing users keep their data.

## Open a pull request

Explain the user-facing problem, what changed and the evidence for the result. Keep behaviour changes, dependency upgrades and presentation changes in separate reviewable scopes. Do not commit `dist/`.

## Sensitive reports

Do not put personal data or exploitable security details into public issues. Use GitHub's private vulnerability reporting option if available. No response-time commitment is implied.

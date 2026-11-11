# Cloudflare deployment

Status: configuration prepared; Cloudflare account connection and custom domain must be verified after deployment. Existing GitHub Pages hosting stays available.

## Connect Workers Builds

In Cloudflare **Workers & Pages**, create a Worker by importing the GitHub repository `blackmath88/sharing-is-caring`. Grant the Cloudflare GitHub app access to this repository only where possible.

| Setting | Value |
|---|---|
| Worker name | `sharing-is-caring` (must match `wrangler.jsonc`) |
| Production branch | `main` |
| Root directory | repository root |
| Build command | `npm run check && npm run lint && npm test && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build variable | `NODE_VERSION=22` |

Dependencies are installed from the committed lockfile. Wrangler is a development-only dependency for reproducible deployment and local configuration validation. No application secrets, AI key, database, R2 bucket or Worker script are needed. The assets directory is already set to `./dist` in `wrangler.jsonc`; do not configure this as a Pages project.

Deploy first to the workers.dev address shown by Cloudflare and test it. Pushes to main then rebuild and deploy automatically. Keep non-production branch builds disabled unless preview deployments are wanted.

## Bridge Work custom domain

Suggested address: `sharing.bridge-work.ai`. Confirm that the zone is in the selected account and that this hostname is unused; do not replace an existing service.

After the workers.dev deployment succeeds, add this top-level entry to `wrangler.jsonc` and commit it:

```json
"routes": [{ "pattern": "sharing.bridge-work.ai", "custom_domain": true }]
```

Deploy again. Cloudflare provisions the DNS record and certificate for a Worker Custom Domain. Keeping the route in version control prevents later deploys from accidentally reverting dashboard-only configuration. Alternatively add it under the Worker's Settings → Domains & Routes → Add → Custom Domain, then copy the resulting route configuration back into the repo before the next deploy.

## Verify

- Root URL loads and its JS/CSS return successfully.
- Load the invented demo and walk Import → Markieren → Texte → Export.
- Copy the AI prompt; check the manual fallback if clipboard access is denied.
- Export a sample ZIP and open the mail draft without sending it.
- Follow the LinkedIn copy link (`#/post?t=...`) and copy the text.
- Verify at phone width and in dark mode.

Do not change the README's primary URL until the custom domain passes these checks. Keep GitHub Pages available for previously sent copy-page links.

## Storage boundary

Browser storage belongs to an origin. GitHub Pages, workers.dev and the custom domain have separate projects, even in the same browser. Switching domains does not transfer photos or settings. The JSON backup contains metadata, tags and templates, **not photo binaries**. Keep the original photos and the old origin available; finish existing projects there or deliberately re-import and verify on the new origin. Do not clear old site data during migration.

## Local CLI alternative

```bash
npm ci
npm run check && npm run lint && npm test && npm run build
npx wrangler deploy --dry-run
npx wrangler login
npx wrangler deploy
```

Sign in locally; never paste Cloudflare credentials into chat or commit them. Wrangler files and local secrets are ignored by Git.

References: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Static assets](https://developers.cloudflare.com/workers/static-assets/), [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

# vibexsoft.com

The website of **VibeX LLC** (United States) — an umbrella company for AI-native startups.
It is purely informational: no forms, no accounts, no analytics, no third-party requests.
Static files plus a minimal Node server with **zero runtime dependencies**.

```
public/          the whole site (html/css/js/icons)
server.js        HTTP server: security headers, canonical host, ETag, 404
scripts/check.js pre-flight check (CSP hashes, secrets, SEO minimum)
Dockerfile       image built by Railway
railway.json     deploy config (healthcheck /healthz)
```

## Run locally

```bash
npm run dev          # http://localhost:8080, no canonical-host redirect
npm run check        # required before pushing
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Railway injects its own |
| `SITE_ORIGIN` | `https://www.vibexsoft.com` | canonical origin: www→apex and http→https redirects |
| `ENFORCE_CANONICAL` | `true` | `false` disables redirects (local development) |

The site has no secrets and must never have any: it stores nothing, accepts nothing and calls
nothing. `scripts/check.js` fails if anything resembling a key or token appears in `public/`.

## Security

* Strict `Content-Security-Policy` with no `'unsafe-inline'`. Therefore **no** inline CSS or JS —
  the single exception is the JSON-LD block in `index.html`, covered by a `sha256` hash in
  `server.js`. If you edit that block, run `npm run check`; it prints the new hash.
* System fonts only, no third-party origins at all (no CDN, no analytics, no pixels) — which is
  what makes the Privacy Policy true rather than aspirational.
* HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
  Only `GET`/`HEAD` are served; anything else returns 405.
* Path-traversal protection: path normalisation plus a check that the result stayed inside
  `public/`.

Report a vulnerability: `public/.well-known/security.txt`.

## Editing content

The site is English-only and every string lives directly in the HTML — the pages are fully
meaningful with JavaScript disabled. `public/assets/app.js` only handles the mobile menu, the
sticky-header state, reveal-on-scroll and the footer year.

The Open Graph image is generated from `public/assets/og.svg`; if you change it, re-export
`public/assets/og.jpg` at 1200×630.

## Deploy

Railway builds the `Dockerfile` and watches `/healthz`. A push to `main` deploys.

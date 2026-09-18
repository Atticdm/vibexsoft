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
* Fonts are self-hosted `.woff2` under `font-src 'self'`; there are no third-party origins at
  all (no CDN, no analytics, no pixels) — which is what makes the Privacy Policy true rather
  than aspirational. A Google Fonts link would not degrade here, it would simply be blocked.
* HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
  Only `GET`/`HEAD` are served; anything else returns 405.
* Path-traversal protection: path normalisation plus a check that the result stayed inside
  `public/`.

Report a vulnerability: `public/.well-known/security.txt`.

## Editing content

The site is English-only and every string lives directly in the HTML — the pages are fully
meaningful with JavaScript disabled. `public/assets/app.js` now does one thing: it keeps the
footer year from going stale. The markup carries a correct year of its own.

### Typography

One family carries the whole site: Libre Franklin, variable 100–900, latin subset, 29 KB in
`public/assets/fonts/`. The 104px headline and the 15px body copy come from that single file.
Since the design has no gradients, shadows or rounded cards, type is the only expressive device
left — which is why a second face was dropped rather than added.

### Open Graph image

`public/assets/og.jpg` (1200×630) is rendered from `scripts/og-template.html`. The font is
inlined there as a data URI so the template renders standalone, with no server and no CSP in
the way:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --screenshot=/tmp/og.png "file://$PWD/scripts/og-template.html"
sips -s format jpeg -s formatOptions 88 /tmp/og.png --out public/assets/og.jpg
```

Do not try to render it through the site's own server: `style-src 'self'` drops the template's
inline `<style>`, and the screenshot comes out as unstyled text.

### Brand mark

`public/assets/favicon.svg` is an ink square with a paper V, and
`public/assets/oauth-logo-120.png` is the same mark at 120×120 for the Google OAuth consent
screen. Re-export the PNG whenever the SVG changes.

## Deploy

Railway builds the `Dockerfile` and watches `/healthz`. A push to `main` deploys.

## DNS and TLS

Two different hosts serve two different things, and both need their own certificate.

| Host | Served by | DNS record |
|---|---|---|
| `www.vibexsoft.com` (canonical) | Railway — this repo | `CNAME www → 0gen3qsm.up.railway.app` **and** `TXT _railway-verify.www → railway-verify=<token>` |
| `vibexsoft.com` (apex) | GitHub Pages — `Atticdm/vibexsoft-apex`, a redirect stub to www | four `A` records → `185.199.108-111.153` |

The apex is on GitHub Pages only because the registrar (GoDaddy) supports neither CNAME
flattening nor ALIAS records, so an apex CNAME to Railway is impossible. If the zone ever moves
to Cloudflare, the apex can go straight to Railway and the stub repo can be deleted.

**The `TXT _railway-verify.*` record is not optional.** Railway verifies domain ownership through
it before it will route traffic *or* issue a certificate: with only the `CNAME` in place the host
answers `404 {"status":"error","message":"Application not found"}` over the default
`*.up.railway.app` certificate, so browsers show a certificate-name error rather than the site.
The current token is shown in Railway → service → Settings → Networking next to the domain.

GitHub Pages needs no ownership record — just the `A` records — but its certificate is only
requested when the custom domain is (re-)saved. If `https://vibexsoft.com` ever serves a
`*.github.io` certificate, remove and re-add the custom domain in the `vibexsoft-apex` repo
(Settings → Pages), wait for the certificate, then tick **Enforce HTTPS**.

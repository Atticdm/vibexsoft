'use strict';

/**
 * vibexsoft.com — a static site with zero dependencies.
 *
 * Why not Express/Nginx: the site has no dynamic routes at all, and every npm
 * dependency is a supply chain someone has to keep patched.
 * Zero dependencies = zero CVEs and a reproducible build.
 */

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 8080;
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://www.vibexsoft.com').replace(/\/+$/, '');
const CANONICAL_HOST = new URL(SITE_ORIGIN).host;
// Local development must not redirect to itself.
const ENFORCE_CANONICAL = process.env.ENFORCE_CANONICAL !== 'false';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Content-Security-Policy without 'unsafe-inline': all CSS and JS live in
 * separate files precisely for this. Fonts are system fonts, so the policy
 * contains no third-party origins at all.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  // sha256 of the inline JSON-LD in index.html. If you edit that block, refresh
  // the hash: `node scripts/check.js` computes and prints the current one.
  "script-src 'self' 'sha256-2OzEB3jUwDlE3NWxdndTBpuBWlYuB/ewa8M1/fQ99Eg='",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

function securityHeaders(res, { isHtml }) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Origin-Agent-Cluster', '?1');
  if (isHtml) res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
}

/** Resolves a URL path to a file inside ROOT, or returns null (including on traversal). */
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  const clean = path.posix.normalize(decoded);
  if (clean.includes('..')) return null;

  const candidates = clean.endsWith('/')
    ? [path.join(clean, 'index.html')]
    : [clean, `${clean}.html`, path.join(clean, 'index.html')];

  for (const candidate of candidates) {
    const abs = path.join(ROOT, candidate);
    // Final guard: after normalisation the path must still be inside ROOT.
    if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) continue;
    try {
      if (fs.statSync(abs).isFile()) return abs;
    } catch {
      /* no such file — try the next candidate */
    }
  }
  return null;
}

const etagCache = new Map();
async function etagFor(file) {
  const { mtimeMs, size } = await fsp.stat(file);
  const key = `${file}:${mtimeMs}:${size}`;
  const cached = etagCache.get(file);
  if (cached && cached.key === key) return cached.etag;
  const buf = await fsp.readFile(file);
  const etag = `"${createHash('sha1').update(buf).digest('base64url')}"`;
  etagCache.set(file, { key, etag });
  return etag;
}

async function sendFile(req, res, file, status = 200) {
  const ext = path.extname(file).toLowerCase();
  const isHtml = ext === '.html';
  securityHeaders(res, { isHtml });
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  if (!isHtml) {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }

  const etag = await etagFor(file);
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304).end();
    return;
  }

  const { size } = await fsp.stat(file);
  res.setHeader('Content-Length', size);
  res.writeHead(status);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

function redirect(res, location, code = 301) {
  res.writeHead(code, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      securityHeaders(res, { isHtml: false });
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Method Not Allowed');
    }

    const url = new URL(req.url, `http://${req.headers.host || CANONICAL_HOST}`);

    if (url.pathname === '/healthz') {
      securityHeaders(res, { isHtml: false });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }

    // Railway terminates TLS ahead of the app; the scheme arrives in a header.
    if (ENFORCE_CANONICAL) {
      const proto = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
      const host = (req.headers.host || '').toLowerCase().split(':')[0];
      const isRailwayInternal = host.endsWith('.railway.app') || host.endsWith('.up.railway.app');
      if (!isRailwayInternal && host) {
        if (proto && proto !== 'https') {
          return redirect(res, `${SITE_ORIGIN}${url.pathname}${url.search}`, 308);
        }
        if (host === `www.${CANONICAL_HOST}`) {
          return redirect(res, `${SITE_ORIGIN}${url.pathname}${url.search}`, 301);
        }
      }
    }

    const file = resolveFile(url.pathname);
    if (file) return await sendFile(req, res, file);

    const notFound = path.join(ROOT, '404.html');
    if (fs.existsSync(notFound)) return await sendFile(req, res, notFound, 404);

    securityHeaders(res, { isHtml: false });
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  } catch (err) {
    // Nothing but a status code goes out: error details stay in the logs.
    console.error('[error]', err && err.stack ? err.stack : err);
    if (!res.headersSent) {
      securityHeaders(res, { isHtml: false });
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Internal Server Error');
  }
});

server.headersTimeout = 20000;
server.requestTimeout = 30000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`vibexsoft site listening on :${PORT} (canonical ${SITE_ORIGIN})`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}

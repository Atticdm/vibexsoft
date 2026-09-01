'use strict';

/**
 * Pre-flight check for the site. It catches exactly the regressions that a
 * strict CSP makes silent: an inline script without a hash simply does not
 * execute in production, while everything looks fine locally.
 *
 *   node scripts/check.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const server = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const errors = [];
const warnings = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(PUBLIC);
const html = files.filter((f) => f.endsWith('.html'));

/* 1. Inline scripts must have a sha256 in the CSP. */
for (const file of html) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(src))) {
    const body = m[1];
    const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
    if (!server.includes(hash)) {
      errors.push(
        `${path.relative(ROOT, file)}: inline <script> not covered by the CSP.\n` +
          `  add to script-src: '${hash}'`
      );
    }
  }
}

/* 2. Inline styles and handlers break against style-src/script-src 'self'. */
for (const file of html) {
  const src = fs.readFileSync(file, 'utf8');
  if (/\sstyle\s*=\s*"/.test(src)) {
    errors.push(`${path.relative(ROOT, file)}: style="" attribute is blocked by CSP style-src 'self'.`);
  }
  const handler = src.match(/\son(?:click|load|error|mouse\w+|key\w+)\s*=/i);
  if (handler) {
    errors.push(`${path.relative(ROOT, file)}: inline handler ${handler[0].trim()} is blocked by the CSP.`);
  }
  if (/<style[\s>]/i.test(src)) {
    errors.push(`${path.relative(ROOT, file)}: <style> block is blocked by CSP style-src 'self'.`);
  }
}

/* 3. Links to another origin — only with rel="noopener". */
for (const file of html) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/gi;
  let m;
  while ((m = re.exec(src))) {
    if (/target="_blank"/i.test(m[0]) && !/noopener/i.test(m[0])) {
      errors.push(`${path.relative(ROOT, file)}: target="_blank" without rel="noopener": ${m[0].slice(0, 90)}`);
    }
  }
}

/* 4. Secrets in the public folder. The site is static — there can be none here at all. */
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9_-]{16,}/, 'OpenAI-like key'],
  [/\bsk-ant-[A-Za-z0-9_-]{16,}/, 'Anthropic key'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub token'],
  [/\bgd_pat_[A-Za-z0-9_-]{20,}/, 'GoDaddy PAT'],
  [/\bxai-[A-Za-z0-9]{20,}/, 'xAI key'],
  [/\bAIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/\b\d{8,10}:[A-Za-z0-9_-]{35}\b/, 'Telegram bot token'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
];
for (const file of files) {
  if (/\.(png|jpe?g|webp|avif|ico|woff2?)$/i.test(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(src)) errors.push(`${path.relative(ROOT, file)}: looks like a leaked secret (${label}).`);
  }
}

/* 5. Required files. */
for (const required of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', '.well-known/security.txt']) {
  if (!fs.existsSync(path.join(PUBLIC, required))) errors.push(`missing required file public/${required}`);
}

/* 6. Per RFC 9116, security.txt must carry an unexpired Expires field. */
const secTxt = fs.readFileSync(path.join(PUBLIC, '.well-known/security.txt'), 'utf8');
const expires = secTxt.match(/^Expires:\s*(.+)$/m);
if (!expires) {
  errors.push('security.txt: mandatory Expires field is missing (RFC 9116).');
} else if (new Date(expires[1].trim()) <= new Date()) {
  warnings.push('security.txt: Expires field has lapsed — refresh the date.');
}

/* 7. Every page must have a title, a description and a canonical. */
for (const file of html) {
  if (path.basename(file) === '404.html') continue;
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  if (!/<title\b[^>]*>[^<]{10,}<\/title>/.test(src)) errors.push(`${rel}: no meaningful <title>.`);
  if (!/name="description"/.test(src)) errors.push(`${rel}: no meta description.`);
  if (!/rel="canonical"/.test(src)) errors.push(`${rel}: no canonical.`);
}

for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  console.error(`\nFAIL  problems found: ${errors.length}\n`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}
console.log(`OK    files checked: ${files.length}, pages: ${html.length}, no problems.`);

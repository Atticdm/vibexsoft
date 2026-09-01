'use strict';

/**
 * Предполётная проверка сайта. Ловит ровно те регрессии, которые
 * strict-CSP делает «тихими»: инлайновый скрипт без хеша просто
 * не выполнится в проде, а локально всё выглядит нормально.
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

/* 1. Инлайновые скрипты обязаны иметь sha256 в CSP. */
for (const file of html) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(src))) {
    const body = m[1];
    const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
    if (!server.includes(hash)) {
      errors.push(
        `${path.relative(ROOT, file)}: inline <script> не покрыт CSP.\n` +
          `  добавь в script-src: '${hash}'`
      );
    }
  }
}

/* 2. Инлайновые стили и обработчики ломаются об style-src/script-src 'self'. */
for (const file of html) {
  const src = fs.readFileSync(file, 'utf8');
  if (/\sstyle\s*=\s*"/.test(src)) {
    errors.push(`${path.relative(ROOT, file)}: атрибут style="" заблокирован CSP style-src 'self'.`);
  }
  const handler = src.match(/\son(?:click|load|error|mouse\w+|key\w+)\s*=/i);
  if (handler) {
    errors.push(`${path.relative(ROOT, file)}: инлайновый обработчик ${handler[0].trim()} заблокирован CSP.`);
  }
  if (/<style[\s>]/i.test(src)) {
    errors.push(`${path.relative(ROOT, file)}: <style> блок заблокирован CSP style-src 'self'.`);
  }
}

/* 3. Внешние ссылки на другой origin — только с rel="noopener". */
for (const file of html) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/gi;
  let m;
  while ((m = re.exec(src))) {
    if (/target="_blank"/i.test(m[0]) && !/noopener/i.test(m[0])) {
      errors.push(`${path.relative(ROOT, file)}: target="_blank" без rel="noopener": ${m[0].slice(0, 90)}`);
    }
  }
}

/* 4. Секреты в публичной папке. Сайт статический — их тут быть не может в принципе. */
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9_-]{16,}/, 'OpenAI-подобный ключ'],
  [/\bsk-ant-[A-Za-z0-9_-]{16,}/, 'Anthropic-ключ'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'GitHub-токен'],
  [/\bgd_pat_[A-Za-z0-9_-]{20,}/, 'GoDaddy PAT'],
  [/\bxai-[A-Za-z0-9]{20,}/, 'xAI-ключ'],
  [/\bAIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/\b\d{8,10}:[A-Za-z0-9_-]{35}\b/, 'Telegram bot token'],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'приватный ключ'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
];
for (const file of files) {
  if (/\.(png|jpe?g|webp|avif|ico|woff2?)$/i.test(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(src)) errors.push(`${path.relative(ROOT, file)}: похоже на утёкший секрет (${label}).`);
  }
}

/* 5. Обязательные файлы. */
for (const required of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', '.well-known/security.txt']) {
  if (!fs.existsSync(path.join(PUBLIC, required))) errors.push(`нет обязательного файла public/${required}`);
}

/* 6. security.txt по RFC 9116 обязан иметь непросроченный Expires. */
const secTxt = fs.readFileSync(path.join(PUBLIC, '.well-known/security.txt'), 'utf8');
const expires = secTxt.match(/^Expires:\s*(.+)$/m);
if (!expires) {
  errors.push('security.txt: отсутствует обязательное поле Expires (RFC 9116).');
} else if (new Date(expires[1].trim()) <= new Date()) {
  warnings.push('security.txt: поле Expires просрочено — обнови дату.');
}

/* 7. Каждая страница должна иметь title, description и canonical. */
for (const file of html) {
  if (path.basename(file) === '404.html') continue;
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  if (!/<title\b[^>]*>[^<]{10,}<\/title>/.test(src)) errors.push(`${rel}: нет осмысленного <title>.`);
  if (!/name="description"/.test(src)) errors.push(`${rel}: нет meta description.`);
  if (!/rel="canonical"/.test(src)) errors.push(`${rel}: нет canonical.`);
}

for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  console.error(`\nFAIL  найдено проблем: ${errors.length}\n`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}
console.log(`OK    проверено файлов: ${files.length}, страниц: ${html.length}, проблем нет.`);

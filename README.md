# vibexsoft.com

Корпоративный сайт **VibeX LLC** (Florida, USA). Статика + минимальный Node-сервер,
**ноль runtime-зависимостей**.

```
public/          весь сайт (html/css/js/иконки)
server.js        HTTP-сервер: security-заголовки, канонический хост, ETag, 404
scripts/check.js предполётная проверка (CSP-хеши, секреты, SEO-минимум)
Dockerfile       образ для Railway
railway.json     конфиг деплоя (healthcheck /healthz)
```

## Локально

```bash
npm run dev          # http://localhost:8080 без редиректа на канонический хост
npm run check        # обязательно перед пушем
```

## Переменные окружения

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `PORT` | `8080` | Railway подставляет свой |
| `SITE_ORIGIN` | `https://vibexsoft.com` | канонический origin: редиректы www→apex и http→https |
| `ENFORCE_CANONICAL` | `true` | `false` отключает редиректы (локальная разработка) |

Секретов у сайта нет и быть не должно: он ничего не хранит, ничего не принимает
и никуда не ходит. `scripts/check.js` падает, если в `public/` появится что-то
похожее на ключ или токен.

## Безопасность

* Строгий `Content-Security-Policy` без `'unsafe-inline'`. Поэтому **никакого**
  инлайнового CSS/JS: единственное исключение — блок JSON-LD в `index.html`,
  покрытый `sha256`-хешем в `server.js`. Изменил блок — перезапусти
  `npm run check`, он покажет новый хеш.
* Шрифты системные, сторонних origin'ов нет вообще (ни CDN, ни аналитики,
  ни пикселей) — это же и есть основа Privacy Policy.
* HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  COOP/CORP. Отдаются только `GET`/`HEAD`, остальное — 405.
* Защита от path traversal: нормализация пути + проверка, что результат остался
  внутри `public/`.

Сообщить об уязвимости: `public/.well-known/security.txt`.

## Правки контента

Английский текст лежит прямо в HTML — страница осмысленна без JavaScript.
Русский накладывается словарём `RU` в `public/assets/app.js` по ключам
`data-i18n`. Добавил новый ключ в HTML — добавь перевод в словарь.

## Деплой

Railway собирает `Dockerfile` и следит за `/healthz`. Пуш в `main` = деплой.

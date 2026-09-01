/* VibeX Soft — клиентский слой: язык, меню, reveal. Без зависимостей. */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     i18n. Английский захардкожен в HTML — страница остаётся
     валидной и осмысленной без JS. Русский накладывается сверху.
     --------------------------------------------------------- */
  var RU = {
    'meta.title': 'VibeX Soft — продуктовая студия AI-разработки',
    'meta.description': 'VibeX LLC — независимая студия разработки: AI-продукты, веб-платформы и мобильные приложения от идеи до продакшена.',
    'nav.skip': 'Перейти к содержимому',
    'nav.services': 'Что мы делаем',
    'nav.work': 'Проекты',
    'nav.process': 'Процесс',
    'nav.contact': 'Контакты',
    'nav.toggle': 'Открыть меню',
    'cta.short': 'Обсудить проект',

    'hero.badge': 'VibeX LLC · Флорида, США · берём новые проекты',
    'hero.h1a': 'Делаем AI-продукты,',
    'hero.h1b': 'которые доезжают до продакшена.',
    'hero.lead': 'VibeX Soft — независимая продуктовая студия. Ведём идею от чистого листа до работающей системы в бою: веб-платформы, AI-агенты, мобильные приложения — и дальше поддерживаем их живыми.',
    'hero.cta1': 'Обсудить проект',
    'hero.cta2': 'Что мы делаем',

    'stats.1v': 'Полный цикл',
    'stats.1l': 'Исследование, дизайн, разработка, эксплуатация',
    'stats.2v': 'AI в основе',
    'stats.2l': 'LLM-агенты, RAG, системы оценки качества',
    'stats.3v': 'Удалённо',
    'stats.3l': 'Распределённая команда, асинхронная работа',
    'stats.4v': 'Компания в США',
    'stats.4l': 'Зарегистрирована во Флориде с 2025 года',

    'services.eyebrow': 'Что мы делаем',
    'services.h2': 'Продуктовая инженерия, где AI — это инфраструктура',
    'services.lead': 'Мы маленькая команда сильных инженеров. Без передач между отделами и конвейера тикетов: кто проектирует систему, тот и отвечает за неё в проде.',
    'svc.1h': 'AI и LLM-инженерия',
    'svc.1p': 'Агенты, retrieval-пайплайны, системы оценки качества, роутинг моделей и жёсткие потолки расходов. Чтобы это измерялось, а не только демонстрировалось.',
    'svc.2h': 'Веб-платформы',
    'svc.2p': 'Full-stack продукты, где аккуратно сделана скучная часть: аутентификация, биллинг, квоты, админка, журнал действий.',
    'svc.3h': 'Мобильные приложения',
    'svc.3p': 'Нативный iOS и кроссплатформа — доведённые до релиза в сторе, а не оставленные в TestFlight.',
    'svc.4h': 'Автоматизация и интеграции',
    'svc.4p': 'Внутренние инструменты, боты и дата-пайплайны, которые снимают ручную работу — с ретраями, алертами и ответственным за них.',
    'svc.5h': 'Безопасность и комплаенс',
    'svc.5p': 'Гигиена секретов, доступы по минимуму прав, security-заголовки, ревью зависимостей и потоков данных — во время разработки, а не после инцидента.',
    'svc.6h': 'Инфраструктура и надёжность',
    'svc.6p': 'CI/CD, наблюдаемость, контроль расходов и runbook-и дежурства, чтобы через полгода всё ещё работало то, за что вы заплатили.',

    'work.eyebrow': 'Избранные проекты',
    'work.h2': 'Продукты, которые мы спроектировали, собрали и продолжаем вести',
    'work.1p': 'Синтетические потребительские панели: LLM-респонденты, дизайн опросов и отчётность для команд, которым нужен сигнал до затрат на полевое исследование.',
    'work.2n': 'AI API-платформа',
    'work.2p': 'Шлюз, дающий один API поверх нескольких провайдеров моделей: квоты, биллинг по ключам, аналитика потребления и автоматическое переключение между моделями.',
    'work.3n': 'Мобильное приложение',
    'work.3p': 'Социальное iOS-приложение вокруг камеры: обработка медиа в реальном времени, событийный бэкенд и релизный процесс, переживающий ревью App Store.',

    'process.eyebrow': 'Как мы работаем',
    'process.h2': 'Четыре шага и никаких сюрпризов в счёте',
    'step.1h': 'Исследование',
    'step.1p': 'Короткий оплачиваемый спринт: разбираем задачу, ограничения и самую рискованную гипотезу, отдаём письменный скоуп с вилкой цены.',
    'step.2h': 'Проектирование',
    'step.2p': 'Архитектура, модель данных, интерфейсы и граница безопасности — согласованы до первой строчки боевого кода.',
    'step.3h': 'Разработка',
    'step.3p': 'Двухнедельные итерации с работающим деплоем в конце каждой. У вас всегда есть то, что можно потыкать.',
    'step.4h': 'Эксплуатация',
    'step.4p': 'Мониторинг, runbook-и дежурства и документированная передача — ведём сами или отдаём вашей команде.',

    'contact.eyebrow': 'Контакты',
    'contact.h2': 'Расскажите, что вы строите.',
    'contact.lead': 'Пишите по-русски или по-английски, опишите задачу в несколько предложений — ответим честно, в том числе если это не наша задача.',
    'contact.privacy': 'Как мы обращаемся с данными',

    'footer.about': 'Независимая студия разработки. AI-продукты, веб-платформы и мобильные приложения: проектируем, собираем и эксплуатируем одной командой.',
    'footer.site': 'Сайт',
    'footer.legal': 'Документы',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.terms': 'Условия использования',
    'footer.security': 'Контакт по безопасности',
    'footer.contact': 'Контакты',
    'footer.copy': '© 2026 VibeX LLC. Все права защищены.',
    'footer.entity': 'Компания с ограниченной ответственностью, штат Флорида',

    'legal.back': '← На главную',
    'nf.title': 'Страница не найдена',
    'nf.lead': 'Такой страницы здесь нет. Возможно, ссылка устарела.',
    'nf.cta': 'На главную'
  };

  var SUPPORTED = ['en', 'ru'];
  var STORAGE_KEY = 'vx-lang';

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function detectLang() {
    var fromQuery = new URLSearchParams(window.location.search).get('lang');
    if (SUPPORTED.indexOf(fromQuery) !== -1) return fromQuery;
    var stored = safeGet(STORAGE_KEY);
    if (SUPPORTED.indexOf(stored) !== -1) return stored;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return nav.toLowerCase().indexOf('ru') === 0 ? 'ru' : 'en';
  }

  // Английские значения снимаем с самой разметки при первом запуске,
  // поэтому второй словарь держать не нужно — HTML и есть источник правды.
  var EN = null;
  function captureEnglish() {
    if (EN) return;
    EN = { text: {}, attr: {} };
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      EN.text[el.getAttribute('data-i18n')] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        EN.attr[parts[0].trim() + '|' + parts[1].trim()] = el.getAttribute(parts[0].trim());
      });
    });
  }

  function applyLang(lang) {
    captureEnglish();
    var dict = lang === 'ru' ? RU : null;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = dict ? dict[key] : EN.text[key];
      if (typeof value === 'string') el.innerHTML = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var key = parts[1].trim();
        var value = dict ? dict[key] : EN.attr[attr + '|' + key];
        if (typeof value === 'string') el.setAttribute(attr, value);
      });
    });

    document.documentElement.lang = lang;
    document.querySelectorAll('.lang__btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });
    safeSet(STORAGE_KEY, lang);
  }

  /* --------------------------------------------------------- */
  function initLang() {
    applyLang(detectLang());
    document.querySelectorAll('.lang__btn').forEach(function (btn) {
      btn.addEventListener('click', function () { applyLang(btn.dataset.lang); });
    });
  }

  function initNav() {
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    if (!burger || !nav) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      nav.setAttribute('data-open', String(open));
    }
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    // Меню — только мобильное состояние: на десктопе оно всегда в потоке.
    var mq = window.matchMedia('(min-width: 861px)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(
      function () { setOpen(false); }
    );
  }

  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.setAttribute('data-scrolled', String(window.scrollY > 8));
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  function boot() {
    initLang();
    initNav();
    initHeader();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* VibeX — the entire client layer.
 *
 * The redesign removed everything this file used to do: the burger menu (the
 * nav simply wraps now), the sticky-header state and the scroll reveals. What
 * is left is the footer year, and it is kept in JavaScript only so the printed
 * year cannot drift — the markup carries a correct year on its own, so the
 * footer stays right with scripting off.
 *
 * No dependencies, no analytics, no network calls.
 */
(function () {
  'use strict';

  function setYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = year;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setYear);
  } else {
    setYear();
  }
})();

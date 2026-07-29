/* ==========================================================================
   theme.js — dark / light switching

   Preference order: explicit choice this session > OS setting > dark.
   The choice is held in memory only. This handbook is designed to run from
   a local file, where browsers give file:// pages a null origin and block
   persistent storage. Rather than fail silently on some machines and work
   on others, it behaves the same everywhere.
   ========================================================================== */

window.KTM = window.KTM || {};

KTM.theme = (function () {
  'use strict';

  var THEMES = ['dark', 'light'];
  var current = null;
  var root = document.documentElement;

  function systemPrefersLight() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  function apply(name) {
    if (THEMES.indexOf(name) === -1) return;
    current = name;
    root.setAttribute('data-theme', name);

    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var next = name === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      btn.setAttribute('title', 'Switch to ' + next + ' theme');
      btn.querySelector('[data-icon="sun"]').hidden = name === 'light';
      btn.querySelector('[data-icon="moon"]').hidden = name === 'dark';
    }
  }

  function toggle() {
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(systemPrefersLight() ? 'light' : 'dark');

    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);

    // Follow the OS if the rider has not overridden it this session.
    var untouched = true;
    if (btn) btn.addEventListener('click', function () { untouched = false; });

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var handler = function (e) { if (untouched) apply(e.matches ? 'light' : 'dark'); };
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler);
    }
  }

  return { init: init, toggle: toggle, get current() { return current; } };
})();

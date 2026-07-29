/* ==========================================================================
   nav.js — routing, chapter rail, on-this-page contents

   Routing is hash-based (#/chapter-slug[#anchor]) so the whole handbook
   works from a file:// URL with no server and no build step. Every chapter
   lives in the document as a semantic <section>; the router only changes
   which one is visible.
   ========================================================================== */

window.KTM = window.KTM || {};

KTM.nav = (function () {
  'use strict';

  var chapters = [];
  var railLinks = [];
  var tocEl, tocList, crumbEl, railEl, scrimEl;
  var spyObserver = null;

  /* ---- helpers ---------------------------------------------------------- */

  function parseHash() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    if (!raw) return { slug: chapters.length ? chapters[0].id : '', anchor: '' };
    var parts = raw.split('#');
    return { slug: parts[0], anchor: parts[1] || '' };
  }

  function chapterBySlug(slug) {
    for (var i = 0; i < chapters.length; i++) if (chapters[i].id === slug) return chapters[i];
    return null;
  }

  /* ---- on-this-page ----------------------------------------------------- */

  function buildToc(chapter) {
    tocList.innerHTML = '';
    if (spyObserver) { spyObserver.disconnect(); spyObserver = null; }

    var headings = chapter.querySelectorAll('h2[id], h3[id]');
    if (!headings.length) { tocEl.hidden = true; return; }
    tocEl.hidden = false;

    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(headings, function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'toc__link';
      a.href = '#/' + chapter.id + '#' + h.id;
      a.textContent = h.textContent.trim();
      a.dataset.depth = h.tagName === 'H2' ? '2' : '3';
      a.dataset.target = h.id;
      li.appendChild(a);
      frag.appendChild(li);
    });
    tocList.appendChild(frag);

    // Scroll spy. rootMargin pins the "active" band just under the masthead.
    if ('IntersectionObserver' in window) {
      var visible = {};
      spyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
        var first = null;
        Array.prototype.forEach.call(headings, function (h) {
          if (!first && visible[h.id]) first = h.id;
        });
        tocList.querySelectorAll('.toc__link').forEach(function (a) {
          a.classList.toggle('is-current', a.dataset.target === first);
        });
      }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });

      Array.prototype.forEach.call(headings, function (h) { spyObserver.observe(h); });
    }
  }

  /* ---- routing ---------------------------------------------------------- */

  function show(slug, anchor, opts) {
    opts = opts || {};
    var chapter = chapterBySlug(slug) || chapters[0];
    if (!chapter) return;

    chapters.forEach(function (c) {
      var on = c === chapter;
      c.classList.toggle('is-active', on);
      c.hidden = !on;
    });

    railLinks.forEach(function (a) {
      if (a.dataset.slug === chapter.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var title = chapter.dataset.title || '';
    var num = chapter.dataset.number || '';
    crumbEl.innerHTML = 'Ch. ' + num + ' &nbsp;/&nbsp; <b></b>';
    crumbEl.querySelector('b').textContent = title;
    document.title = title + ' · KTM 300 EXC HardEnduro Workshop Handbook';

    buildToc(chapter);

    var active = document.querySelector('.rail__link[aria-current="page"]');
    if (active && active.scrollIntoView) {
      var railBox = railEl.querySelector('.rail__scroll').getBoundingClientRect();
      var box = active.getBoundingClientRect();
      if (box.top < railBox.top || box.bottom > railBox.bottom) {
        active.scrollIntoView({ block: 'nearest' });
      }
    }

    if (anchor) {
      var target = document.getElementById(anchor);
      if (target) {
        // Open a collapsed procedure if the anchor points inside one.
        var details = target.closest('details');
        while (details) { details.open = true; details = details.parentElement.closest('details'); }
        window.requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: opts.instant ? 'auto' : 'smooth', block: 'start' });
        });
        return;
      }
    }
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function route(opts) {
    var h = parseHash();
    show(h.slug, h.anchor, opts);
  }

  function go(slug, anchor) {
    var hash = '#/' + slug + (anchor ? '#' + anchor : '');
    // Re-selecting the current chapter sets no new hash, so no hashchange
    // fires and the drawer would stay open. Close it here instead.
    if (window.location.hash === hash) { route(); setDrawer(false); }
    else window.location.hash = hash;
  }

  /* ---- mobile drawer ---------------------------------------------------- */

  function setDrawer(open) {
    railEl.classList.toggle('is-open', open);
    scrimEl.classList.toggle('is-open', open);
    var toggle = document.getElementById('menu-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open && window.innerWidth < 1024 ? 'hidden' : '';
  }

  /* ---- init ------------------------------------------------------------- */

  function init() {
    chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
    tocEl = document.getElementById('toc');
    tocList = document.getElementById('toc-list');
    crumbEl = document.getElementById('crumb');
    railEl = document.getElementById('rail');
    scrimEl = document.getElementById('scrim');

    buildRail();
    railLinks = Array.prototype.slice.call(document.querySelectorAll('.rail__link'));

    window.addEventListener('hashchange', function () { route(); setDrawer(false); });

    document.getElementById('menu-toggle').addEventListener('click', function () {
      setDrawer(!railEl.classList.contains('is-open'));
    });
    document.getElementById('rail-close').addEventListener('click', function () { setDrawer(false); });
    scrimEl.addEventListener('click', function () { setDrawer(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrawer(false);
    });

    // Growing past the drawer breakpoint with it open would otherwise strand
    // body{overflow:hidden}, leaving the desktop layout unscrollable.
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && railEl.classList.contains('is-open')) setDrawer(false);
    });

    // Intercept in-page cross references so they route rather than jump.
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#/"]');
      if (!a) return;
      e.preventDefault();
      var parts = a.getAttribute('href').replace(/^#\//, '').split('#');
      go(parts[0], parts[1] || '');
    });

    route({ instant: true });
  }

  /** The rail is generated from the chapters themselves: one source of truth. */
  function buildRail() {
    var scroll = railEl.querySelector('.rail__scroll');
    var frag = document.createDocumentFragment();
    var lastPart = null;

    chapters.forEach(function (c) {
      if (c.dataset.part && c.dataset.part !== lastPart) {
        lastPart = c.dataset.part;
        var h = document.createElement('div');
        h.className = 'rail__part';
        h.textContent = lastPart;
        frag.appendChild(h);
      }
      var a = document.createElement('a');
      a.className = 'rail__link';
      a.href = '#/' + c.id;
      a.dataset.slug = c.id;
      a.innerHTML = '<span class="rail__num"></span><span class="rail__label"></span>';
      a.querySelector('.rail__num').textContent = String(c.dataset.number).padStart(2, '0');
      a.querySelector('.rail__label').textContent = c.dataset.title;
      frag.appendChild(a);
    });

    scroll.appendChild(frag);
  }

  return { init: init, go: go, get chapters() { return chapters; } };
})();

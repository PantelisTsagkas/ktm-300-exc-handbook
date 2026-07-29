/* ==========================================================================
   search.js — instant search

   The index is built once from the rendered document, so content only ever
   has to be authored in one place: the HTML. Torque rows are folded in from
   the data module because a fastener name is the thing you actually search
   for at a bench ("swingarm pivot", "rear spindle").

   Scoring is deliberately simple and legible: exact phrase beats prefix,
   prefix beats substring, title beats body. Fuzzy matching would find more
   and be trusted less.
   ========================================================================== */

window.KTM = window.KTM || {};

KTM.search = (function () {
  'use strict';

  var index = [];
  var overlay, input, results, footEl;
  var activeIndex = -1;
  var currentHits = [];

  var KIND_ORDER = { chapter: 0, section: 1, procedure: 2, torque: 3, spec: 4 };

  /* ---- index ------------------------------------------------------------ */

  function push(entry) { index.push(entry); }

  function build() {
    index = [];

    KTM.nav.chapters.forEach(function (chapter) {
      var chTitle = chapter.dataset.title;
      var chNum = chapter.dataset.number;

      push({
        kind: 'chapter',
        title: chTitle,
        path: 'Chapter ' + chNum,
        slug: chapter.id,
        anchor: '',
        haystack: (chTitle + ' ' + (chapter.dataset.keywords || '')).toLowerCase()
      });

      chapter.querySelectorAll('h2[id], h3[id]').forEach(function (h) {
        push({
          kind: 'section',
          title: h.textContent.trim(),
          path: 'Ch. ' + chNum + ' · ' + chTitle,
          slug: chapter.id,
          anchor: h.id,
          haystack: h.textContent.trim().toLowerCase()
        });
      });

      chapter.querySelectorAll('details.procedure[id]').forEach(function (d) {
        var heading = d.querySelector('.procedure__heading');
        var kw = d.dataset.keywords || '';
        push({
          kind: 'procedure',
          title: heading ? heading.textContent.trim() : d.id,
          path: 'Ch. ' + chNum + ' · ' + chTitle,
          slug: chapter.id,
          anchor: d.id,
          haystack: ((heading ? heading.textContent : '') + ' ' + kw).toLowerCase()
        });
      });

      chapter.querySelectorAll('tr[data-spec]').forEach(function (tr) {
        var cells = tr.querySelectorAll('th, td');
        if (cells.length < 2) return;
        var name = cells[0].textContent.trim();
        var value = cells[1].textContent.trim();
        push({
          kind: 'spec',
          title: name,
          meta: value,
          path: 'Ch. ' + chNum + ' · ' + chTitle,
          slug: chapter.id,
          anchor: tr.closest('[id]') ? tr.closest('[id]').id : '',
          haystack: (name + ' ' + value).toLowerCase()
        });
      });
    });

    // Torque rows: search by fastener name, thread size or torque figure.
    window.TorqueData.rows.forEach(function (r) {
      push({
        kind: 'torque',
        title: r.name,
        meta: r.nm + ' Nm · ' + r.thread,
        path: 'Torque database · ' + window.TorqueData.labelFor(r.sys),
        slug: 'torque-specifications',
        anchor: 'torque-db',
        torqueId: r.id,
        haystack: (r.name + ' ' + r.thread + ' ' + r.nm + ' nm ' +
                   window.TorqueData.labelFor(r.sys) + ' ' + (r.locker || '')).toLowerCase()
      });
    });
  }

  /* ---- query ------------------------------------------------------------ */

  function score(entry, q) {
    var hay = entry.haystack;
    var title = entry.title.toLowerCase();
    if (title === q) return 1000;
    if (title.indexOf(q) === 0) return 800;
    var wordStart = new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (wordStart.test(title)) return 600;
    if (title.indexOf(q) > -1) return 400;
    if (wordStart.test(hay)) return 200;
    if (hay.indexOf(q) > -1) return 100;
    return 0;
  }

  function query(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) return [];

    var terms = q.split(/\s+/);
    var hits = [];

    index.forEach(function (e) {
      var total = 0;
      for (var i = 0; i < terms.length; i++) {
        var s = score(e, terms[i]);
        if (s === 0) { total = 0; break; }
        total += s;
      }
      if (total > 0) hits.push({ entry: e, score: total });
    });

    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return KIND_ORDER[a.entry.kind] - KIND_ORDER[b.entry.kind];
    });

    return hits.slice(0, 40);
  }

  /* ---- rendering -------------------------------------------------------- */

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(text, q) {
    var safe = escapeHtml(text);
    var terms = q.trim().split(/\s+/).filter(function (t) { return t.length > 1; });
    terms.forEach(function (t) {
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      safe = safe.replace(re, '<mark>$1</mark>');
    });
    return safe;
  }

  function render(hits, q) {
    currentHits = hits;
    activeIndex = hits.length ? 0 : -1;
    results.innerHTML = '';

    if (!q || q.trim().length < 2) {
      results.innerHTML = '<p class="search__empty">Search chapters, procedures, torque values and specifications.<br>Try <code>swingarm</code>, <code>25 Nm</code> or <code>air filter</code>.</p>';
      return;
    }
    if (!hits.length) {
      results.innerHTML = '<p class="search__empty">No match for &ldquo;' + escapeHtml(q) + '&rdquo;.<br>Check the spelling, or search a broader term.</p>';
      return;
    }

    var lastKind = null;
    var frag = document.createDocumentFragment();

    hits.forEach(function (h, i) {
      var e = h.entry;
      if (e.kind !== lastKind) {
        lastKind = e.kind;
        var g = document.createElement('div');
        g.className = 'search__group';
        g.textContent = { chapter: 'Chapters', section: 'Sections', procedure: 'Procedures',
                          torque: 'Torque values', spec: 'Specifications' }[e.kind];
        frag.appendChild(g);
      }

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search__hit' + (i === 0 ? ' is-active' : '');
      btn.dataset.i = i;
      btn.innerHTML =
        '<span><span class="search__hit-title">' + highlight(e.title, q) + '</span>' +
        (e.meta ? ' <span class="search__hit-path">' + escapeHtml(e.meta) + '</span>' : '') +
        '<br><span class="search__hit-path">' + escapeHtml(e.path) + '</span></span>' +
        '<span class="search__hit-kind">&rarr;</span>';
      btn.addEventListener('click', function () { goTo(e); });
      frag.appendChild(btn);
    });

    results.appendChild(frag);
  }

  function setActive(i) {
    var nodes = results.querySelectorAll('.search__hit');
    if (!nodes.length) return;
    activeIndex = (i + nodes.length) % nodes.length;
    nodes.forEach(function (n, idx) { n.classList.toggle('is-active', idx === activeIndex); });
    nodes[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function goTo(entry) {
    close();
    if (entry.kind === 'torque' && KTM.torqueDb) {
      KTM.torqueDb.focus(entry.torqueId);
    }
    KTM.nav.go(entry.slug, entry.anchor);
  }

  /* ---- open / close ----------------------------------------------------- */

  function open() {
    overlay.classList.add('is-open');
    input.value = '';
    render([], '');
    input.focus();
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function init() {
    overlay = document.getElementById('search');
    input = document.getElementById('search-input');
    results = document.getElementById('search-results');

    build();

    var debounce;
    input.addEventListener('input', function () {
      window.clearTimeout(debounce);
      var v = input.value;
      debounce = window.setTimeout(function () { render(query(v), v); }, 60);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var nodes = results.querySelectorAll('.search__hit');
        if (nodes[activeIndex]) nodes[activeIndex].click();
      }
    });

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('search-trigger').addEventListener('click', open);

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
      else if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); open();
      }
      else if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  return { init: init, open: open, close: close, rebuild: build };
})();

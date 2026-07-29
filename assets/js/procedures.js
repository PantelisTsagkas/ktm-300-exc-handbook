/* ==========================================================================
   procedures.js — procedure controls, printing, checklists, logbook

   Printing has three shapes and they are genuinely different jobs:
     - Print chapter: what you are reading now.
     - Print handbook: everything, for a binder.
     - Print card: one procedure or one card, isolated, for the bench.
   ========================================================================== */

window.KTM = window.KTM || {};

/* --------------------------------------------------------------------------
   Difficulty pips: authored as data-difficulty="3" and rendered, so a
   procedure's markup never carries five hand-written <i> elements.
   -------------------------------------------------------------------------- */
KTM.procedures = (function () {
  'use strict';

  function renderPips() {
    document.querySelectorAll('[data-difficulty]').forEach(function (el) {
      var n = parseInt(el.dataset.difficulty, 10) || 0;
      var wrap = document.createElement('span');
      wrap.className = 'pips';
      wrap.setAttribute('role', 'img');
      wrap.setAttribute('aria-label', 'Difficulty ' + n + ' of 5');
      for (var i = 1; i <= 5; i++) {
        var pip = document.createElement('i');
        if (i <= n) pip.className = 'on';
        wrap.appendChild(pip);
      }
      el.appendChild(wrap);
    });
  }

  function bindExpandAll() {
    document.querySelectorAll('[data-expand-all]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var scope = btn.closest('.chapter') || document;
        var all = scope.querySelectorAll('details.procedure');
        var anyClosed = Array.prototype.some.call(all, function (d) { return !d.open; });
        all.forEach(function (d) { d.open = anyClosed; });
        btn.querySelector('[data-label]').textContent = anyClosed ? 'Collapse all' : 'Expand all';
      });
    });
  }

  function init() {
    renderPips();
    bindExpandAll();
  }

  return { init: init };
})();

/* --------------------------------------------------------------------------
   Printing
   -------------------------------------------------------------------------- */
KTM.print = (function () {
  'use strict';

  function cleanup() {
    document.body.classList.remove('print-all', 'print-card');
    document.querySelectorAll('.print-target, .print-ancestor').forEach(function (n) {
      n.classList.remove('print-target', 'print-ancestor');
    });
  }

  /** Tag every element between the target and its chapter, inclusive. */
  function markAncestors(el) {
    var node = el.parentElement;
    while (node && node !== document.body) {
      node.classList.add('print-ancestor');
      if (node.classList.contains('chapter')) break;
      node = node.parentElement;
    }
  }

  function chapter() {
    cleanup();
    window.print();
  }

  function all() {
    cleanup();
    document.body.classList.add('print-all');
    // Open every procedure: a collapsed step is a missing step on paper.
    document.querySelectorAll('details').forEach(function (d) { d.dataset.wasOpen = d.open; d.open = true; });
    window.print();
  }

  function card(el) {
    cleanup();
    el.classList.add('print-target');
    markAncestors(el);
    document.body.classList.add('print-card');
    var details = el.closest('details');
    if (el.tagName === 'DETAILS') el.open = true;
    if (details) details.open = true;
    window.print();
  }

  function init() {
    var btnChapter = document.getElementById('print-chapter');
    var btnAll = document.getElementById('print-all');
    if (btnChapter) btnChapter.addEventListener('click', chapter);
    if (btnAll) btnAll.addEventListener('click', all);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-print-card]');
      if (!btn) return;
      var sel = btn.dataset.printCard;
      var target = sel ? document.getElementById(sel) : btn.closest('.wcard, details.procedure, .card');
      if (target) card(target);
    });

    window.addEventListener('afterprint', function () {
      document.querySelectorAll('details[data-was-open]').forEach(function (d) {
        d.open = d.dataset.wasOpen === 'true';
        delete d.dataset.wasOpen;
      });
      cleanup();
    });
  }

  return { init: init, chapter: chapter, all: all, card: card };
})();

/* --------------------------------------------------------------------------
   Checklists — live count, reset, and "check all"
   -------------------------------------------------------------------------- */
KTM.checklists = (function () {
  'use strict';

  function update(list) {
    var boxes = list.querySelectorAll('input[type="checkbox"]');
    var done = list.querySelectorAll('input[type="checkbox"]:checked').length;
    var meter = document.querySelector('[data-checklist-count="' + list.id + '"]');
    if (meter) meter.textContent = done + ' / ' + boxes.length + ' complete';
  }

  function init() {
    document.querySelectorAll('.checklist[id]').forEach(function (list) {
      list.addEventListener('change', function () { update(list); });
      update(list);
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-checklist-reset]');
      if (!btn) return;
      var list = document.getElementById(btn.dataset.checklistReset);
      if (!list) return;
      list.querySelectorAll('input[type="checkbox"]').forEach(function (b) { b.checked = false; });
      update(list);
    });
  }

  return { init: init };
})();

/* --------------------------------------------------------------------------
   Logbook

   Entries are held in memory and exported to a JSON file you keep yourself.
   No browser storage: a file:// page has a null origin and browsers block
   localStorage there, so persistence would work on one machine and silently
   fail on the next. An exported file is portable, diffable and survives a
   cleared cache, which is what a service history actually needs.
   -------------------------------------------------------------------------- */
KTM.logbook = (function () {
  'use strict';

  var entries = [];
  var tbody, form, emptyEl;

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    tbody.innerHTML = '';
    emptyEl.hidden = entries.length > 0;

    entries.slice().sort(function (a, b) {
      return (b.hours || 0) - (a.hours || 0);
    }).forEach(function (e, i) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="num">' + esc(fmtDate(e.date)) + '</td>' +
        '<td class="num">' + esc(e.hours) + '</td>' +
        '<th scope="row">' + esc(e.work) + '</th>' +
        '<td>' + esc(e.parts || '&mdash;') + '</td>' +
        '<td>' + esc(e.by || '&mdash;') + '</td>' +
        '<td class="no-print"><button type="button" class="btn" data-remove="' + e.id + '">Remove</button></td>';
      tbody.appendChild(tr);
    });
  }

  function add(data) {
    entries.push({
      id: 'e' + Date.now() + Math.random().toString(36).slice(2, 6),
      date: data.date, hours: data.hours, work: data.work, parts: data.parts, by: data.by
    });
    render();
  }

  function download(filename, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function toCsv() {
    var head = ['date', 'engine_hours', 'work', 'parts', 'by'];
    var lines = [head.join(',')];
    entries.forEach(function (e) {
      lines.push([e.date, e.hours, e.work, e.parts, e.by].map(function (v) {
        return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      }).join(','));
    });
    return lines.join('\n');
  }

  function init() {
    tbody = document.getElementById('logbook-tbody');
    if (!tbody) return;
    form = document.getElementById('logbook-form');
    emptyEl = document.getElementById('logbook-empty');

    var today = new Date().toISOString().slice(0, 10);
    var dateField = document.getElementById('log-date');
    if (dateField) dateField.value = today;

    document.getElementById('log-add').addEventListener('click', function () {
      var work = document.getElementById('log-work').value.trim();
      if (!work) {
        document.getElementById('log-work').focus();
        return;
      }
      add({
        date: document.getElementById('log-date').value,
        hours: document.getElementById('log-hours').value,
        work: work,
        parts: document.getElementById('log-parts').value.trim(),
        by: document.getElementById('log-by').value.trim()
      });
      document.getElementById('log-work').value = '';
      document.getElementById('log-parts').value = '';
    });

    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove]');
      if (!btn) return;
      entries = entries.filter(function (x) { return x.id !== btn.dataset.remove; });
      render();
    });

    document.getElementById('log-export-json').addEventListener('click', function () {
      download('ktm-300exc-logbook.json', JSON.stringify({ vehicle: '300 EXC HardEnduro', entries: entries }, null, 2), 'application/json');
    });

    document.getElementById('log-export-csv').addEventListener('click', function () {
      download('ktm-300exc-logbook.csv', toCsv(), 'text/csv');
    });

    document.getElementById('log-import').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          var incoming = Array.isArray(parsed) ? parsed : parsed.entries;
          if (!Array.isArray(incoming)) throw new Error('shape');
          entries = incoming.map(function (x, i) {
            return {
              id: x.id || 'i' + i + Date.now(),
              date: x.date || '', hours: x.hours || '', work: x.work || '',
              parts: x.parts || '', by: x.by || ''
            };
          });
          render();
        } catch (err) {
          window.alert('That file is not a logbook export. Choose a JSON file saved from this handbook.');
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });

    render();
  }

  return { init: init };
})();

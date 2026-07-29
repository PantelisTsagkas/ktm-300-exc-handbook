/* ==========================================================================
   torque-db.js — filterable torque table

   Filters compose: subsystem chips AND thread chips AND threadlocker AND
   free text. Sorting is by column header. State lives in the URL query
   portion of the hash so a filtered view can be sent to someone else.
   ========================================================================== */

window.KTM = window.KTM || {};

KTM.torqueDb = (function () {
  'use strict';

  var state = { sys: [], thread: [], locker: 'any', q: '', sort: 'name', dir: 1 };
  var tbody, countEl, searchField, sysWrap, threadWrap, lockerWrap;
  var flashId = null;

  function threadFamily(thread) {
    var m = /^M(\d+(?:\.\d+)?)/.exec(thread);
    if (m) return 'M' + m[1];
    if (/EJOT/i.test(thread)) return 'EJOT';
    return 'Other';
  }

  function threadFamilies() {
    var seen = {}, out = [];
    window.TorqueData.rows.forEach(function (r) {
      var f = threadFamily(r.thread);
      if (!seen[f]) { seen[f] = true; out.push(f); }
    });
    return out.sort(function (a, b) {
      var na = parseFloat(a.slice(1)), nb = parseFloat(b.slice(1));
      if (isNaN(na) && isNaN(nb)) return a.localeCompare(b);
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return na - nb;
    });
  }

  function matches(r) {
    if (state.sys.length && state.sys.indexOf(r.sys) === -1) return false;
    if (state.thread.length && state.thread.indexOf(threadFamily(r.thread)) === -1) return false;
    if (state.locker === 'any-locker' && !r.locker) return false;
    if (state.locker === '243' && r.locker !== '243') return false;
    if (state.locker === '2701' && r.locker !== '2701') return false;
    if (state.locker === 'none' && r.locker) return false;
    if (state.q) {
      var hay = (r.name + ' ' + r.thread + ' ' + r.nm + ' ' + (r.flag || '')).toLowerCase();
      var terms = state.q.toLowerCase().split(/\s+/);
      for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  function sorted(list) {
    var key = state.sort, dir = state.dir;
    return list.slice().sort(function (a, b) {
      var va, vb;
      if (key === 'nm') { va = a.nm; vb = b.nm; }
      else if (key === 'thread') { va = threadFamily(a.thread); vb = threadFamily(b.thread); }
      else if (key === 'sys') { va = window.TorqueData.labelFor(a.sys); vb = window.TorqueData.labelFor(b.sys); }
      else { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return a.name.localeCompare(b.name);
    });
  }

  function render() {
    var list = sorted(window.TorqueData.rows.filter(matches));
    tbody.innerHTML = '';

    if (!list.length) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="text-align:center;color:var(--text-faint);padding:2rem">' +
                     'No fastener matches these filters. Clear one and try again.</td>';
      tbody.appendChild(tr);
    } else {
      var frag = document.createDocumentFragment();
      list.forEach(function (r) {
        var tr = document.createElement('tr');
        tr.id = 'tq-' + r.id;
        tr.innerHTML =
          '<th scope="row"><span class="locker-dot" data-locker="' + (r.locker || '') + '"></span>' +
            r.name +
            (r.flag ? ' <span class="badge">' + r.flag + '</span>' : '') +
          '</th>' +
          '<td class="num">' + r.thread + '</td>' +
          '<td class="num"><strong>' + r.nm + '</strong> Nm</td>' +
          '<td class="num alt">' + window.TorqueData.toLbFt(r.nm) + ' lb-ft</td>' +
          '<td>' + (r.locker ? 'Loctite ' + r.locker : '&mdash;') + '</td>';
        frag.appendChild(tr);
      });
      tbody.appendChild(frag);
    }

    countEl.textContent = list.length + ' of ' + window.TorqueData.rows.length + ' fasteners';

    if (flashId) {
      var row = document.getElementById('tq-' + flashId);
      if (row) {
        row.style.transition = 'background 1.2s ease';
        row.style.background = 'var(--ktm-orange-wash)';
        row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        window.setTimeout(function () { row.style.background = ''; }, 1600);
      }
      flashId = null;
    }
  }

  function chip(label, pressed, onToggle) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip-toggle';
    b.textContent = label;
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', function () {
      var next = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(next));
      onToggle(next, b);
      render();
    });
    return b;
  }

  function buildFilters() {
    window.TorqueData.subsystems.forEach(function (s) {
      sysWrap.appendChild(chip(s.label, false, function (on) {
        var i = state.sys.indexOf(s.key);
        if (on && i === -1) state.sys.push(s.key);
        if (!on && i > -1) state.sys.splice(i, 1);
      }));
    });

    threadFamilies().forEach(function (f) {
      threadWrap.appendChild(chip(f, false, function (on) {
        var i = state.thread.indexOf(f);
        if (on && i === -1) state.thread.push(f);
        if (!on && i > -1) state.thread.splice(i, 1);
      }));
    });

    [['Any', 'any'], ['Needs threadlocker', 'any-locker'], ['243', '243'], ['2701', '2701'], ['None', 'none']]
      .forEach(function (pair) {
        var b = chip(pair[0], pair[1] === 'any', function (on, btn) {
          lockerWrap.querySelectorAll('.chip-toggle').forEach(function (o) {
            if (o !== btn) o.setAttribute('aria-pressed', 'false');
          });
          state.locker = on ? pair[1] : 'any';
          if (!on) lockerWrap.querySelector('.chip-toggle').setAttribute('aria-pressed', 'true');
        });
        lockerWrap.appendChild(b);
      });
  }

  function focus(id) {
    var r = window.TorqueData.find(id);
    if (!r) return;
    // Clear filters so the requested fastener is guaranteed to be visible.
    state.sys = []; state.thread = []; state.locker = 'any'; state.q = '';
    if (searchField) searchField.value = '';
    document.querySelectorAll('#torque-filters .chip-toggle').forEach(function (b, i) {
      b.setAttribute('aria-pressed', 'false');
    });
    var firstLocker = lockerWrap && lockerWrap.querySelector('.chip-toggle');
    if (firstLocker) firstLocker.setAttribute('aria-pressed', 'true');
    flashId = id;
    render();
  }

  function init() {
    tbody = document.getElementById('torque-tbody');
    if (!tbody) return;
    countEl = document.getElementById('torque-count');
    searchField = document.getElementById('torque-search');
    sysWrap = document.getElementById('filter-sys');
    threadWrap = document.getElementById('filter-thread');
    lockerWrap = document.getElementById('filter-locker');

    buildFilters();

    searchField.addEventListener('input', function () {
      state.q = searchField.value.trim();
      render();
    });

    document.getElementById('torque-reset').addEventListener('click', function () {
      state = { sys: [], thread: [], locker: 'any', q: '', sort: 'name', dir: 1 };
      searchField.value = '';
      document.querySelectorAll('#torque-filters .chip-toggle').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      lockerWrap.querySelector('.chip-toggle').setAttribute('aria-pressed', 'true');
      // Reset restores the default sort, so the announced sort state has to go
      // back with it. Without this the previously sorted column keeps claiming
      // a direction the rows no longer follow.
      document.querySelectorAll('#torque-table th[data-sort]').forEach(function (th) {
        th.setAttribute('aria-sort', th.dataset.sort === 'name' ? 'ascending' : 'none');
      });
      render();
    });

    document.querySelectorAll('#torque-table th[data-sort]').forEach(function (th) {
      th.style.cursor = 'pointer';
      // Deliberately no role="button": that would override the implicit
      // columnheader role, and aria-sort is only meaningful on a columnheader.
      // The header stays a header and carries its own keyboard handler below.
      th.setAttribute('tabindex', '0');
      var activate = function () {
        var key = th.dataset.sort;
        state.dir = state.sort === key ? -state.dir : 1;
        state.sort = key;
        document.querySelectorAll('#torque-table th[data-sort]').forEach(function (o) {
          o.setAttribute('aria-sort', 'none');
        });
        th.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
        render();
      };
      th.addEventListener('click', activate);
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });

    render();
  }

  return { init: init, focus: focus };
})();

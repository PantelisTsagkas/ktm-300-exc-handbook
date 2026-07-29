/* ==========================================================================
   app.js — bootstrap

   Load order matters: nav builds the chapter list that search indexes, and
   the torque database must exist before search folds it in.

   Classic scripts, not ES modules, on purpose: browsers refuse module
   imports over file://, and this handbook has to open by double-clicking
   index.html on a laptop in a van with no network.
   ========================================================================== */

(function () {
  'use strict';

  function boot() {
    KTM.theme.init();
    KTM.nav.init();
    KTM.torqueDb.init();
    KTM.procedures.init();
    KTM.checklists.init();
    KTM.logbook.init();
    KTM.print.init();
    KTM.search.init();

    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

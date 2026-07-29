# KTM 300 EXC HardEnduro Workshop Handbook

**Status: ACTIVE**

An offline, dependency-free workshop handbook for the KTM 300 EXC HardEnduro
(2025/2026). Zero runtime dependencies, zero network requests, no framework.

Two ways to run it:

- **Served** — the repo root is the publish directory. `python3 -m http.server`
  and open `index.html`, or point any static host at it.
- **Offline single file** — `dist/ktm-300-exc-handbook.html` is one
  self-contained document. Copy it to a laptop and open it by double-clicking,
  no server and no connection.

> Unofficial. Not affiliated with, endorsed by, or produced by KTM AG.
> Torque figures are transcribed from published owner documentation; verify
> against your own VIN-specific manual before working on the bike.

## Structure

```
ktm_300_exc/
├── index.html                  32 chapters as semantic <section> elements
├── assets/
│   ├── css/
│   │   ├── tokens.css          colour, type, spacing, motion tokens
│   │   ├── base.css            reset, typography, primitives
│   │   ├── layout.css          app shell, rail, content, sticky TOC
│   │   ├── components.css      torque chips, callouts, procedures, cards
│   │   └── print.css           A4 output, three print modes
│   └── js/
│       ├── data.torque.js      121-row torque database
│       ├── theme.js            dark / light
│       ├── nav.js              hash router, chapter rail, TOC scroll spy
│       ├── search.js           instant search index and overlay
│       ├── torque-db.js        filtering, sorting, deep-link focus
│       ├── procedures.js       procedures, printing, checklists, logbook
│       └── app.js              bootstrap
├── tools/
│   ├── build.py                inlines the tree into the single-file bundle
│   └── css-audit.py            static cascade checks
├── dist/
│   └── ktm-300-exc-handbook.html   build output, committed on purpose
└── README.md
```

## Build

The served tree is the source. The single file is generated from it, so the two
cannot drift:

```
python3 tools/build.py            # regenerate dist/
python3 tools/build.py --check    # fail if dist/ is stale
python3 tools/css-audit.py        # static cascade checks
```

## Data provenance

Every figure in the handbook is labelled:

| Badge | Meaning |
|---|---|
| **Manual** | Transcribed from KTM Owner's Manual 2026, 250/300 EXC family, item no. 3240239en |
| **Workshop** | Practical guidance written for this handbook: estimated times, difficulty ratings, common mistakes, hard enduro setup |
| **Dealer** | Work KTM restricts to an authorised workshop, or that needs the diagnostic tool |

All 121 torque values and all 33 distinct newton-metre figures were verified
against the source text programmatically. The pound-feet column reproduces
KTM's own rounding convention (one more decimal place than the metric value
carries), and every conversion matches the printed table verbatim.

**Known ambiguity:** the manual splits several triple clamp and steering stem
torques between "all standard models" and "all special models", without stating
which bucket HardEnduro falls into. Both rows appear, labelled. Verify against
your VIN-specific documentation before torquing those fasteners.

**Scope:** this is a maintenance and setup handbook derived from owner
documentation. It is not a repair manual. Engine internals and suspension
internals are marked *Dealer* and are not covered.

## Features

- **Search** — `⌘K`, `Ctrl+K` or `/`. Indexes chapters, sections, procedures,
  specification rows and every torque value. Searching `80 nm` or `swingarm`
  both work.
- **Torque database** — chapter 10. Filter by subsystem, thread family and
  threadlocker requirement; sort any column. Search results for a fastener
  deep-link into the table and highlight the row.
- **Three print modes** — current chapter (masthead button), complete handbook
  (chapter 32), and single bench cards (*Print card* buttons). Procedures always
  print fully expanded, and checklist boxes print as hand-fillable squares.
- **Logbook** — chapter 32. Add entries, export to JSON or CSV, import a
  previous export.

## Engineering notes and trade-offs

**Classic scripts, not ES modules.** Browsers refuse module imports over
`file://`. Since the whole point is opening `index.html` on a laptop in a van
with no network, the JS uses classic scripts behind a `KTM` namespace. Modular
by file and responsibility, not by `import`.

**Content in HTML, torque data in JS.** Chapter content is authored as semantic
HTML so it is readable, printable and indexable in one place. The torque table
is data because it needs filtering and sorting, which markup cannot do. Search
builds its index from the rendered DOM plus that one data module, so content
never has to be maintained twice.

**No browser storage.** `file://` pages get a null origin and browsers block
`localStorage` there, so persistence would work on one machine and silently lose
data on another. The logbook holds entries in memory and exports to a file you
keep. A JSON export is portable, diffable and survives a cleared cache, which is
what a service history actually needs — put it in a git repo and you have a
versioned one.

**Single HTML file.** Splitting chapters into separate files would need `fetch`,
which `file://` also blocks. One document, routed client-side.

## Accessibility and quality floor

Responsive to 360px, keyboard navigable throughout, visible focus rings,
`prefers-reduced-motion` respected, `prefers-color-scheme` followed until you
override it, sortable table headers exposed with `aria-sort` and keyboard
activation, live regions on filter and checklist counts.

## Verification

What is checked in this repo today:

| Check | How | Status |
|---|---|---|
| CSS cascade and grid integrity | `python3 tools/css-audit.py`, 12 assertions | passing |
| Bundle matches source | `python3 tools/build.py --check` | passing |
| Boot, routing, search, torque filtering | manual browser pass, recorded below | passing |

Last manual pass, 2026-07-29, Chromium, served from the repo root: 32 chapters
routed, 121 torque rows rendered, subsystem and thread filters narrow correctly
(Brakes 9, Brakes+Wheels 16, M8 24) and reset restores all 121, search returns
hits for `swingarm`, `80 nm`, `air filter` and `coolant` and zero for a nonsense
term, and the `dist/` bundle boots identically with zero external requests.

**Not yet automated.** An earlier draft of this README claimed 26 headless
checks; that harness is not in this repo. The browser behaviour above is
currently verified by hand, and automating it is the first item in *Next*.

## Next

- [ ] Port the manual browser pass into Playwright specs and run them in CI.
- [ ] Fix `role="button"` on sortable `<th>` elements: it overrides the implicit
      `columnheader` role, which is what makes `aria-sort` meaningful, so the
      sort state is currently not exposed to assistive tech at all.
- [ ] Reset button should clear stale `aria-sort` attributes. It restores the
      row order but leaves the previously sorted header still announcing its
      old direction.
- [ ] Feature-detect `localStorage` so theme and logbook persist when served
      over a real origin, keeping the in-memory path as the `file://` fallback.
- [ ] Service worker and web app manifest: installable and offline-capable
      without giving up the served version.
- [ ] Favicon (currently 404s).

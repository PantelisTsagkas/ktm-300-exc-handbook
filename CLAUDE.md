# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An offline workshop handbook for the KTM 300 EXC HardEnduro. Static HTML, CSS
and classic JS. No framework, no package manager, no runtime dependencies, no
network requests at all.

## Commands

```
python3 -m http.server            # serve the repo root, open index.html
python3 tools/build.py            # regenerate dist/ktm-300-exc-handbook.html
python3 tools/build.py --check    # fail if dist/ is stale against source
python3 tools/css-audit.py        # 12 static cascade and grid assertions
```

There is no test runner, no npm and no linter. Those two Python scripts are the
entire automated check surface, and neither takes a filter argument, so there is
no "run a single test". Runtime behaviour is verified by a manual browser pass,
itemised in the README under *Verification*. Do not invent a test command.

## Two outputs, one source

The served tree (`index.html` + `assets/`) is the source of truth.
`dist/ktm-300-exc-handbook.html` is generated from it by `tools/build.py`, is
committed on purpose, and must never be hand-edited. Any change to `index.html`,
`assets/css/*` or `assets/js/*` requires a rebuild in the same commit, or
`build.py --check` fails.

## Load order is load-bearing in two places

1. **CSS.** `index.html` declares `tokens → base → layout → components → print`.
   `build.py` inlines them in exactly that order to preserve the cascade, and
   `tools/css-audit.py` hardcodes the same list in `LOAD_ORDER`. Adding or
   reordering a stylesheet means editing `index.html` **and** `css-audit.py`,
   then rebuilding. That coupling is not visible from any single file.
2. **JS.** `app.js` boots modules in a fixed sequence: `nav` builds the chapter
   list that `search` indexes, and `data.torque.js` must be loaded before
   `search` folds torque rows into its index.

## file:// constraints drive the architecture

The handbook has to open by double-clicking a file on a laptop with no network.
Everything below follows from that, and any new feature must survive it:

- **Classic scripts behind a `window.KTM` namespace**, not ES modules. Browsers
  refuse module imports over `file://`. Each JS file assigns one property:
  `KTM.theme`, `KTM.nav`, `KTM.search`, `KTM.torqueDb`, and `procedures.js`
  contributes four (`procedures`, `print`, `checklists`, `logbook`).
- **No `localStorage`.** `file://` pages get a null origin and browsers block it
  there. The logbook holds entries in memory and exports to JSON/CSV instead.
- **No `fetch`.** Blocked on `file://`, which is why all 32 chapters live in one
  document routed client-side by hash.

## Content vs data

Chapter content is authored as semantic HTML in `index.html` so it is readable,
printable and indexable in one place. Only the 121-row torque table lives in JS
(`assets/js/data.torque.js`), because it needs filtering and sorting. `search.js`
builds its index from the rendered DOM plus that one data module, so content is
never maintained in two places. Keep it that way: do not mirror chapter prose
into a JS data structure.

## Content conventions

Every figure carries a provenance badge, and these are load-bearing, not
decoration:

- **Manual** - transcribed from KTM Owner's Manual 2026, item no. 3240239en.
- **Workshop** - practical guidance written for this handbook.
- **Dealer** - work KTM restricts to an authorised workshop.

Torque figures were transcribed and verified against the source text
programmatically, including KTM's own lb-ft rounding convention. Do not invent,
recalculate or "correct" a torque value. If something looks wrong, flag it
rather than editing it.

## Deploy

Netlify, `publish = "."`, no build step beyond the staleness gate. Routing is
hash-based and every path is a real file, so there is deliberately no SPA
catch-all redirect - a `/* /index.html 200` rule would only mask genuine 404s.
See `netlify.toml`.

Anything added to the `<head>` that references an external file must also be
handled by `build.py`, which today only inlines `<link rel="stylesheet">` and
`<script src>`. A `<link rel="icon" href="...">` would silently survive into the
bundle as a broken external request. Favicons go in as `data:` URIs.

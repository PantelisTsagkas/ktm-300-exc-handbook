#!/usr/bin/env python3
"""
css-audit.py — static cascade checks for the workshop handbook.

jsdom runs the JavaScript but does no layout and applies no CSS, so the two
bugs that blanked the page (a grid-row span resolving against a non-existent
explicit grid, and a later `.btn` rule out-cascading an earlier `.menu-toggle`
rule) were both invisible to the existing test suite. This closes that gap.

Checks:
  1. For a set of key elements, resolve which `display` declaration wins across
     all stylesheets in load order, and compare against expectations.
  2. Flag any `grid-row`/`grid-column` using the `-1` end line on a container
     that declares no matching explicit track list.
  3. Report every declaration that loses the cascade to a later, equally
     specific rule, so future conflicts surface as warnings.
"""

import re
import sys
from pathlib import Path

CSS_DIR = Path(__file__).resolve().parent.parent / "assets" / "css"
LOAD_ORDER = ["tokens.css", "base.css", "layout.css", "components.css", "print.css"]


def strip_comments(text):
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)


def specificity(selector):
    """(ids, classes+attrs+pseudo-classes, elements). Good enough for this sheet."""
    sel = re.sub(r"::[a-z-]+", " ", selector)
    ids = len(re.findall(r"#[\w-]+", sel))
    classes = len(re.findall(r"\.[\w-]+", sel)) + \
              len(re.findall(r"\[[^\]]+\]", sel)) + \
              len(re.findall(r":(?!:)[a-z-]+", sel))
    elements = len(re.findall(r"(?:^|[\s>+~])([a-zA-Z][\w-]*)", sel))
    return (ids, classes, elements)


_ORDER = [0]  # global document order, must span all stylesheets


def parse(text, source, media=None):
    """Yield (selector, prop, value, important, specificity, order, source, media)."""
    out = []
    text = strip_comments(text)
    order = _ORDER

    def walk(chunk, media_ctx, base):
        i = 0
        while True:
            m = re.search(r"([^{}]+)\{", chunk[i:])
            if not m:
                break
            head = m.group(1).strip()
            start = i + m.end()
            depth, j = 1, start
            while j < len(chunk) and depth:
                if chunk[j] == "{":
                    depth += 1
                elif chunk[j] == "}":
                    depth -= 1
                j += 1
            body = chunk[start:j - 1]

            if head.startswith("@"):
                if head.startswith("@media"):
                    walk(body, head, base)
            else:
                for sel in head.split(","):
                    sel = sel.strip()
                    if not sel:
                        continue
                    for decl in body.split(";"):
                        if ":" not in decl:
                            continue
                        prop, _, val = decl.partition(":")
                        prop, val = prop.strip().lower(), val.strip()
                        if not prop or prop.startswith("--"):
                            continue
                        imp = "!important" in val
                        order[0] += 1
                        out.append(dict(sel=sel, prop=prop,
                                        val=val.replace("!important", "").strip(),
                                        important=imp, spec=specificity(sel),
                                        order=order[0], src=source, media=media_ctx))
            i = j
    walk(text, media, 0)
    return out


def matches(sel, classes, tag, el_id):
    """Match the rightmost compound only (ancestors assumed satisfied by caller)."""
    if any(c in sel for c in (">", "+", "~")):
        return None  # combinator rules: skip rather than guess
    if "::" in sel:
        return None  # pseudo-elements style a generated box, not this element
    compound = sel.split()[-1]
    compound = re.sub(r":[a-z-]+(\([^)]*\))?", "", compound)
    if not compound:
        return False
    parts = re.findall(r"[.#]?[\w-]+", compound)
    for p in parts:
        if p.startswith("."):
            if p[1:] not in classes:
                return False
        elif p.startswith("#"):
            if p[1:] != el_id:
                return False
        else:
            if p.lower() != tag:
                return False
    return True


def resolve(rules, prop, classes, tag, el_id, media_active):
    """Return the winning declaration for prop, ignoring @media that is inactive."""
    hits = []
    for r in rules:
        if r["prop"] != prop:
            continue
        if r["media"] and r["media"] not in media_active:
            continue
        m = matches(r["sel"], classes, tag, el_id)
        if m:
            hits.append(r)
    if not hits:
        return None, []
    hits.sort(key=lambda r: (r["important"], r["spec"], r["order"]))
    return hits[-1], hits


def main():
    rules = []
    for name in LOAD_ORDER:
        rules += parse((CSS_DIR / name).read_text(encoding="utf-8"), name)

    failures, warnings = [], []

    # --- Check 1: display resolution on key elements -------------------------
    DESKTOP = []  # no max-width media queries active
    MOBILE = ["@media (max-width: 1023px)"]

    cases = [
        # (label, tag, classes, id, active media, expected display)
        ("active chapter",        "section", ["chapter", "is-active"], None, DESKTOP, "block"),
        ("inactive chapter",      "section", ["chapter"],              None, DESKTOP, "none"),
        ("menu toggle, desktop",  "button",  ["btn", "btn--icon", "menu-toggle"], "menu-toggle", DESKTOP, "none"),
        ("rail close, desktop",   "button",  ["btn", "btn--icon", "rail__close"], "rail-close",  DESKTOP, "none"),
        ("menu toggle, mobile",   "button",  ["btn", "btn--icon", "menu-toggle"], "menu-toggle", MOBILE,  "inline-flex"),
        ("rail close, mobile",    "button",  ["btn", "btn--icon", "rail__close"], "rail-close",  MOBILE,  "inline-flex"),
        ("app shell",             "div",     ["app"],                  None, DESKTOP, "grid"),
        ("content column",        "main",    ["content"],              "main", DESKTOP, "grid"),
        ("search overlay closed", "div",     ["search"],               "search", DESKTOP, "none"),
        ("search overlay open",   "div",     ["search", "is-open"],    "search", DESKTOP, "flex"),
        ("procedure summary",     "summary", ["procedure__summary"],   None, DESKTOP, "grid"),
    ]

    print("display resolution")
    for label, tag, classes, el_id, media, expected in cases:
        win, hits = resolve(rules, "display", classes, tag, el_id, media)
        got = win["val"] if win else "(none)"
        ok = got == expected
        print(f"  {'PASS' if ok else 'FAIL'}  {label:<24} -> {got}"
              + ("" if ok else f"   expected {expected}   winner: {win['sel']} in {win['src']}" if win else ""))
        if not ok:
            failures.append(label)
        # warn where a rule lost to an equally specific later rule
        if len(hits) > 1:
            for h in hits[:-1]:
                if h["spec"] == win["spec"] and h["src"] != win["src"] and h["val"] != win["val"]:
                    warnings.append(f"{label}: `{h['sel']}` ({h['src']}) loses to equally specific "
                                    f"`{win['sel']}` ({win['src']})")

    # --- Check 2: grid -1 end lines need an explicit track list --------------
    print("\ngrid span integrity")
    text = {n: strip_comments((CSS_DIR / n).read_text(encoding="utf-8")) for n in LOAD_ORDER}
    spans = []
    for name, body in text.items():
        for m in re.finditer(r"([^{}]+?)\{([^{}]*grid-(row|column)\s*:\s*[^;]*-1[^;]*;)", body):
            sel = m.group(1).strip().split(",")[-1].strip()
            if not sel or sel.startswith("@"):
                continue
            spans.append((name, sel, m.group(3)))
    if not spans:
        print("  (no -1 end lines used)")

    # Which selector is the grid container for this rule? A descendant selector
    # names it directly (`.logbook__form .logbook__wide` -> `.logbook__form`).
    # A bare selector is a child of the app shell, which is the only implicit
    # container in this stylesheet.
    def container_for(sel):
        parts = sel.split()
        return parts[-2] if len(parts) > 1 else ".app"

    all_css = "".join(text.values())
    for name, sel, axis in spans:
        track = "grid-template-rows" if axis == "row" else "grid-template-columns"
        parent = container_for(sel)
        declared = re.search(
            re.escape(parent) + r"\s*(?:,[^{}]*)?\{[^{}]*" + track, all_css, flags=re.S
        )
        ok = bool(declared)
        print(f"  {'PASS' if ok else 'FAIL'}  {sel} uses grid-{axis} to -1; "
              f"{parent} declares {track}: {ok}")
        if not ok:
            failures.append(f"{sel} grid-{axis} -1 without explicit {track} on {parent}")

    if warnings:
        print("\ncascade warnings")
        for w in sorted(set(warnings)):
            print("  WARN  " + w)

    print("\n" + ("ALL CSS CHECKS PASSED" if not failures else f"{len(failures)} CSS CHECK(S) FAILED"))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

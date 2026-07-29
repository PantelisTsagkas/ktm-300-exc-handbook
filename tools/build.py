#!/usr/bin/env python3
"""
build.py — inline the source tree into one self-contained HTML file.

The handbook has to work two ways. On a phone or a laptop with a connection it
is a normal static site served from `index.html` and `assets/`. On a laptop in
a van with no network it is a single file you copied to the desktop and open by
double-clicking. This script produces the second from the first, so there is
one source of truth and the bundle is a build output rather than a fork.

Stylesheets and scripts are inlined in the order the source document declares
them, because both the cascade and the JS load order are load-order dependent.
Each inlined block keeps a banner comment naming its origin file so a stack
trace or a devtools inspection in the bundle still points somewhere real.

Usage:
    python3 tools/build.py                  # write dist/<name>.html
    python3 tools/build.py --check          # verify dist/ matches source, write nothing
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "index.html"
OUT = ROOT / "dist" / "ktm-300-exc-handbook.html"

LINK_RE = re.compile(r'[ \t]*<link rel="stylesheet" href="([^"]+)">\n?')
SCRIPT_RE = re.compile(r'[ \t]*<script src="([^"]+)"></script>\n?')

# Markup that only makes sense on the served site, such as the link that offers
# this very bundle for download. Stripping it here rather than hiding it at
# runtime keeps the bundle free of links it cannot resolve, and keeps the
# generated table of contents honest.
SERVED_ONLY_RE = re.compile(
    r"[ \t]*<!-- served-only:start -->.*?<!-- served-only:end -->\n?",
    re.S,
)


def banner(name: str) -> str:
    return f"/* ===== {name} ===== */\n"


def read_asset(href: str) -> str:
    path = ROOT / href
    if not path.is_file():
        sys.exit(f"build: referenced asset does not exist: {href}")
    return path.read_text(encoding="utf-8")


def build() -> str:
    html = SOURCE.read_text(encoding="utf-8")
    html = SERVED_ONLY_RE.sub("", html)

    css_hrefs = LINK_RE.findall(html)
    js_hrefs = SCRIPT_RE.findall(html)
    if not css_hrefs or not js_hrefs:
        sys.exit("build: found no external stylesheets or scripts to inline")

    # Collapse every <link> into a single <style> at the position of the first,
    # preserving declaration order so the cascade is unchanged.
    css = "".join(banner(Path(h).name) + read_asset(h) for h in css_hrefs)
    first_link = LINK_RE.search(html)
    html = html[: first_link.start()] + f"<style>\n{css}</style>\n" + html[first_link.end() :]
    html = LINK_RE.sub("", html)

    # Scripts stay as separate <script> blocks: one per source file, in order.
    # Separate blocks keep each file its own top-level scope, exactly as the
    # served version behaves.
    def inline_script(match: re.Match) -> str:
        href = match.group(1)
        return f"<script>\n{banner(Path(href).name)}{read_asset(href)}</script>\n"

    html = SCRIPT_RE.sub(inline_script, html)
    return html


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if the committed bundle differs from a fresh build",
    )
    args = parser.parse_args()

    bundled = build()

    if args.check:
        if not OUT.is_file():
            print(f"build --check: {OUT.relative_to(ROOT)} does not exist", file=sys.stderr)
            return 1
        current = OUT.read_text(encoding="utf-8")
        if current != bundled:
            print(
                f"build --check: {OUT.relative_to(ROOT)} is stale "
                f"({len(current)} bytes on disk, {len(bundled)} bytes rebuilt). "
                "Run `python3 tools/build.py`.",
                file=sys.stderr,
            )
            return 1
        print(f"build --check: {OUT.relative_to(ROOT)} matches source ({len(bundled)} bytes)")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(bundled, encoding="utf-8")
    print(f"build: wrote {OUT.relative_to(ROOT)} ({len(bundled)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

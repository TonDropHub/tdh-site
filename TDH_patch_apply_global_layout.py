#!/usr/bin/env python3
# TDH — Patch ALL generated HTML to include global CSS + theme persistence + global nav
#
# What it does:
# 1) Ensures every *.html has:
#    - <link rel=\"stylesheet\" href=\"/assets/style.css\" />
#    - early inline snippet that applies saved theme BEFORE paint
#    - <script src=\"/assets/site.js\" defer></script>
#
# Why:
# Cloudflare Pages serves static HTML. Generated news/articles don't automatically include
# our shared layout + theme toggle. This patch makes every page consistent and keeps the
# selected theme when navigating anywhere (News list, articles, etc.).
#
# How to use:
#   python3 TDH_patch_apply_global_layout.py
# Run it from the repo root (same level as index.html / assets/).
#
# Tip (recommended):
# Run this script automatically right before your bot commits/pushes new articles.

from __future__ import annotations
import re
from pathlib import Path

CSS_HREF = "/assets/style.css"
SITE_JS_SRC = "/assets/site.js"

CSS_TAG = f'<link rel="stylesheet" href="{CSS_HREF}" />'
SITE_JS_TAG = f'<script src="{SITE_JS_SRC}" defer></script>'

# tiny, safe early-theme snippet (prevents flash and keeps theme across pages)
EARLY_THEME_SNIPPET = '''
<script>
(function(){
  try{
    var t = (localStorage.getItem('tdh_theme')||'').toLowerCase();
    if(t==='dark' || t==='light'){
      document.documentElement.setAttribute('data-theme', t);
    }
  }catch(e){}
})();
</script>
'''.strip()

HEAD_CLOSE_RE = re.compile(r"</head\s*>", re.IGNORECASE)
HEAD_OPEN_RE = re.compile(r"<head[^>]*>", re.IGNORECASE)
META_CHARSET_RE = re.compile(r"<meta[^>]*charset[^>]*>", re.IGNORECASE)

def insert_before_head_close(html: str, block: str) -> str:
    m = HEAD_CLOSE_RE.search(html)
    if not m:
        return html
    return html[: m.start()] + block + "\n" + html[m.start() :]

def insert_after_charset_or_head_open(html: str, block: str) -> str:
    # Prefer right after <meta charset=...> (best spot)
    m = META_CHARSET_RE.search(html)
    if m:
        return html[: m.end()] + "\n" + block + "\n" + html[m.end() :]
    # fallback: right after <head>
    m = HEAD_OPEN_RE.search(html)
    if m:
        return html[: m.end()] + "\n" + block + "\n" + html[m.end() :]
    return html

def patch_html(html: str) -> str:
    out = html

    # Ensure early theme snippet (only once)
    if "localStorage.getItem('tdh_theme')" not in out:
        out = insert_after_charset_or_head_open(out, EARLY_THEME_SNIPPET)

    # Ensure CSS
    if CSS_HREF not in out:
        out = insert_before_head_close(out, CSS_TAG)

    # Ensure site.js
    if SITE_JS_SRC not in out:
        out = insert_before_head_close(out, SITE_JS_TAG)

    return out

def should_skip(path: Path) -> bool:
    parts = {p.lower() for p in path.parts}
    # Skip assets and typical vendor folders
    if "assets" in parts:
        return True
    if ".git" in parts or "node_modules" in parts or ".venv" in parts:
        return True
    return False

def main() -> int:
    root = Path(".").resolve()
    changed = 0
    scanned = 0

    for p in root.rglob("*.html"):
        if should_skip(p):
            continue

        scanned += 1
        try:
            raw = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raw = p.read_text(encoding="utf-8", errors="ignore")

        patched = patch_html(raw)
        if patched != raw:
            p.write_text(patched, encoding="utf-8")
            changed += 1

    print(f"[TDH] scanned={scanned} changed={changed}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())


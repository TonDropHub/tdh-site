"""TDH patcher: make theme + header consistent on all pages.

What it does (safe/idempotent):
- Adds the small "theme preload" snippet into <head> (prevents dark flash).
- Adds <script src="/assets/site.js" defer></script> into <head>.

Run it from the repo root (where index.html lives):
  python TDH_patch_add_theme_to_all_html.py

Then commit/push the changed .html files.

Notes:
- This does NOT rewrite your content.
- It only touches .html files (skips /assets).
"""

from __future__ import annotations

import os
from pathlib import Path

THEME_PRELOAD = (
    '<script>(function(){try{var t=localStorage.getItem("tdh_theme");'
    'if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);'
    '}catch(e){}})();</script>'
)
SITE_JS = '<script src="/assets/site.js" defer></script>'


def patch_head(html: str) -> tuple[str, bool]:
    lower = html.lower()
    if '</head>' not in lower:
        return html, False

    changed = False

    # Insert theme preload snippet if missing.
    if 'localstorage.getitem("tdh_theme")' not in html and 'localStorage.getItem("tdh_theme")' not in html:
        html = html.replace('</head>', THEME_PRELOAD + '\n' + '</head>')
        changed = True

    # Insert site.js if missing.
    if '/assets/site.js' not in html:
        html = html.replace('</head>', SITE_JS + '\n' + '</head>')
        changed = True

    return html, changed


def main() -> None:
    root = Path('.')
    changed_files = 0

    for path in root.rglob('*.html'):
        # skip build artifacts if any
        if any(part.lower() == 'assets' for part in path.parts):
            continue

        try:
            html = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            # fallback for weird encodings
            html = path.read_text(encoding='utf-8', errors='ignore')

        new_html, changed = patch_head(html)
        if changed:
            path.write_text(new_html, encoding='utf-8')
            changed_files += 1

    print(f'Done. Updated files: {changed_files}')


if __name__ == '__main__':
    main()


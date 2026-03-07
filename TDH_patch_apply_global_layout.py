#!/usr/bin/env python3
# TDH — Global HTML patcher + SEO patch for existing news pages
#
# What it does (safe/idempotent):
# 1) Ensures every HTML page includes:
#    - early theme preload snippet
#    - /assets/style.css
#    - /assets/site.js
#    - theme-color + color-scheme meta
# 2) For /news/<slug>/index.html pages:
#    - cleans meta/OG/Twitter descriptions
#    - adds JSON-LD (NewsArticle + BreadcrumbList) if missing
#    - adds "Back to News" link if missing
#    - adds "Continue reading" card if missing
#
# Run from repo root:
#   python3 TDH_patch_apply_global_layout.py
#
# Recommended:
# keep the existing GitHub Action that already runs this script on push.

from __future__ import annotations

import html
import json
import re
from pathlib import Path

CSS_HREF = "/assets/style.css"
SITE_JS_SRC = "/assets/site.js"
THEME_COLOR = "#0b1020"
COLOR_SCHEME = "dark light"
SITE_NAME = "TON Drop Hub"
DEFAULT_OG_IMAGE = "/assets/og.jpg"
SITE_BASE_FALLBACK = "https://tdh-site-cie.pages.dev"

CSS_TAG = f'<link rel="stylesheet" href="{CSS_HREF}" />'
SITE_JS_TAG = f'<script src="{SITE_JS_SRC}" defer></script>'
THEME_COLOR_TAG = f'<meta name="theme-color" content="{THEME_COLOR}" />'
COLOR_SCHEME_TAG = f'<meta name="color-scheme" content="{COLOR_SCHEME}" />'

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
BODY_FOOTER_RE = re.compile(r"(\s*</div>\s*<div class=\"footer\">)", re.IGNORECASE | re.DOTALL)


def insert_before_head_close(doc: str, block: str) -> str:
    m = HEAD_CLOSE_RE.search(doc)
    if not m:
        return doc
    return doc[:m.start()] + block + "\n" + doc[m.start():]


def insert_after_charset_or_head_open(doc: str, block: str) -> str:
    m = META_CHARSET_RE.search(doc)
    if m:
        return doc[:m.end()] + "\n" + block + "\n" + doc[m.end():]
    m = HEAD_OPEN_RE.search(doc)
    if m:
        return doc[:m.end()] + "\n" + block + "\n" + doc[m.end():]
    return doc


def escape_attr(value: str) -> str:
    return html.escape(value, quote=True)


def upsert_meta_name(doc: str, name: str, content: str) -> str:
    tag = f'<meta name="{name}" content="{escape_attr(content)}" />'
    pattern = re.compile(rf'<meta\b[^>]*name=["\']{re.escape(name)}["\'][^>]*>', re.IGNORECASE)
    if pattern.search(doc):
        return pattern.sub(tag, doc, count=1)
    return insert_before_head_close(doc, tag)


def upsert_meta_property(doc: str, prop: str, content: str) -> str:
    tag = f'<meta property="{prop}" content="{escape_attr(content)}" />'
    pattern = re.compile(rf'<meta\b[^>]*property=["\']{re.escape(prop)}["\'][^>]*>', re.IGNORECASE)
    if pattern.search(doc):
        return pattern.sub(tag, doc, count=1)
    return insert_before_head_close(doc, tag)


def get_meta_content(doc: str, name: str | None = None, prop: str | None = None) -> str:
    if name:
        pattern = re.compile(rf'<meta\b[^>]*name=["\']{re.escape(name)}["\'][^>]*content=["\']([^"\']*)["\'][^>]*>', re.IGNORECASE)
    elif prop:
        pattern = re.compile(rf'<meta\b[^>]*property=["\']{re.escape(prop)}["\'][^>]*content=["\']([^"\']*)["\'][^>]*>', re.IGNORECASE)
    else:
        return ""
    m = pattern.search(doc)
    return html.unescape(m.group(1)).strip() if m else ""


def get_canonical(doc: str) -> str:
    m = re.search(r'<link\b[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\'][^>]*>', doc, re.IGNORECASE)
    return html.unescape(m.group(1)).strip() if m else ""


def strip_tags(fragment: str) -> str:
    cleaned = re.sub(r'<script\b[^>]*>.*?</script>', ' ', fragment, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'<style\b[^>]*>.*?</style>', ' ', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


def clean_description(text: str, limit: int = 155) -> str:
    text = html.unescape(text or "")
    text = re.sub(r'^[#*\-\s>]+', '', text).strip()
    text = re.sub(r'\bTL\s*;?DR\b[:\-]*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\bSource\b\s*:\s*.*$', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip(' .,-:;|')
    if not text:
        text = "Latest TON ecosystem news, airdrops, and practical updates on TON Drop Hub"
    if len(text) <= limit:
        return text
    cut = text[:limit + 1]
    if ' ' in cut:
        cut = cut.rsplit(' ', 1)[0]
    return cut.rstrip(' .,:;!-') + '…'


def extract_title(doc: str) -> str:
    m = re.search(r'<h1[^>]*>(.*?)</h1>', doc, re.IGNORECASE | re.DOTALL)
    if m:
        return strip_tags(m.group(1))
    m = re.search(r'<title>(.*?)</title>', doc, re.IGNORECASE | re.DOTALL)
    if m:
        title = strip_tags(m.group(1))
        title = re.sub(r'\s+[—-]\s+TON Drop Hub\s*$', '', title, flags=re.IGNORECASE)
        return title
    return "TON Drop Hub article"


def extract_date(doc: str) -> str:
    m = re.search(r'\b(20\d{2}-\d{2}-\d{2})\b', doc)
    return m.group(1) if m else ""


def extract_source_label(doc: str) -> str:
    m = re.search(r'<div class="meta">(.*?)</div>', doc, re.IGNORECASE | re.DOTALL)
    if not m:
        return SITE_NAME
    raw = strip_tags(m.group(1))
    parts = [p.strip() for p in raw.split('•') if p.strip()]
    return parts[0] if parts else SITE_NAME


def extract_article_fragment(doc: str) -> str:
    m = re.search(r'<div class="article">(.*?)</div>\s*<div class="footer">', doc, re.IGNORECASE | re.DOTALL)
    if m:
        return m.group(1)
    m = re.search(r'<div class="article">(.*?)</div>\s*</div>\s*</body>', doc, re.IGNORECASE | re.DOTALL)
    if m:
        return m.group(1)
    return doc


def extract_description_from_article(doc: str) -> str:
    fragment = extract_article_fragment(doc)
    fragment = re.sub(r'<div class="meta">.*?</div>', ' ', fragment, flags=re.IGNORECASE | re.DOTALL)
    fragment = re.sub(r'<p\b[^>]*class="sub"[^>]*>.*?</p>', ' ', fragment, flags=re.IGNORECASE | re.DOTALL)
    fragment = re.sub(r'<h1[^>]*>.*?</h1>', ' ', fragment, flags=re.IGNORECASE | re.DOTALL)
    fragment = re.sub(r'<div class="hr">.*?</div>', ' ', fragment, flags=re.IGNORECASE | re.DOTALL)
    fragment = re.sub(r'<h2[^>]*>\s*Source note\s*</h2>', ' ', fragment, flags=re.IGNORECASE | re.DOTALL)
    paras = re.findall(r'<p\b[^>]*>(.*?)</p>', fragment, re.IGNORECASE | re.DOTALL)
    texts: list[str] = []
    for para in paras:
        text = strip_tags(para)
        if not text:
            continue
        low = text.lower()
        if 'back to news' in low:
            continue
        if low.startswith('source:'):
            continue
        if len(text) < 25:
            continue
        texts.append(text)
        if len(' '.join(texts)) >= 220 or len(texts) >= 2:
            break
    if not texts:
        fallback = strip_tags(fragment)
        fallback = re.sub(r'\bsource\s*:\s*.*$', '', fallback, flags=re.IGNORECASE).strip()
        if not fallback:
            fallback = extract_title(doc)
        texts.append(fallback)
    return clean_description(' '.join(texts))


def is_news_article(path: Path) -> bool:
    parts = [p.lower() for p in path.parts]
    return len(parts) >= 3 and parts[-3] == 'news' and parts[-2] != 'news' and parts[-1] == 'index.html'


def article_url_from_path(path: Path, doc: str) -> str:
    canonical = get_canonical(doc)
    if canonical:
        return canonical
    rel_parts = list(path.parts)
    try:
        idx = rel_parts.index('news')
        rel_url = '/' + '/'.join(rel_parts[idx:-1]) + '/'
    except ValueError:
        rel_url = '/news/'
    return SITE_BASE_FALLBACK.rstrip('/') + rel_url


def site_base_from_url(url: str) -> str:
    m = re.match(r'^(https?://[^/]+)', url.strip(), re.IGNORECASE)
    return m.group(1) if m else SITE_BASE_FALLBACK


def build_jsonld(doc: str, path: Path) -> tuple[str, str]:
    title = extract_title(doc)
    date_str = extract_date(doc)
    article_url = article_url_from_path(path, doc)
    site_base = site_base_from_url(article_url)
    description = extract_description_from_article(doc)
    article_data = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "mainEntityOfPage": article_url,
        "url": article_url,
        "articleSection": "News",
        "author": {
            "@type": "Organization",
            "name": SITE_NAME,
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": {
                "@type": "ImageObject",
                "url": f"{site_base}/assets/logo.png",
            },
        },
        "image": [f"{site_base}{DEFAULT_OG_IMAGE}"],
    }
    if date_str:
        article_data["datePublished"] = date_str
        article_data["dateModified"] = date_str

    breadcrumb_data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": f"{site_base}/",
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "News",
                "item": f"{site_base}/news/",
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": title,
                "item": article_url,
            },
        ],
    }
    return json.dumps(article_data, ensure_ascii=False), json.dumps(breadcrumb_data, ensure_ascii=False)


def ensure_jsonld(doc: str, path: Path) -> str:
    if 'application/ld+json' in doc and ('NewsArticle' in doc or 'BreadcrumbList' in doc):
        return doc
    article_json, breadcrumb_json = build_jsonld(doc, path)
    block = (
        f'<script type="application/ld+json">{article_json}</script>\n'
        f'<script type="application/ld+json">{breadcrumb_json}</script>'
    )
    return insert_before_head_close(doc, block)


def ensure_back_to_news(doc: str) -> str:
    if 'Back to News' in doc:
        return doc
    pattern = re.compile(r'(<div class="meta">.*?</div>)', re.IGNORECASE | re.DOTALL)
    replacement = r'\1\n      <p class="sub"><a href="/news/">← Back to News</a></p>'
    if pattern.search(doc):
        return pattern.sub(replacement, doc, count=1)
    return doc


def ensure_continue_reading(doc: str) -> str:
    if 'Continue reading' in doc:
        return doc
    block = '''

      <div class="card" style="margin-top:18px">
        <h2>Continue reading</h2>
        <ul>
          <li><a href="/news/">More TON news</a></li>
          <li><a href="/">Homepage</a></li>
          <li><a href="/about/">About TON Drop Hub</a></li>
        </ul>
      </div>
'''.rstrip()
    if BODY_FOOTER_RE.search(doc):
        return BODY_FOOTER_RE.sub(block + r'\1', doc, count=1)
    return doc


def patch_global(doc: str) -> str:
    out = doc
    if "localStorage.getItem('tdh_theme')" not in out and 'localStorage.getItem("tdh_theme")' not in out:
        out = insert_after_charset_or_head_open(out, EARLY_THEME_SNIPPET)
    if CSS_HREF not in out:
        out = insert_before_head_close(out, CSS_TAG)
    if SITE_JS_SRC not in out:
        out = insert_before_head_close(out, SITE_JS_TAG)
    if 'name="theme-color"' not in out.lower():
        out = insert_before_head_close(out, THEME_COLOR_TAG)
    if 'name="color-scheme"' not in out.lower():
        out = insert_before_head_close(out, COLOR_SCHEME_TAG)
    return out


def patch_news_article(doc: str, path: Path) -> str:
    out = doc
    title = extract_title(out)
    article_url = article_url_from_path(path, out)
    site_base = site_base_from_url(article_url)
    description = extract_description_from_article(out)

    out = upsert_meta_name(out, 'description', description)
    out = upsert_meta_property(out, 'og:description', description)
    out = upsert_meta_name(out, 'twitter:description', description)
    out = upsert_meta_property(out, 'og:title', title)
    out = upsert_meta_name(out, 'twitter:title', title)
    out = upsert_meta_property(out, 'og:url', article_url)
    out = upsert_meta_property(out, 'og:image', f'{site_base}{DEFAULT_OG_IMAGE}')
    out = upsert_meta_property(out, 'og:image:width', '1200')
    out = upsert_meta_property(out, 'og:image:height', '630')
    out = upsert_meta_name(out, 'twitter:image', f'{site_base}{DEFAULT_OG_IMAGE}')
    out = upsert_meta_name(out, 'twitter:image:alt', 'TON Drop Hub article cover')
    out = upsert_meta_property(out, 'article:section', 'News')

    date_str = extract_date(out)
    if date_str:
        out = upsert_meta_property(out, 'article:published_time', date_str)
        out = upsert_meta_property(out, 'article:modified_time', date_str)

    out = ensure_jsonld(out, path)
    out = ensure_back_to_news(out)
    out = ensure_continue_reading(out)
    return out


def should_skip(path: Path) -> bool:
    parts = {p.lower() for p in path.parts}
    if 'assets' in parts or '.git' in parts or 'node_modules' in parts or '.venv' in parts:
        return True
    return False


def main() -> int:
    root = Path('.').resolve()
    scanned = 0
    changed = 0

    for path in root.rglob('*.html'):
        if should_skip(path):
            continue
        scanned += 1
        try:
            raw = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            raw = path.read_text(encoding='utf-8', errors='ignore')

        patched = patch_global(raw)
        if is_news_article(path):
            patched = patch_news_article(patched, path)

        if patched != raw:
            path.write_text(patched, encoding='utf-8')
            changed += 1

    print(f'[TDH SEO PATCH] scanned={scanned} changed={changed}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

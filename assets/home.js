// assets/home.js
// Homepage dynamic blocks:
// - Top "Latest article" from /news/feed.json
// - 4 category cards: News / Airdrops / Guides / Projects (each takes the newest item from its own feed)
//
// Notes:
// - Uses ?ts=... to bypass aggressive caching.
// - Never throws (fails gracefully).

(function () {
  "use strict";

  const byId = (id) => document.getElementById(id);

  const safeText = (v) => (typeof v === "string" ? v : "");
  const fmtDate = (iso) => (typeof iso === "string" && iso.length >= 10 ? iso.slice(0, 10) : "");

  // Remove small junk words that sometimes appear as standalone fragments.
  // Also strip accidental external urls/domains from snippets/titles just in case.
  function cleanText(s) {
    if (!s) return "";
    let x = String(s).replace(/\s+/g, " ").trim();

    // leading junk
    x = x.replace(/^(Latest|Newest|Breaking|Update|News)\b\s*[:\-–—]?\s*/i, "");

    // remove any URLs
    x = x.replace(/https?:\/\/\S+/gi, "").trim();

    // remove trailing " - DOMAIN.COM" / " | DOMAIN"
    x = x.replace(/\s*[-|]\s*[A-Z0-9.-]+\.[A-Z]{2,}\s*$/i, "").trim();

    return x;
  }

  async function loadFeed(path) {
    const url = `${path}?ts=${Date.now()}`;
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }

  function pickFirstItem(feed) {
    const items = Array.isArray(feed && feed.items) ? feed.items : [];
    return items[0] || null;
  }

  function setTopLatest(item) {
    const titleEl = byId("latest-title");
    const metaEl = byId("latest-meta");
    const excerptEl = byId("latest-excerpt");
    if (!titleEl || !metaEl || !excerptEl) return;

    if (!item) {
      titleEl.textContent = "No articles yet — open News";
      titleEl.href = "/news/";
      metaEl.textContent = "";
      excerptEl.textContent = "The feed is connected. Articles will appear here automatically after the next bot run.";
      return;
    }

    const url = safeText(item.url) || "/news/";
    const title = cleanText(safeText(item.title)) || "Latest update";
    const excerpt = cleanText(safeText(item.excerpt));
    const dt = fmtDate(item.published_at);

    titleEl.textContent = title;
    titleEl.href = url;

    metaEl.textContent = dt ? ("News • " + dt) : "News";
    excerptEl.textContent = excerpt;
  }

  function setCategoryCard(prefix, item, fallbackHref) {
    const metaEl = byId(prefix + "-meta");
    const excerptEl = byId(prefix + "-excerpt");
    const linkEl = byId(prefix + "-link");

    if (!metaEl || !excerptEl || !linkEl) return;

    if (!item) {
      metaEl.textContent = "No posts yet";
      excerptEl.textContent = "This section will update automatically after the next bot run.";
      linkEl.href = fallbackHref;
      return;
    }

    const title = cleanText(safeText(item.title)) || "Latest update";
    const excerpt = cleanText(safeText(item.excerpt));
    const url = safeText(item.url) || fallbackHref;
    const dt = fmtDate(item.published_at);

    metaEl.textContent = dt ? (title + " • " + dt) : title;
    excerptEl.textContent = excerpt;
    linkEl.href = url;
  }

  async function main() {
    // Top latest from news
    const newsFeed = await loadFeed("/news/feed.json");
    setTopLatest(pickFirstItem(newsFeed));

    // 4 categories
    const [airdropsFeed, guidesFeed, projectsFeed] = await Promise.all([
      loadFeed("/airdrops/feed.json"),
      loadFeed("/guides/feed.json"),
      loadFeed("/projects/feed.json"),
    ]);

    setCategoryCard("news", pickFirstItem(newsFeed), "/news/");
    setCategoryCard("airdrops", pickFirstItem(airdropsFeed), "/airdrops/");
    setCategoryCard("guides", pickFirstItem(guidesFeed), "/guides/");
    setCategoryCard("projects", pickFirstItem(projectsFeed), "/projects/");
  }

  // Never crash homepage
  main().catch(() => {});
})();

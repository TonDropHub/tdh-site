// TON Drop Hub — homepage loader
// Fills "Latest article" + 4 section cards (News, Airdrops, Guides, Projects)

(function () {
  const stripHtml = (s) => (typeof s === "string" ? s.replace(/<[^>]*>/g, "").trim() : "");

  const setLatest = (item) => {
    const titleEl = document.getElementById("latest-title");
    const metaEl = document.getElementById("latest-meta");
    const excerptEl = document.getElementById("latest-excerpt");

    const url = (item && typeof item.url === "string") ? item.url : "/news/";
    const title = (item && typeof item.title === "string") ? item.title : "Latest update";
    const excerpt = stripHtml(item && (item.excerpt || item.teaser) || "");
    const dt = (item && typeof item.published_at === "string") ? item.published_at.slice(0, 10) : "";

    titleEl.textContent = title;
    titleEl.href = url;
    metaEl.textContent = dt ? ("News • " + dt) : "News";
    excerptEl.textContent = excerpt;
  };

  const fallbackLatest = () => {
    const titleEl = document.getElementById("latest-title");
    const metaEl = document.getElementById("latest-meta");
    const excerptEl = document.getElementById("latest-excerpt");

    titleEl.textContent = "No articles yet — open News";
    titleEl.href = "/news/";
    metaEl.textContent = "";
    excerptEl.textContent = "The feed is connected. Articles will appear here automatically after the next bot run.";
  };

  const sections = {
    news: { label: "News", feed: "/news/feed.json", fallback: "/news/" },
    airdrops: { label: "Airdrops & Quests", feed: "/airdrops/feed.json", fallback: "/airdrops/" },
    guides: { label: "Guides", feed: "/guides/feed.json", fallback: "/guides/" },
    projects: { label: "Projects", feed: "/projects/feed.json", fallback: "/projects/" },
  };

  const setSectionCard = (key, item) => {
    const t = document.getElementById(`${key}-title`);
    const m = document.getElementById(`${key}-meta`);
    const x = document.getElementById(`${key}-excerpt`);

    if (!t || !m || !x) return;

    if (!item) {
      t.textContent = `No posts yet — open ${sections[key].label}`;
      t.href = sections[key].fallback;
      m.textContent = sections[key].label;
      x.textContent = "";
      return;
    }

    const url = (typeof item.url === "string") ? item.url : sections[key].fallback;
    const title = (typeof item.title === "string") ? item.title : sections[key].label;
    const excerpt = stripHtml(item.excerpt || item.teaser || "");
    const dt = (typeof item.published_at === "string") ? item.published_at.slice(0, 10) : "";

    t.textContent = title;
    t.href = url;
    m.textContent = dt ? (`${sections[key].label} • ${dt}`) : sections[key].label;
    x.textContent = excerpt;
  };

  const fetchFeed = async (path) => {
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) return null;
    const feed = await r.json();
    const items = Array.isArray(feed.items) ? feed.items : [];
    return items[0] || null;
  };

  (async () => {
    try {
      const latest = await fetchFeed("/news/feed.json");
      if (latest) setLatest(latest);
      else fallbackLatest();
    } catch {
      fallbackLatest();
    }

    for (const key of Object.keys(sections)) {
      try {
        const item = await fetchFeed(sections[key].feed);
        setSectionCard(key, item);
      } catch {
        setSectionCard(key, null);
      }
    }
  })();
})();

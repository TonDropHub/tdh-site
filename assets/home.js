(() => {
  const CONFIG = [
    {
      key: "news",
      label: "News",
      feed: "/news/feed.json",
      sectionUrl: "/news/",
      ids: {
        title: "news-title",
        meta: "news-meta",
        excerpt: "news-excerpt",
      },
    },
    {
      key: "airdrops",
      label: "Airdrops & Quests",
      feed: "/airdrops/feed.json",
      sectionUrl: "/airdrops/",
      ids: {
        title: "airdrops-title",
        meta: "airdrops-meta",
        excerpt: "airdrops-excerpt",
      },
    },
    {
      key: "guides",
      label: "Guides",
      feed: "/guides/feed.json",
      sectionUrl: "/guides/",
      ids: {
        title: "guides-title",
        meta: "guides-meta",
        excerpt: "guides-excerpt",
      },
    },
    {
      key: "projects",
      label: "Projects",
      feed: "/projects/feed.json",
      sectionUrl: "/projects/",
      ids: {
        title: "projects-title",
        meta: "projects-meta",
        excerpt: "projects-excerpt",
      },
    },
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function safeText(v, fallback = "") {
    return typeof v === "string" ? v : fallback;
  }

  function safeDate(v) {
    const s = safeText(v, "");
    return s ? s.slice(0, 10) : "";
  }

  function setCard(cfg, { title, url, date, excerpt }) {
    const t = byId(cfg.ids.title);
    const m = byId(cfg.ids.meta);
    const e = byId(cfg.ids.excerpt);

    if (!t || !m || !e) return;

    t.textContent = title;
    t.href = url;

    const dt = date ? `${cfg.label} • ${date}` : cfg.label;
    m.textContent = dt;
    e.textContent = excerpt;
  }

  function fallbackNoPosts(cfg) {
    setCard(cfg, {
      title: `No posts yet — open ${cfg.label}`,
      url: cfg.sectionUrl,
      date: "",
      excerpt: "The feed is connected. Posts will appear here automatically after the next bot run.",
    });
  }

  function fallbackError(cfg) {
    setCard(cfg, {
      title: `Open ${cfg.label}`,
      url: cfg.sectionUrl,
      date: "",
      excerpt: "Could not load the feed right now. Try again later.",
    });
  }

  async function loadSection(cfg) {
    try {
      const r = await fetch(cfg.feed, { cache: "no-store" });
      if (!r.ok) return fallbackNoPosts(cfg);

      const feed = await r.json();
      const items = Array.isArray(feed.items) ? feed.items : [];
      const item = items[0];
      if (!item) return fallbackNoPosts(cfg);

      const url = safeText(item.url, cfg.sectionUrl) || cfg.sectionUrl;
      const title = safeText(item.title, `Open ${cfg.label}`);
      const excerpt = safeText(item.excerpt, "");
      const date = safeDate(item.published_at);

      setCard(cfg, { title, url, date, excerpt });
    } catch (e) {
      fallbackError(cfg);
    }
  }

  async function main() {
    await Promise.all(CONFIG.map(loadSection));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();

(() => {
  const SECTION_RULES = {
    guides: ["guide", "how to", "tutorial", "what to know", "explained", "beginner", "walkthrough", "step by step"],
    airdrops: ["airdrop", "airdrops", "daily combo", "daily cipher", "claim", "quest", "quests", "reward", "rewards", "tap to earn", "combo", "cipher"],
    projects: ["partnership", "partner", "launch", "mainnet", "protocol", "mini app", "mini apps", "dao", "treasury", "project", "projects", "platform"],
  };

  const CONFIG = [
    {
      key: "news",
      label: "News",
      sectionUrl: "/news/",
      ids: { title: "news-title", meta: "news-meta", excerpt: "news-excerpt" },
    },
    {
      key: "airdrops",
      label: "Airdrops & Quests",
      sectionUrl: "/airdrops/",
      ids: { title: "airdrops-title", meta: "airdrops-meta", excerpt: "airdrops-excerpt" },
    },
    {
      key: "guides",
      label: "Guides",
      sectionUrl: "/guides/",
      ids: { title: "guides-title", meta: "guides-meta", excerpt: "guides-excerpt" },
    },
    {
      key: "projects",
      label: "Projects",
      sectionUrl: "/projects/",
      ids: { title: "projects-title", meta: "projects-meta", excerpt: "projects-excerpt" },
    },
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function text(v, fallback = "") {
    return typeof v === "string" ? v : fallback;
  }

  function extractYears(raw) {
    const matches = String(raw || "").match(/\b(20\d{2})\b/g) || [];
    return matches.map(Number).filter((n) => !Number.isNaN(n));
  }

  function minAllowedYear() {
    return new Date().getFullYear() - 1;
  }

  function hasOldYearReference(item) {
    const combined = [item?.title || "", item?.url || item?.path || "", item?.excerpt || item?.summary || item?.description || ""].join("\n");
    const years = extractYears(combined);
    return years.some((year) => year < minAllowedYear());
  }

  function normalize(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function classify(item) {
    const combined = normalize([item?.title || "", item?.excerpt || item?.summary || item?.description || "", item?.url || item?.path || ""].join(" "));
    for (const kw of SECTION_RULES.guides) {
      if (combined.includes(kw)) return "guides";
    }
    for (const kw of SECTION_RULES.airdrops) {
      if (combined.includes(kw)) return "airdrops";
    }
    for (const kw of SECTION_RULES.projects) {
      if (combined.includes(kw)) return "projects";
    }
    return "news";
  }

  function safeDate(v) {
    const s = text(v, "");
    return s ? s.slice(0, 10) : "";
  }

  function setCard(cfg, item) {
    const titleNode = byId(cfg.ids.title);
    const metaNode = byId(cfg.ids.meta);
    const excerptNode = byId(cfg.ids.excerpt);
    if (!titleNode || !metaNode || !excerptNode) return;

    titleNode.textContent = text(item?.title, `Open ${cfg.label}`);
    titleNode.href = text(item?.url, cfg.sectionUrl) || cfg.sectionUrl;
    const date = safeDate(item?.published_at || item?.date || "");
    metaNode.textContent = date ? `${cfg.label} • ${date}` : cfg.label;
    excerptNode.textContent = text(item?.excerpt || item?.summary || item?.description, "");
  }

  function fallback(cfg, mode) {
    const msg = mode === "error"
      ? "Could not load the feed right now. Try again later."
      : "The feed is connected. Posts will appear here automatically after the next bot run.";
    setCard(cfg, {
      title: `Open ${cfg.label}`,
      url: cfg.sectionUrl,
      excerpt: msg,
      published_at: "",
    });
  }

  async function main() {
    try {
      const response = await fetch("/news/feed.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
      const data = await response.json();
      const items = (Array.isArray(data.items) ? data.items : []).filter((item) => !hasOldYearReference(item));
      for (const cfg of CONFIG) {
        const picked = items.find((item) => classify(item) === cfg.key) || (cfg.key === "news" ? items[0] : null);
        if (picked) setCard(cfg, picked);
        else fallback(cfg, "empty");
      }
    } catch (err) {
      CONFIG.forEach((cfg) => fallback(cfg, "error"));
      console.error(err);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();

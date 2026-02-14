/* TON Drop Hub — global layout + theme (v5)
   - Persists theme across all pages (localStorage key: tdh_theme)
   - Injects/normalizes the same top nav on every page
   - Ensures a .container wrapper so even generated article pages look consistent
*/
(function () {
  const STORAGE_KEY = "tdh_theme";
  const THEMES = ["dark", "light"];

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (_) {}
  }

  function getSavedTheme() {
    const t = (safeGet(STORAGE_KEY) || "").toLowerCase();
    return THEMES.includes(t) ? t : "dark";
  }

  function applyTheme(theme) {
    const t = THEMES.includes(theme) ? theme : "dark";
    document.documentElement.setAttribute("data-theme", t);
  }

  // Run ASAP (before CSS is applied) when script is loaded in <head>
  applyTheme(getSavedTheme());

  function ensureCss() {
    if (document.querySelector('link[href="/assets/style.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/style.css";
    document.head.appendChild(link);
  }

  function ensureContainer() {
    let container = document.querySelector(".container");
    if (container) return container;

    container = document.createElement("div");
    container.className = "container";

    // Move most body nodes into container, keep scripts (if any) at the end of body
    const scripts = [];
    while (document.body.firstChild) {
      const n = document.body.firstChild;
      if (n.nodeType === 1 && n.tagName === "SCRIPT") {
        scripts.push(n);
        document.body.removeChild(n);
        continue;
      }
      container.appendChild(n);
    }
    document.body.appendChild(container);
    for (const s of scripts) document.body.appendChild(s);
    return container;
  }

  function navTemplate() {
    return `
      <div class="nav">
        <div class="left">
          <a class="brand" href="/">
            <img class="brand-logo" src="/assets/logo-32.png" alt="TON Drop Hub" />
            <span class="brand-text">
              <span class="brand-word ton">TON</span>
              <span class="brand-word drop">DROP</span>
              <span class="brand-word hub">HUB</span>
            </span>
          </a>
          <div class="pills">
            <a class="pill" href="/news/">News</a>
            <a class="pill" href="/airdrops/">Airdrops &amp; Quests</a>
            <a class="pill" href="/guides/">Guides</a>
            <a class="pill" href="/projects/">Projects</a>
            <a class="pill" href="/about/">About</a>
          </div>
        </div>
        <div class="right">
          <button class="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle theme">
            <span class="icon icon-moon" aria-hidden="true">🌙</span>
            <span class="icon icon-sun" aria-hidden="true">☀️</span>
          </button>
          <span class="badge">MVP</span>
        </div>
      </div>
    `.trim();
  }

  function normalizeBrand(brand) {
    if (!brand) return;
    brand.classList.add("brand");

    // Logo
    let logo = brand.querySelector("img.brand-logo");
    if (!logo) {
      logo = document.createElement("img");
      logo.className = "brand-logo";
      logo.alt = "TON Drop Hub";
      logo.src = "/assets/logo-32.png";
      brand.prepend(logo);
    } else {
      logo.classList.add("brand-logo");
      logo.src = "/assets/logo-32.png";
      logo.alt = "TON Drop Hub";
    }

    // Text -> TON DROP HUB with palette
    let text = brand.querySelector(".brand-text");
    if (!text) {
      text = document.createElement("span");
      text.className = "brand-text";
      text.innerHTML = `
        <span class="brand-word ton">TON</span>
        <span class="brand-word drop">DROP</span>
        <span class="brand-word hub">HUB</span>
      `.trim();

      // Remove any plain text nodes to avoid duplicates
      const nodes = Array.from(brand.childNodes);
      for (const n of nodes) {
        if (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim()) {
          brand.removeChild(n);
        }
      }
      brand.appendChild(text);
    }
  }

  function ensureThemeToggle(navEl) {
    let toggle = navEl.querySelector(".theme-toggle");
    if (!toggle) {
      const right = navEl.querySelector(".right") || navEl;
      toggle = document.createElement("button");
      toggle.className = "theme-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Toggle theme");
      toggle.title = "Toggle theme";
      toggle.innerHTML = `<span class="icon icon-moon" aria-hidden="true">🌙</span><span class="icon icon-sun" aria-hidden="true">☀️</span>`;
      right.prepend(toggle);
    }
    return toggle;
  }

  function ensureNav() {
    const container = ensureContainer();

    // If a .nav exists, normalize it; otherwise inject a fresh one at top
    let nav = container.querySelector(".nav") || document.querySelector(".nav");
    if (!nav) {
      const tmp = document.createElement("div");
      tmp.innerHTML = navTemplate();
      nav = tmp.firstElementChild;
      container.prepend(nav);
    } else {
      nav.classList.add("nav");
      // Ensure structure so CSS matches
      let left = nav.querySelector(".left");
      let right = nav.querySelector(".right");
      if (!left) {
        left = document.createElement("div");
        left.className = "left";
        // move brand + pills if present
        const brand = nav.querySelector(".brand, a[href='/'], a[href=\"/\"]");
        const pills = nav.querySelector(".pills");
        if (brand) left.appendChild(brand);
        if (pills) left.appendChild(pills);
        nav.prepend(left);
      }
      if (!right) {
        right = document.createElement("div");
        right.className = "right";
        // move badge if present
        const badge = nav.querySelector(".badge");
        if (badge) right.appendChild(badge);
        nav.appendChild(right);
      }
      // Ensure brand exists
      let brand = nav.querySelector(".brand");
      if (!brand) {
        brand = nav.querySelector("a[href='/'], a[href=\"/\"]");
        if (brand) brand.classList.add("brand");
      }
      if (!brand) {
        // Create brand if missing
        brand = document.createElement("a");
        brand.className = "brand";
        brand.href = "/";
        left.prepend(brand);
      }
      normalizeBrand(brand);

      // Ensure pills exist
      let pills = nav.querySelector(".pills");
      if (!pills) {
        pills = document.createElement("div");
        pills.className = "pills";
        left.appendChild(pills);
      }
      // Ensure all pills exist (idempotent)
      const pillMap = [
        ["/news/", "News"],
        ["/airdrops/", "Airdrops & Quests"],
        ["/guides/", "Guides"],
        ["/projects/", "Projects"],
        ["/about/", "About"],
      ];
      const existing = Array.from(pills.querySelectorAll("a")).map(a => a.getAttribute("href"));
      for (const [href, label] of pillMap) {
        if (existing.includes(href)) continue;
        const a = document.createElement("a");
        a.className = "pill";
        a.href = href;
        a.textContent = label;
        pills.appendChild(a);
      }

      // Ensure toggle + badge in right
      const toggle = ensureThemeToggle(nav);
      const badge = nav.querySelector(".badge") || document.createElement("span");
      badge.classList.add("badge");
      badge.textContent = badge.textContent?.trim() || "MVP";
      if (!right.contains(toggle)) right.prepend(toggle);
      if (!right.contains(badge)) right.appendChild(badge);
    }

    // Active pill highlight
    try {
      const path = (location.pathname || "/").toLowerCase();
      const pills = nav.querySelectorAll(".pills a.pill");
      pills.forEach((a) => {
        const href = (a.getAttribute("href") || "").toLowerCase();
        const active =
          (href === "/" && path === "/") ||
          (href !== "/" && path.startsWith(href));
        a.classList.toggle("active", !!active);
      });
    } catch (_) {}

    return nav;
  }

  function bindThemeToggle(nav) {
    const btn = nav.querySelector(".theme-toggle");
    if (!btn) return;

    // Avoid double-binding if script runs twice
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    btn.addEventListener("click", () => {
      const cur = (document.documentElement.getAttribute("data-theme") || "dark").toLowerCase();
      const next = cur === "dark" ? "light" : "dark";
      applyTheme(next);
      safeSet(STORAGE_KEY, next);
    });
  }

  function boot() {
    ensureCss();
    const nav = ensureNav();
    bindThemeToggle(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

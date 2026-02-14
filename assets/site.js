/* TDH /assets/site.js (v6b)
   Goal:
   - Persist theme (localStorage: "tdh_theme") across ALL pages
   - Add a theme toggle button into an EXISTING .nav (no nav injection)
   - Normalize brand (logo + colored TON/DROP/HUB) WITHOUT creating duplicates
*/
(() => {
  "use strict";

  const STORAGE_KEY = "tdh_theme";
  const THEMES = new Set(["dark", "light"]);

  function getSavedTheme() {
    try {
      const t = localStorage.getItem(STORAGE_KEY);
      return (t && THEMES.has(t)) ? t : null;
    } catch {
      return null;
    }
  }

  function getSystemTheme() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "dark";
    }
  }

  function currentTheme() {
    const attr = document.documentElement.getAttribute("data-theme");
    return (attr && THEMES.has(attr)) ? attr : null;
  }

  function setTheme(theme) {
    if (!THEMES.has(theme)) theme = "dark";
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function toggleTheme() {
    const t = currentTheme() || getSavedTheme() || getSystemTheme();
    setTheme(t === "dark" ? "light" : "dark");
  }

  function ensureThemeToggle(nav) {
    // find/create right container
    let right = nav.querySelector(".right");
    if (!right) {
      right = document.createElement("div");
      right.className = "right";
      nav.appendChild(right);
    }

    let btn = nav.querySelector("#theme-toggle");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "theme-toggle";
      btn.type = "button";
      btn.className = "theme-toggle";
      btn.setAttribute("aria-label", "Toggle theme");
      btn.setAttribute("title", "Toggle theme");

      // Use same SVG structure as CSS expects (.icon-sun / .icon-moon)
      btn.innerHTML = `
        <svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="12" y1="2" x2="12" y2="5"></line>
          <line x1="12" y1="19" x2="12" y2="22"></line>
          <line x1="2" y1="12" x2="5" y2="12"></line>
          <line x1="19" y1="12" x2="22" y2="12"></line>
          <line x1="4.2" y1="4.2" x2="6.3" y2="6.3"></line>
          <line x1="17.7" y1="17.7" x2="19.8" y2="19.8"></line>
          <line x1="17.7" y1="6.3" x2="19.8" y2="4.2"></line>
          <line x1="4.2" y1="19.8" x2="6.3" y2="17.7"></line>
        </svg>
        <svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3 7 7 0 1 0 21 12.8z"></path>
        </svg>
      `.trim();

      // Insert before badge if badge is inside right
      const badge = nav.querySelector(".badge");
      if (badge && badge.parentElement === right) right.insertBefore(btn, badge);
      else right.insertBefore(btn, right.firstChild);
    }

    if (!btn.dataset.bound) {
      btn.addEventListener("click", toggleTheme);
      btn.dataset.bound = "1";
    }
  }

  function decorateBrand(nav) {
    // Collect home-link candidates inside nav
    const candidates = Array.from(nav.querySelectorAll("a.brand, a[href='/'], a[href=\"/\"]"));
    if (!candidates.length) return;

    const brand = candidates[0];
    brand.classList.add("brand");
    brand.setAttribute("href", "/");

    // Remove duplicates (fixes "TON DROP HUB TON DROP HUB")
    for (let i = 1; i < candidates.length; i++) {
      const dup = candidates[i];
      const href = (dup.getAttribute("href") || "").trim();
      if (href === "/") dup.remove();
    }

    // If already has wordmark, don't rewrite
    if (brand.querySelector(".wordmark")) return;

    brand.innerHTML = `
      <img class="brand-logo" src="/assets/logo.png" alt="TON Drop Hub" loading="eager" />
      <span class="wordmark">
        <span class="ton">TON</span><span class="drop">DROP</span><span class="hub">HUB</span>
      </span>
    `.trim();
  }

  function init() {
    // Theme: saved > pre-set attr (from early snippet) > system
    const t = getSavedTheme() || currentTheme() || getSystemTheme();
    document.documentElement.setAttribute("data-theme", t);

    const nav = document.querySelector(".nav");
    if (nav) {
      decorateBrand(nav);
      ensureThemeToggle(nav);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

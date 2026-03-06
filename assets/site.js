/* TDH /assets/site.js (v7)
   - Theme system (original code)
   - Global comments system
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
      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
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
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }

  function toggleTheme() {
    const t = currentTheme() || getSavedTheme() || getSystemTheme();
    setTheme(t === "dark" ? "light" : "dark");
  }

  function ensureThemeToggle(nav) {
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

      btn.innerHTML = `
        <svg class="icon icon-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4"></circle>
        </svg>
        <svg class="icon icon-moon" viewBox="0 0 24 24">
          <path d="M21 12.8A8.5 8.5 0 0 1 11.2 3 7 7 0 1 0 21 12.8z"></path>
        </svg>
      `.trim();

      right.insertBefore(btn, right.firstChild);
    }

    if (!btn.dataset.bound) {
      btn.addEventListener("click", toggleTheme);
      btn.dataset.bound = "1";
    }
  }

  function decorateBrand(nav) {
    const candidates = Array.from(
      nav.querySelectorAll("a.brand, a[href='/']")
    );

    if (!candidates.length) return;

    const brand = candidates[0];

    brand.classList.add("brand");
    brand.setAttribute("href", "/");

    for (let i = 1; i < candidates.length; i++) {
      const dup = candidates[i];
      const href = (dup.getAttribute("href") || "").trim();
      if (href === "/") dup.remove();
    }

    if (brand.querySelector(".wordmark")) return;

    brand.innerHTML = `
      <img class="brand-logo" src="/assets/logo.png" alt="TON Drop Hub" loading="eager" />
      <span class="wordmark">
        <span class="ton">TON</span>
        <span class="drop">DROP</span>
        <span class="hub">HUB</span>
      </span>
    `.trim();
  }

  function initTheme() {
    const t = getSavedTheme() || currentTheme() || getSystemTheme();
    document.documentElement.setAttribute("data-theme", t);

    const nav = document.querySelector(".nav");

    if (nav) {
      decorateBrand(nav);
      ensureThemeToggle(nav);
    }
  }

  /* ===============================
     COMMENTS SYSTEM
  =============================== */

  function initComments() {
    const article = document.querySelector("article");

    if (!article) return;

    const container = document.createElement("div");
    container.className = "comments";

    container.innerHTML = `
      <h3>Comments</h3>
      <div id="comments-list"></div>

      <div class="comment-form">
        <input id="comment-name" placeholder="Your name">
        <textarea id="comment-text" placeholder="Write a comment"></textarea>
        <button id="comment-submit">Post Comment</button>
      </div>
    `;

    article.appendChild(container);

    loadComments();

    document
      .getElementById("comment-submit")
      .addEventListener("click", submitComment);
  }

  const API = "/api/comments";

  function slug() {
    return window.location.pathname;
  }

  async function loadComments() {
    const res = await fetch(API + "?slug=" + encodeURIComponent(slug()));
    const data = await res.json();

    const list = document.getElementById("comments-list");

    if (!list) return;

    if (!data.length) {
      list.innerHTML = "<p>No comments yet</p>";
      return;
    }

    list.innerHTML = data
      .map(
        c => `
      <div class="comment">
        <div class="comment-author">${escape(c.author)}</div>
        <div class="comment-text">${escape(c.comment)}</div>
      </div>
    `
      )
      .join("");
  }

  async function submitComment() {
    const name = document
      .getElementById("comment-name")
      .value.trim();

    const text = document
      .getElementById("comment-text")
      .value.trim();

    if (!name || !text) {
      alert("Fill all fields");
      return;
    }

    if (/http|https|www/i.test(text)) {
      alert("Links are not allowed");
      return;
    }

    const banned = [
      "fuck",
      "shit",
      "bitch",
      "asshole",
      "bastard"
    ];

    const t = text.toLowerCase();

    if (banned.some(w => t.includes(w))) {
      alert("Bad language not allowed");
      return;
    }

    const res = await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        slug: slug(),
        author: name,
        comment: text
      })
    });

    if (res.ok) {
      document.getElementById("comment-text").value = "";
      loadComments();
    } else {
      alert("Error posting comment");
    }
  }

  function escape(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ===============================
     INIT
  =============================== */

  function init() {
    initTheme();
    initComments();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

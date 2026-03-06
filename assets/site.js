/* TDH /assets/site.js (v9)
   - Theme system
   - Brand normalization
   - Global comments system
   - Cloudflare Turnstile support
   - Fixed article selector (.article first, fallback to article)
*/

(() => {
  "use strict";

  const STORAGE_KEY = "tdh_theme";
  const THEMES = new Set(["dark", "light"]);
  const TURNSTILE_SITE_KEY = "0x4AAAAAAACnLNwW5Yhqq0C3_";
  let turnstileWidgetId = null;

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

      const badge = nav.querySelector(".badge");
      if (badge && badge.parentElement === right) {
        right.insertBefore(btn, badge);
      } else {
        right.insertBefore(btn, right.firstChild);
      }
    }

    if (!btn.dataset.bound) {
      btn.addEventListener("click", toggleTheme);
      btn.dataset.bound = "1";
    }
  }

  function decorateBrand(nav) {
    const candidates = Array.from(
      nav.querySelectorAll("a.brand, a[href='/'], a[href=\"/\"]")
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
        <span class="ton">TON</span><span class="drop">DROP</span><span class="hub">HUB</span>
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

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function articleSlug() {
    return window.location.pathname;
  }

  function ensureTurnstileScript() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) {
        resolve();
        return;
      }

      const existing = document.querySelector('script[data-turnstile-script="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Turnstile script failed")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Turnstile script failed"));
      document.head.appendChild(script);
    });
  }

  async function renderTurnstile() {
    const target = document.getElementById("turnstile-container");
    if (!target) return;

    try {
      await ensureTurnstileScript();

      if (!window.turnstile) return;

      if (turnstileWidgetId !== null) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch {}
        turnstileWidgetId = null;
      }

      target.innerHTML = "";

      turnstileWidgetId = window.turnstile.render(target, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto"
      });
    } catch (err) {
      console.error("Turnstile error:", err);
      target.innerHTML = `<p class="comment-status error">Captcha failed to load.</p>`;
    }
  }

  async function loadComments() {
    const list = document.getElementById("comments-list");
    if (!list) return;

    try {
      const res = await fetch("/api/comments?slug=" + encodeURIComponent(articleSlug()));
      const data = await res.json();

      if (!Array.isArray(data) || !data.length) {
        list.innerHTML = "<p>No comments yet.</p>";
        return;
      }

      list.innerHTML = data.map((c) => `
        <div class="comment">
          <div class="comment-author">${escapeHtml(c.author)}</div>
          <div class="comment-text">${escapeHtml(c.comment)}</div>
        </div>
      `).join("");
    } catch (err) {
      console.error("Failed to load comments:", err);
      list.innerHTML = "<p>Failed to load comments.</p>";
    }
  }

  async function submitComment() {
    const nameInput = document.getElementById("comment-name");
    const textInput = document.getElementById("comment-text");
    const statusBox = document.getElementById("comment-status");

    if (!nameInput || !textInput || !statusBox) return;

    const author = nameInput.value.trim();
    const comment = textInput.value.trim();

    statusBox.textContent = "";
    statusBox.className = "comment-status";

    if (!author || !comment) {
      statusBox.textContent = "Fill all fields.";
      statusBox.classList.add("error");
      return;
    }

    let turnstileToken = "";

    try {
      if (window.turnstile && turnstileWidgetId !== null) {
        turnstileToken = window.turnstile.getResponse(turnstileWidgetId) || "";
      }
    } catch {}

    if (!turnstileToken) {
      statusBox.textContent = "Complete captcha first.";
      statusBox.classList.add("error");
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          slug: articleSlug(),
          author,
          comment,
          turnstileToken
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        statusBox.textContent = data.message || "Too many requests. Please wait.";
        statusBox.classList.add("error");
        return;
      }

      if (res.status === 403) {
        statusBox.textContent = "Captcha verification failed.";
        statusBox.classList.add("error");
        await renderTurnstile();
        return;
      }

      if (!res.ok) {
        statusBox.textContent = data.message || data.error || "Error posting comment.";
        statusBox.classList.add("error");
        await renderTurnstile();
        return;
      }

      if (data.status === "pending") {
        statusBox.textContent = data.message || "Your comment was sent for moderation.";
        statusBox.classList.add("success");
      } else {
        statusBox.textContent = "Comment posted successfully.";
        statusBox.classList.add("success");
      }

      textInput.value = "";
      await loadComments();
      await renderTurnstile();
    } catch (err) {
      console.error("Failed to post comment:", err);
      statusBox.textContent = "Network error. Try again.";
      statusBox.classList.add("error");
      await renderTurnstile();
    }
  }

  async function initComments() {
    const article =
      document.querySelector(".article") ||
      document.querySelector("article");

    if (!article) return;
    if (document.getElementById("comments-root")) return;

    const container = document.createElement("div");
    container.id = "comments-root";
    container.className = "comments";

    container.innerHTML = `
      <h3>Comments</h3>
      <div id="comments-list"></div>

      <div class="comment-form">
        <input id="comment-name" type="text" maxlength="40" placeholder="Your name" />
        <textarea id="comment-text" maxlength="500" placeholder="Write a comment"></textarea>
        <div id="turnstile-container"></div>
        <div id="comment-status" class="comment-status"></div>
        <button id="comment-submit" type="button">Post Comment</button>
      </div>
    `;

    article.appendChild(container);

    const submitBtn = document.getElementById("comment-submit");
    if (submitBtn && !submitBtn.dataset.bound) {
      submitBtn.addEventListener("click", submitComment);
      submitBtn.dataset.bound = "1";
    }

    await loadComments();
    await renderTurnstile();
  }

  async function init() {
    initTheme();
    await initComments();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init().catch((err) => console.error("Init error:", err));
    });
  } else {
    init().catch((err) => console.error("Init error:", err));
  }
})();

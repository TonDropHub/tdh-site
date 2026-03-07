/* TDH /assets/site.js (v11)
   - Theme system
   - Brand normalization
   - Global comments system
   - Cloudflare Turnstile support
   - Safer Turnstile init / re-render flow
   - Safe inline comment styles (independent from style.css)
*/

(() => {
  "use strict";

  const STORAGE_KEY = "tdh_theme";
  const THEMES = new Set(["dark", "light"]);
  const TURNSTILE_SITE_KEY = "0x4AAAAAACnRNq6elLBwnNt9";

  let turnstileWidgetId = null;
  let turnstileScriptPromise = null;
  let turnstileRenderPromise = null;
  let turnstileAutoRetryTimer = null;
  let turnstileRefreshTimer = null;

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
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function toggleTheme() {
    const t = currentTheme() || getSavedTheme() || getSystemTheme();
    setTheme(t === "dark" ? "light" : "dark");
    if (document.getElementById("turnstile-container")) {
      renderTurnstile(true).catch(() => {});
    }
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
    brand.setAttribute("aria-label", "Go to home page");
    brand.setAttribute("title", "TON Drop Hub");

    for (let i = 1; i < candidates.length; i++) {
      const dup = candidates[i];
      const href = (dup.getAttribute("href") || "").trim();
      if (href === "/") dup.remove();
    }

    brand.innerHTML = `
      <img class="brand-logo" src="/assets/logo.png" alt="TON Drop Hub" loading="eager" />
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

  function injectCommentStyles() {
    if (document.getElementById("tdh-comments-inline-style")) return;

    const style = document.createElement("style");
    style.id = "tdh-comments-inline-style";
    style.textContent = `
      #comments-root{
        margin-top:36px;
        margin-bottom:24px;
        padding:22px;
        border-radius:22px;
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.10);
        box-shadow:0 12px 32px rgba(0,0,0,.22);
      }
      #comments-root h3{
        margin:0 0 14px;
        font-size:30px;
        line-height:1.1;
        color:#fff;
      }
      #comments-list{
        display:grid;
        gap:12px;
        margin:0 0 14px;
      }
      #comments-list p{
        margin:0;
        color:rgba(255,255,255,.80);
      }
      #comments-root .comment{
        padding:14px 16px;
        border-radius:16px;
        background:rgba(255,255,255,.045);
        border:1px solid rgba(255,255,255,.08);
      }
      #comments-root .comment-author{
        margin:0 0 8px;
        font-weight:800;
        font-size:14px;
        color:#fff;
      }
      #comments-root .comment-text{
        font-size:15px;
        line-height:1.65;
        color:rgba(255,255,255,.84);
        white-space:pre-wrap;
        word-break:break-word;
      }
      #comments-root .comment-form{
        display:grid;
        gap:12px;
      }
      #comments-root .comment-row{
        display:grid;
        grid-template-columns:220px 1fr;
        gap:12px;
      }
      #comments-root input,
      #comments-root textarea{
        width:100%;
        display:block;
        margin:0;
        padding:14px 16px;
        border-radius:16px;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.06);
        color:#fff;
        outline:none;
        font:inherit;
      }
      #comments-root input::placeholder,
      #comments-root textarea::placeholder{
        color:rgba(255,255,255,.55);
      }
      #comments-root input:focus,
      #comments-root textarea:focus{
        border-color:rgba(0,200,255,.55);
        box-shadow:0 0 0 4px rgba(0,200,255,.10);
        background:rgba(255,255,255,.08);
      }
      #comments-root textarea{
        min-height:130px;
        resize:vertical;
      }
      #turnstile-container{
        min-height:66px;
        display:flex;
        align-items:center;
        justify-content:flex-start;
      }
      #comment-submit{
        width:fit-content;
        min-width:170px;
        padding:13px 18px;
        border:none;
        border-radius:999px;
        background:linear-gradient(135deg, rgba(0,200,255,.92), rgba(0,144,240,.92));
        color:#fff;
        font:inherit;
        font-weight:800;
        cursor:pointer;
        box-shadow:0 10px 24px rgba(0,120,255,.24);
      }
      #comment-submit:hover{filter:brightness(1.08)}
      #comment-submit:disabled{opacity:.65;cursor:not-allowed}
      #comment-status{
        display:none;
        padding:12px 14px;
        border-radius:14px;
        font-size:14px;
      }
      #comment-status.success,
      #comment-status.error{
        display:block;
      }
      #comment-status.success{
        background:rgba(29,185,84,.14);
        border:1px solid rgba(29,185,84,.30);
        color:#8df0b0;
      }
      #comment-status.error{
        background:rgba(255,96,96,.14);
        border:1px solid rgba(255,96,96,.28);
        color:#ffadad;
      }
      html[data-theme="light"] #comments-root{
        background:rgba(255,255,255,.86);
        border:1px solid rgba(0,0,0,.08);
        box-shadow:0 12px 32px rgba(0,0,0,.10);
      }
      html[data-theme="light"] #comments-root h3,
      html[data-theme="light"] #comments-root .comment-author{
        color:#0b1020;
      }
      html[data-theme="light"] #comments-list p,
      html[data-theme="light"] #comments-root .comment-text{
        color:rgba(0,0,0,.78);
      }
      html[data-theme="light"] #comments-root .comment{
        background:rgba(0,0,0,.03);
        border-color:rgba(0,0,0,.07);
      }
      html[data-theme="light"] #comments-root input,
      html[data-theme="light"] #comments-root textarea{
        background:#fff;
        border-color:rgba(0,0,0,.10);
        color:#0b1020;
      }
      html[data-theme="light"] #comments-root input::placeholder,
      html[data-theme="light"] #comments-root textarea::placeholder{
        color:rgba(0,0,0,.45);
      }
      @media (max-width:640px){
        #comments-root{
          padding:18px;
          border-radius:18px;
        }
        #comments-root h3{
          font-size:24px;
        }
        #comments-root .comment-row{
          grid-template-columns:1fr;
        }
        #comment-submit{
          width:100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function articleSlug() {
    return window.location.pathname;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clearTurnstileTimers() {
    if (turnstileAutoRetryTimer) {
      clearTimeout(turnstileAutoRetryTimer);
      turnstileAutoRetryTimer = null;
    }
    if (turnstileRefreshTimer) {
      clearTimeout(turnstileRefreshTimer);
      turnstileRefreshTimer = null;
    }
  }

  function scheduleTurnstileRetry(delay = 2500) {
    clearTurnstileTimers();
    turnstileAutoRetryTimer = setTimeout(() => {
      renderTurnstile(true).catch(() => {});
    }, delay);
  }

  function scheduleTurnstileRefresh(delay = 240000) {
    if (turnstileRefreshTimer) {
      clearTimeout(turnstileRefreshTimer);
    }
    turnstileRefreshTimer = setTimeout(() => {
      renderTurnstile(true).catch(() => {});
    }, delay);
  }

  async function waitForTurnstileTarget(maxAttempts = 20, delay = 150) {
    for (let i = 0; i < maxAttempts; i++) {
      const target = document.getElementById("turnstile-container");
      if (target && document.body.contains(target)) {
        return target;
      }
      await wait(delay);
    }
    return null;
  }

  function ensureTurnstileScript() {
    if (window.turnstile && typeof window.turnstile.render === "function") {
      return Promise.resolve();
    }

    if (turnstileScriptPromise) {
      return turnstileScriptPromise;
    }

    turnstileScriptPromise = new Promise((resolve, reject) => {
      const resolveWhenReady = () => {
        let attempts = 0;
        const maxAttempts = 80;
        const tick = () => {
          if (window.turnstile && typeof window.turnstile.render === "function") {
            resolve();
            return;
          }
          attempts += 1;
          if (attempts >= maxAttempts) {
            reject(new Error("Turnstile API unavailable"));
            return;
          }
          setTimeout(tick, 100);
        };
        tick();
      };

      const existing = document.querySelector('script[data-turnstile-script="1"]');

      if (existing) {
        if (window.turnstile && typeof window.turnstile.render === "function") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolveWhenReady, { once: true });
        existing.addEventListener("error", () => reject(new Error("Turnstile script failed")), { once: true });
        resolveWhenReady();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = "1";
      script.onload = resolveWhenReady;
      script.onerror = () => reject(new Error("Turnstile script failed"));
      document.head.appendChild(script);
    }).catch((err) => {
      turnstileScriptPromise = null;
      throw err;
    });

    return turnstileScriptPromise;
  }

  async function renderTurnstile(force = false) {
    if (turnstileRenderPromise && !force) {
      return turnstileRenderPromise;
    }

    turnstileRenderPromise = (async () => {
      const target = await waitForTurnstileTarget();
      if (!target) {
        console.error("Turnstile target not found");
        return;
      }

      try {
        await ensureTurnstileScript();

        if (!window.turnstile || typeof window.turnstile.render !== "function") {
          throw new Error("Turnstile API unavailable");
        }

        clearTurnstileTimers();

        if (turnstileWidgetId !== null) {
          try { window.turnstile.remove(turnstileWidgetId); } catch {}
          turnstileWidgetId = null;
        }

        target.innerHTML = "";

        turnstileWidgetId = window.turnstile.render(target, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: currentTheme() || getSavedTheme() || getSystemTheme(),
          callback: () => {
            const statusBox = document.getElementById("comment-status");
            if (statusBox && statusBox.textContent === "Complete captcha first.") {
              statusBox.textContent = "";
              statusBox.className = "";
            }
            scheduleTurnstileRefresh();
          },
          "expired-callback": () => {
            const statusBox = document.getElementById("comment-status");
            if (statusBox) {
              statusBox.textContent = "Captcha expired. Reloading captcha...";
              statusBox.className = "error";
            }
            scheduleTurnstileRetry(800);
          },
          "timeout-callback": () => {
            scheduleTurnstileRetry(800);
          },
          "error-callback": () => {
            const statusBox = document.getElementById("comment-status");
            if (statusBox) {
              statusBox.textContent = "Captcha failed to load. Retrying...";
              statusBox.className = "error";
            }
            scheduleTurnstileRetry(1500);
          }
        });
      } catch (err) {
        console.error("Turnstile error:", err);
        target.innerHTML = `<p class="comment-status error">Captcha failed to load. Retrying...</p>`;
        scheduleTurnstileRetry(2000);
      } finally {
        turnstileRenderPromise = null;
      }
    })();

    return turnstileRenderPromise;
  }

  async function loadComments() {
    const list = document.getElementById("comments-list");
    if (!list) return;

    try {
      const res = await fetch("/api/comments?slug=" + encodeURIComponent(articleSlug()), {
        headers: {
          "accept": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`Comments request failed: ${res.status}`);
      }

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
    const submitBtn = document.getElementById("comment-submit");

    if (!nameInput || !textInput || !statusBox || !submitBtn) return;

    const author = nameInput.value.trim();
    const comment = textInput.value.trim();

    statusBox.textContent = "";
    statusBox.className = "";
    submitBtn.disabled = true;

    if (!author || !comment) {
      statusBox.textContent = "Fill all fields.";
      statusBox.className = "error";
      submitBtn.disabled = false;
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
      statusBox.className = "error";
      submitBtn.disabled = false;
      await renderTurnstile();
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          slug: articleSlug(),
          author,
          comment,
          turnstileToken
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        statusBox.textContent = data.message || "Too many requests. Please wait.";
        statusBox.className = "error";
        await renderTurnstile(true);
        submitBtn.disabled = false;
        return;
      }

      if (res.status === 403) {
        statusBox.textContent = data.message || "Captcha verification failed.";
        statusBox.className = "error";
        await renderTurnstile(true);
        submitBtn.disabled = false;
        return;
      }

      if (!res.ok) {
        statusBox.textContent = data.message || data.error || "Error posting comment.";
        statusBox.className = "error";
        await renderTurnstile(true);
        submitBtn.disabled = false;
        return;
      }

      if (data.status === "pending") {
        statusBox.textContent = data.message || "Your comment was sent for moderation.";
        statusBox.className = "success";
      } else {
        statusBox.textContent = "Comment posted successfully.";
        statusBox.className = "success";
      }

      nameInput.value = "";
      textInput.value = "";
      await loadComments();
      await renderTurnstile(true);
      submitBtn.disabled = false;
    } catch (err) {
      console.error("Failed to post comment:", err);
      statusBox.textContent = "Network error. Try again.";
      statusBox.className = "error";
      await renderTurnstile(true);
      submitBtn.disabled = false;
    }
  }

  async function initComments() {
    const article =
      document.querySelector(".article") ||
      document.querySelector("article");

    if (!article) return;
    if (document.getElementById("comments-root")) return;

    injectCommentStyles();

    const container = document.createElement("div");
    container.id = "comments-root";

    container.innerHTML = `
      <h3>Comments</h3>
      <div id="comments-list"></div>

      <div class="comment-form">
        <div class="comment-row">
          <input id="comment-name" type="text" maxlength="40" placeholder="Your name" />
          <textarea id="comment-text" maxlength="500" placeholder="Write a comment"></textarea>
        </div>
        <div id="turnstile-container"></div>
        <div id="comment-status"></div>
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

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && document.getElementById("turnstile-container")) {
        renderTurnstile(true).catch(() => {});
      }
    });

    window.addEventListener("pageshow", () => {
      if (document.getElementById("turnstile-container")) {
        renderTurnstile(true).catch(() => {});
      }
    });

    window.addEventListener("focus", () => {
      if (document.getElementById("turnstile-container")) {
        renderTurnstile(true).catch(() => {});
      }
    });

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

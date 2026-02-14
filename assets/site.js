(() => {
  const KEY = "tdh_theme";
  const root = document.documentElement;

  function systemDefault() {
    try {
      return (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches)
        ? "light"
        : "dark";
    } catch (e) {
      return "dark";
    }
  }

  function getTheme() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    return root.dataset.theme || systemDefault();
  }

  function setTheme(theme) {
    const t = theme === "light" ? "light" : "dark";
    root.dataset.theme = t;
    try {
      localStorage.setItem(KEY, t);
    } catch (e) {}
  }

  function wireToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    // Ensure theme is applied.
    setTheme(getTheme());

    btn.addEventListener("click", () => {
      const next = (root.dataset.theme === "light") ? "dark" : "light";
      setTheme(next);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireToggle);
  } else {
    wireToggle();
  }
})();

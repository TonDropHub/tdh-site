/* TDH site.js (v4)
   - Persists light/dark theme across ALL pages (localStorage)
   - Ensures the top nav uses the same logo/wordmark + adds theme toggle if missing
   - Marks active nav pill based on current path

   Install:
   1) Save as: /assets/site.js
   2) Add to <head> of every page/template:
        <script src="/assets/site.js" defer></script>
      (Optional but recommended to avoid flash:
        <script>(function(){try{var t=localStorage.getItem('tdh_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
      placed BEFORE the CSS link.)
*/

(function(){
  const THEME_KEY = 'tdh_theme';
  const DEFAULT_THEME = 'dark';

  function getSavedTheme(){
    try{
      const t = localStorage.getItem(THEME_KEY);
      return (t === 'light' || t === 'dark') ? t : null;
    }catch(e){
      return null;
    }
  }

  function applyTheme(theme){
    const t = (theme === 'light' || theme === 'dark') ? theme : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', t);
    try{ localStorage.setItem(THEME_KEY, t); }catch(e){}
  }

  // Apply ASAP (still runs before DOMContentLoaded because defer).
  (function(){
    const saved = getSavedTheme();
    if(saved) document.documentElement.setAttribute('data-theme', saved);
  })();

  function ensureStyleLink(){
    // Some legacy/generated pages might miss the stylesheet.
    const has = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(l => (l.getAttribute('href') || '').trim() === '/assets/style.css');
    if(!has){
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/style.css';
      document.head.appendChild(link);
    }
  }

  function createThemeToggleButton(){
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.id = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.setAttribute('title', 'Toggle theme');

    // Two icons, CSS hides the one that doesn't match current theme.
    btn.innerHTML = `
      <svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"></path>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
      </svg>
      <svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A8 8 0 1 1 11.21 3a6.5 6.5 0 0 0 9.79 9.79Z"></path>
      </svg>
    `;

    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
      const next = (cur === 'light') ? 'dark' : 'light';
      applyTheme(next);
    });

    return btn;
  }

  function normalizeBrand(brandEl){
    if(!brandEl) return;
    // Avoid re-writing if already normalized.
    if(brandEl.querySelector('.brand-logo') && brandEl.querySelector('.wordmark')) return;

    // Keep href if exists.
    const href = brandEl.getAttribute('href') || '/';

    brandEl.setAttribute('href', href);
    brandEl.classList.add('brand');

    // Logo path is case-sensitive on Cloudflare Pages.
    // Fallback: try /assets/logo.png then /assets/Logo.png.

    brandEl.innerHTML = `
      <img class="brand-logo" src="/assets/logo.png" alt="TON Drop Hub" onerror="this.onerror=null;this.src='/assets/Logo.png';" />
      <span class="wordmark">
        <span class="ton">TON</span>
        <span class="drop">DROP</span>
        <span class="hub">HUB</span>
      </span>
    `;
  }

  function ensureRightBlock(navEl){
    if(!navEl) return null;
    let right = navEl.querySelector('.right');
    if(right) return right;

    right = document.createElement('div');
    right.className = 'right';

    // Move existing badge into right if it's a direct child.
    const badge = navEl.querySelector('.badge');
    if(badge && badge.parentElement === navEl){
      navEl.removeChild(badge);
      right.appendChild(badge);
    }

    navEl.appendChild(right);
    return right;
  }

  function ensureThemeToggle(navEl){
    if(!navEl) return;
    const right = ensureRightBlock(navEl);
    if(!right) return;

    // If a toggle already exists anywhere in nav, don't duplicate.
    if(navEl.querySelector('#theme-toggle')) return;

    const btn = createThemeToggleButton();
    // Insert before badge if badge is there.
    const badge = right.querySelector('.badge');
    if(badge) right.insertBefore(btn, badge);
    else right.appendChild(btn);
  }

  function markActivePill(navEl){
    if(!navEl) return;
    const path = (location.pathname || '/').toLowerCase();

    const pills = navEl.querySelectorAll('.pill');
    pills.forEach(a => a.classList.remove('active'));

    const match = (href) => {
      if(!href) return false;
      const h = href.toLowerCase();
      if(h === '/') return path === '/' || path === '';
      // Treat "/news/" as active for "/news/..." etc.
      return path.startsWith(h);
    };

    for(const a of pills){
      const href = a.getAttribute('href');
      if(match(href)){
        a.classList.add('active');
        break;
      }
    }
  }

  function buildNavElement(){
    const nav = document.createElement('div');
    nav.className = 'nav';

    nav.innerHTML = `
      <div class="left">
        <a class="brand" href="/">TON Drop Hub</a>
        <div class="pills">
          <a class="pill" href="/news/">News</a>
          <a class="pill" href="/airdrops/">Airdrops &amp; Quests</a>
          <a class="pill" href="/guides/">Guides</a>
          <a class="pill" href="/projects/">Projects</a>
          <a class="pill" href="/about/">About</a>
        </div>
      </div>
      <span class="badge">MVP</span>
    `;

    return nav;
  }

function ensureNavNormalized(){
    let navEl = document.querySelector('.nav');
    if(!navEl){
      // Some legacy/generated pages might have no header at all.
      // We inject a consistent nav at the top.
      navEl = buildNavElement();
      const container = document.querySelector('.container');
      if(container) container.prepend(navEl);
      else document.body.prepend(navEl);
    }

    // Ensure left wrapper exists
    const left = navEl.querySelector('.left') || navEl;

    // Normalize brand
    const brand = left.querySelector('a.brand') || left.querySelector('a[href="/"]') || left.querySelector('a');
    normalizeBrand(brand);

    // Ensure pills have class pill (some legacy templates might miss)
    left.querySelectorAll('a').forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      if(href.startsWith('/') && href !== '/' && !a.classList.contains('brand')){
        if(!a.classList.contains('pill') && a.parentElement && a.parentElement.classList.contains('pills')){
          a.classList.add('pill');
        }
      }
    });

    ensureThemeToggle(navEl);
    markActivePill(navEl);

    // Make nav sticky across all pages.
    navEl.style.position = navEl.style.position || 'sticky';
    navEl.style.top = navEl.style.top || '14px';
    navEl.style.zIndex = navEl.style.zIndex || '50';
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyleLink();

    // Apply saved theme definitively (and persist default if missing).
    const saved = getSavedTheme();
    applyTheme(saved || (document.documentElement.getAttribute('data-theme') || DEFAULT_THEME));

    ensureNavNormalized();
  });
})();

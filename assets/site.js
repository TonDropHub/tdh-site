:root{
  --bg:#0b1020;
  --fg:#e9edff;
  --muted:rgba(233,237,255,.74);
  --muted2:rgba(233,237,255,.62);
  --nav-bg:rgba(255,255,255,.04);
  --nav-border:rgba(255,255,255,.10);
  --card-bg:rgba(255,255,255,.06);
  --card-border:rgba(255,255,255,.10);
  --pill-bg:rgba(255,255,255,.06);
  --pill-border:rgba(255,255,255,.12);
  --input-bg:rgba(255,255,255,.05);
  --input-border:rgba(255,255,255,.12);
  --input-focus:rgba(0,200,255,.55);
  --comment-bg:rgba(255,255,255,.05);
  --comment-border:rgba(255,255,255,.09);
  --success-bg:rgba(29,185,84,.14);
  --success-border:rgba(29,185,84,.28);
  --success-text:#89efad;
  --error-bg:rgba(255,96,96,.14);
  --error-border:rgba(255,96,96,.26);
  --error-text:#ff9d9d;
  --shadow:0 16px 50px rgba(0,0,0,.35);
  --shadow-soft:0 10px 30px rgba(0,0,0,.28);
  --accent1:#00c8ff;
  --accent2:#0090f0;
}

*{box-sizing:border-box}

html,body{margin:0;padding:0}

body{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;
  background:
    radial-gradient(1200px 800px at 20% 10%, rgba(54,194,255,.16), transparent 60%),
    radial-gradient(1000px 700px at 90% 30%, rgba(124,92,255,.14), transparent 55%),
    #0b1020;
  color:var(--fg);
  line-height:1.45;
}

a{color:inherit;text-decoration:none}

.container{max-width:1100px;margin:0 auto;padding:26px 18px 48px}

.nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px;border-radius:18px;
  background:var(--nav-bg);
  border:1px solid var(--nav-border);
  backdrop-filter: blur(10px);
  box-shadow:var(--shadow-soft);
}

.nav .left{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.nav .right{display:flex;align-items:center;gap:10px;flex-shrink:0}

.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.2px}
.brand-logo{
  width:28px;height:28px;border-radius:8px;
  object-fit:contain;
  background:transparent;
  border:1px solid rgba(255,255,255,.10);
}

.wordmark{display:flex;align-items:baseline;gap:6px;font-weight:900}
.wordmark .ton{color:#fff}

.wordmark .drop{
  background:linear-gradient(90deg,var(--accent1),var(--accent2));
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
}
.wordmark .hub{
  background:linear-gradient(90deg,var(--accent2),var(--accent1));
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
}

.pills{display:flex;gap:8px;flex-wrap:wrap}
.pill{
  padding:7px 10px;border-radius:999px;
  background:var(--pill-bg);
  border:1px solid var(--pill-border);
  font-weight:600;font-size:13px;
}

.pill:hover{filter:brightness(1.1)}

.badge{
  padding:6px 10px;border-radius:999px;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.10);
  font-weight:700;font-size:12px;opacity:.95
}

.hero{margin-top:28px}
.h1{font-size:56px;line-height:1.05;margin:0 0 14px}
.sub{max-width:780px;color:var(--muted);font-size:15px;margin:0}

.grid{display:grid;gap:14px}
.grid-4{grid-template-columns:repeat(4,1fr)}
@media (max-width:1060px){
  .grid-4{grid-template-columns:repeat(2,1fr)}
  .h1{font-size:44px}
}
@media (max-width:560px){
  .grid-4{grid-template-columns:1fr}
  .h1{font-size:36px}
}

.card{
  border-radius:18px;
  padding:16px 16px 14px;
  background:var(--card-bg);
  border:1px solid var(--card-border);
  box-shadow:var(--shadow-soft);
  min-height:160px;
}

.card h2{font-size:20px;margin:0}

.meta{color:var(--muted2);font-size:12px;letter-spacing:.6px;text-transform:uppercase}

.excerpt{margin:0;color:var(--muted);font-size:14px;max-height:5.2em;overflow:hidden}

.btnrow{margin-top:12px}
.link-title{color:var(--fg)}

.footer{margin-top:26px;color:var(--muted2);font-size:12px}

/* ARTICLE */
.article{
  max-width:900px;
  margin:22px auto 0;
}

.article h1{
  margin:18px 0 0;
  font-size:56px;
  line-height:1.12;
  letter-spacing:-0.02em;
}

.article .meta{
  margin-bottom:10px;
}

.article .hr{
  width:100%;
  height:1px;
  margin:18px 0 26px;
  background:linear-gradient(90deg, rgba(255,255,255,.18), rgba(255,255,255,.05));
  border:0;
}

.article p,
.article li{
  margin:0 0 22px;
  font-size:18px;
  line-height:1.78;
  color:var(--fg);
  text-align:justify;
  text-justify:inter-word;
  hyphens:auto;
}

.article p:last-child,
.article li:last-child{
  margin-bottom:0;
}

.article ul,
.article ol{
  margin:0 0 22px 1.4em;
  padding:0;
}

.article strong{
  color:#ffffff;
}

.article a{
  color:var(--accent1);
  text-decoration:underline;
  text-underline-offset:3px;
}

/* COMMENTS */
.comments{
  margin-top:42px;
  padding:22px;
  border-radius:22px;
  background:linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.035));
  border:1px solid rgba(255,255,255,.10);
  box-shadow:var(--shadow-soft);
}

.comments h3{
  margin:0 0 18px;
  font-size:28px;
  line-height:1.1;
  letter-spacing:-0.02em;
}

#comments-list{
  display:grid;
  gap:14px;
  margin-bottom:18px;
}

.comment{
  padding:16px 18px;
  border-radius:18px;
  background:var(--comment-bg);
  border:1px solid var(--comment-border);
  box-shadow:0 8px 22px rgba(0,0,0,.18);
}

.comment-author{
  margin:0 0 8px;
  font-size:14px;
  font-weight:800;
  letter-spacing:.02em;
  color:#ffffff;
}

.comment-text{
  font-size:15px;
  line-height:1.7;
  color:var(--muted);
  white-space:pre-wrap;
  word-break:break-word;
}

.comment-form{
  display:grid;
  grid-template-columns:1fr;
  gap:12px;
  margin-top:18px;
}

.comment-form input,
.comment-form textarea{
  width:100%;
  display:block;
  padding:14px 16px;
  border-radius:16px;
  border:1px solid var(--input-border);
  background:var(--input-bg);
  color:var(--fg);
  font:inherit;
  outline:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
  transition:border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .18s ease;
}

.comment-form input::placeholder,
.comment-form textarea::placeholder{
  color:var(--muted2);
}

.comment-form input:focus,
.comment-form textarea:focus{
  border-color:var(--input-focus);
  box-shadow:0 0 0 4px rgba(0,200,255,.10);
  background:rgba(255,255,255,.07);
}

.comment-form textarea{
  min-height:136px;
  resize:vertical;
}

#turnstile-container{
  min-height:66px;
  display:flex;
  align-items:center;
  justify-content:flex-start;
}

.comment-status{
  display:none;
  padding:12px 14px;
  border-radius:14px;
  font-size:14px;
  line-height:1.5;
  border:1px solid transparent;
}

.comment-status.success,
.comment-status.error{
  display:block;
}

.comment-status.success{
  background:var(--success-bg);
  border-color:var(--success-border);
  color:var(--success-text);
}

.comment-status.error{
  background:var(--error-bg);
  border-color:var(--error-border);
  color:var(--error-text);
}

#comment-submit{
  width:fit-content;
  min-width:170px;
  padding:13px 18px;
  border-radius:999px;
  border:1px solid rgba(0,200,255,.28);
  background:linear-gradient(135deg, rgba(0,200,255,.18), rgba(0,144,240,.22));
  color:#f5fbff;
  font:inherit;
  font-weight:800;
  letter-spacing:.01em;
  cursor:pointer;
  box-shadow:0 10px 24px rgba(0,120,255,.18);
  transition:transform .18s ease, filter .18s ease, box-shadow .18s ease;
}

#comment-submit:hover{
  filter:brightness(1.08);
  transform:translateY(-1px);
  box-shadow:0 14px 28px rgba(0,120,255,.22);
}

#comment-submit:active{
  transform:translateY(0);
}

#comment-submit:disabled{
  opacity:.65;
  cursor:not-allowed;
  transform:none;
  box-shadow:none;
}

.comments p{
  margin:0;
}

/* Theme toggle */
.theme-toggle{
  display:inline-flex;align-items:center;justify-content:center;
  width:38px;height:34px;
  border-radius:999px;
  background:var(--pill-bg);
  border:1px solid var(--pill-border);
  cursor:pointer;
  box-shadow:none;
}
.theme-toggle:hover{filter:brightness(1.1)}
.theme-toggle:active{transform:translateY(1px)}
.theme-toggle .icon{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
html[data-theme="dark"] .theme-toggle .icon-moon{display:none}
html[data-theme="light"] .theme-toggle .icon-sun{display:none}

/* LIGHT THEME OVERRIDES */
html[data-theme="light"] body{
  background:
    radial-gradient(1200px 800px at 20% 10%, rgba(0,144,240,.12), transparent 60%),
    radial-gradient(1000px 700px at 90% 30%, rgba(0,200,255,.10), transparent 55%),
    #f5f7ff;
  color:#0b1020;
}
html[data-theme="light"] .wordmark .ton{color:#0b1020}
html[data-theme="light"] .brand-logo{border-color:rgba(0,0,0,.10)}
html[data-theme="light"] .nav{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.08);box-shadow:0 10px 30px rgba(0,0,0,.10)}
html[data-theme="light"] .pill{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.10);color:#0b1020}
html[data-theme="light"] .badge{background:rgba(0,0,0,.05);border-color:rgba(0,0,0,.10);color:#0b1020}
html[data-theme="light"] .card{background:rgba(0,0,0,.03);border-color:rgba(0,0,0,.08);box-shadow:0 10px 30px rgba(0,0,0,.10)}
html[data-theme="light"] .meta{color:rgba(0,0,0,.58)}
html[data-theme="light"] .sub,
html[data-theme="light"] .excerpt{color:rgba(0,0,0,.74)}
html[data-theme="light"] .footer{color:rgba(0,0,0,.60)}
html[data-theme="light"] .article p,
html[data-theme="light"] .article li{color:#1b2440}
html[data-theme="light"] .article strong{color:#0b1020}
html[data-theme="light"] .article .hr{background:linear-gradient(90deg, rgba(0,0,0,.18), rgba(0,0,0,.05))}
html[data-theme="light"] .comments{
  background:linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.72));
  border-color:rgba(0,0,0,.08);
  box-shadow:0 10px 30px rgba(0,0,0,.10);
}
html[data-theme="light"] .comment{
  background:rgba(0,0,0,.025);
  border-color:rgba(0,0,0,.07);
  box-shadow:none;
}
html[data-theme="light"] .comment-author{color:#0b1020}
html[data-theme="light"] .comment-text{color:rgba(0,0,0,.76)}
html[data-theme="light"] .comment-form input,
html[data-theme="light"] .comment-form textarea{
  background:#ffffff;
  border-color:rgba(0,0,0,.10);
  color:#0b1020;
}
html[data-theme="light"] .comment-form input::placeholder,
html[data-theme="light"] .comment-form textarea::placeholder{
  color:rgba(0,0,0,.48);
}
html[data-theme="light"] .comment-form input:focus,
html[data-theme="light"] .comment-form textarea:focus{
  background:#ffffff;
  box-shadow:0 0 0 4px rgba(0,144,240,.10);
}
html[data-theme="light"] #comment-submit{
  color:#ffffff;
  box-shadow:0 10px 24px rgba(0,120,255,.16);
}

@media (max-width:900px){
  .article h1{
    font-size:44px;
  }

  .article p,
  .article li{
    font-size:17px;
    line-height:1.72;
  }
}

@media (max-width:640px){
  .container{
    padding:20px 16px 40px;
  }

  .nav{
    padding:10px 12px;
  }

  .article{
    margin-top:18px;
  }

  .article h1{
    font-size:34px;
    line-height:1.16;
  }

  .article .hr{
    margin:14px 0 20px;
  }

  .article p,
  .article li{
    font-size:16px;
    line-height:1.68;
    text-align:left;
    hyphens:none;
  }

  .comments{
    margin-top:32px;
    padding:18px;
    border-radius:18px;
  }

  .comments h3{
    font-size:24px;
    margin-bottom:14px;
  }

  .comment{
    padding:14px 14px;
    border-radius:16px;
  }

  .comment-form{
    gap:10px;
  }

  .comment-form input,
  .comment-form textarea{
    padding:13px 14px;
    border-radius:14px;
  }

  .comment-form textarea{
    min-height:120px;
  }

  #comment-submit{
    width:100%;
    justify-content:center;
  }
}

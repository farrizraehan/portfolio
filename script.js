(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Data ---------- */
  const DRAFT_KEY = 'portfolioDraft';
  let isPreview = false;
  const loadData = () => {
    let d = window.PORTFOLIO_DEFAULT || {};
    try {
      if (/[?&]preview\b/.test(location.search)) {
        const s = localStorage.getItem(DRAFT_KEY);
        if (s) { d = JSON.parse(s); isPreview = true; }
      }
    } catch (e) {}
    return d;
  };
  const D = loadData();
  const arr = v => (Array.isArray(v) ? v : []);

  /* ---------- Helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const gradText = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="grad">$1</span>');
  const safeUrl = u => {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:|#)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
    if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(u)) return 'https://' + u;
    return u;
  };
  const safeImg = u => {
    u = String(u || '').trim();
    if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u)) return u;
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w./-]+$/.test(u)) return u;
    return '';
  };
  const slug = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

  /* ---------- Tema & meta ---------- */
  const T = D.theme || {};
  if (/^#[0-9a-f]{3,8}$/i.test(T.accent || '')) root.style.setProperty('--accent', T.accent);
  if (/^#[0-9a-f]{3,8}$/i.test(T.accent2 || '')) root.style.setProperty('--accent2', T.accent2);
  if (D.siteTitle) document.title = D.siteTitle;
  const md = $('meta[name="description"]');
  if (md && D.siteDescription) md.setAttribute('content', D.siteDescription);

  const themeBtn = $('#themeBtn');
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  const setTheme = (t, persist) => {
    if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    themeBtn.textContent = t === 'light' ? '☀' : '☾';
    if (persist) { try { localStorage.setItem('theme', t); } catch (e) {} }
  };
  setTheme(saved || (T.mode === 'light' ? 'light' : 'dark'), false);
  themeBtn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true));

  if (isPreview) $('#previewBanner').hidden = false;

  /* ---------- Section config ---------- */
  const defLabels = { about: 'Tentang', skills: 'Skill', journey: 'Perjalanan', projects: 'Proyek', hobby: 'Hobi', contact: 'Kontak' };
  const sec = k => Object.assign({ show: true, label: defLabels[k], title: defLabels[k] }, (D.sections || {})[k]);
  const order = ['about', 'skills', 'journey', 'projects', 'hobby', 'contact'];

  const groups = arr(D.skillGroups), exps = arr(D.experience), projs = arr(D.projects), hobbies = arr(D.hobbies);
  const has = {
    about: true,
    skills: groups.length > 0,
    journey: exps.length > 0,
    projects: projs.length > 0,
    hobby: hobbies.length > 0,
    contact: true
  };
  const visible = order.filter(k => sec(k).show && has[k]);

  /* ---------- Hero, nav, footer ---------- */
  const name = D.name || 'Nama Anda';
  const words = name.trim().split(/\s+/);
  $('#heroName').innerHTML = words.length > 1 ? `${esc(words[0])} <span class="grad">${esc(words.slice(1).join(' '))}</span>` : `<span class="grad">${esc(name)}</span>`;
  $('#logo').innerHTML = `${esc(words.map(w => w[0]).join('').slice(0, 2).toUpperCase())}<span>.</span>`;
  const H = D.hero || {};
  $('#heroEyebrow').textContent = H.eyebrow || '';
  $('#heroLead').textContent = H.lead || '';
  $('#heroChips').innerHTML = arr(H.chips).map(c => `<span>${esc(c)}</span>`).join('');
  $('#cta1').textContent = H.cta1 || 'Lihat Proyek';
  $('#cta2').textContent = H.cta2 || 'Hubungi Saya';
  $('#cta1').setAttribute('href', visible.includes('projects') ? '#projects' : '#about');
  $('#cta2').setAttribute('href', visible.includes('contact') ? '#contact' : '#home');
  $('#footName').textContent = name;
  $('#footText').textContent = D.footerText || '';
  $('#year').textContent = new Date().getFullYear();
  $('#links').innerHTML = visible.map(k => `<a href="#${k}">${esc(sec(k).label)}</a>`).join('');

  /* ---------- Render sections ---------- */
  const shell = (k, i, inner, narrow) => {
    const s = sec(k);
    const num = String(i + 1).padStart(2, '0');
    return `<section class="section${i % 2 === 1 ? ' alt' : ''}" id="${k}"><div class="wrap${narrow ? ' narrow' : ''}">
      <h2 class="title reveal"><small>${num} / ${esc(s.label)}</small>${gradText(s.title)}</h2>${inner}</div></section>`;
  };
  const tagsHtml = (list, cls) => arr(list).length ? `<div class="tags${cls ? ' ' + cls : ''}">${arr(list).map(t => `<span>${esc(t)}</span>`).join('')}</div>` : '';

  const build = {
    about() {
      const A = D.about || {};
      const photo = safeImg(A.photo);
      const avatar = photo ? `<img src="${esc(photo)}" alt="Foto ${esc(name)}" />` : `<span>${esc(A.initials || words.map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`;
      const stats = arr(A.stats);
      return `<div class="about-grid">
        <div class="avatar-card reveal">
          <div class="avatar">${avatar}</div>
          ${A.status ? `<div class="status"><i></i> ${esc(A.status)}</div>` : ''}
        </div>
        <div class="about-text reveal">
          ${arr(A.paragraphs).map(p => `<p>${rich(p)}</p>`).join('')}
          ${stats.length ? `<div class="stats" style="grid-template-columns:repeat(${Math.min(stats.length, 4)},1fr)">${stats.map(s => `<div><b data-count="${Number(s.value) || 0}">0</b><span>${esc(s.label)}</span></div>`).join('')}</div>` : ''}
          ${A.statsNote ? `<p class="note">${esc(A.statsNote)}</p>` : ''}
        </div></div>`;
    },
    skills() {
      return `<div class="tabs reveal">${groups.map((g, i) => `<button class="tab${i === 0 ? ' active' : ''}" data-tab="sk${i}">${esc(g.icon || '')} ${esc(g.title)}</button>`).join('')}</div>
      <div id="skillPanels">${groups.map((g, i) => `<div class="panel${i === 0 ? ' active' : ''}" id="sk${i}">
        <div class="bars">${arr(g.items).map(it => { const l = Math.max(0, Math.min(100, Number(it.level) || 0)); return `<div class="bar"><label>${esc(it.name)} <em>${l}%</em></label><div><i data-w="${l}"></i></div></div>`; }).join('')}</div>
        ${tagsHtml(g.tags)}</div>`).join('')}</div>`;
    },
    journey() {
      return `<div class="timeline">${exps.map(e => `<div class="tl-item reveal"><span class="dot"></span>
        <time>${esc(e.period)}</time><h3>${esc(e.title)}</h3><p class="where">${esc(e.place)}</p><p>${esc(e.desc)}</p></div>`).join('')}</div>`;
    },
    projects() {
      const cats = [];
      projs.forEach(p => { const c = (p.category || '').trim(); if (c && !cats.some(x => slug(x) === slug(c))) cats.push(c); });
      const filters = cats.length > 1 ? `<div class="filters reveal"><button class="filter active" data-f="all">Semua</button>${cats.map(c => `<button class="filter" data-f="${esc(slug(c))}">${esc(c)}</button>`).join('')}</div>` : '';
      const cards = projs.map((p, i) => {
        const demo = safeUrl(p.demo), code = safeUrl(p.code);
        const links = [demo ? `<a href="${esc(demo)}" target="_blank" rel="noopener">Demo ↗</a>` : '', code ? `<a href="${esc(code)}" target="_blank" rel="noopener">Kode ↗</a>` : ''].join('');
        return `<article class="card tilt reveal" data-cat="${esc(slug(p.category))}">
          <div class="thumb t${(i % 6) + 1}"><span>${esc(p.icon || '📁')}</span></div>
          <h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${tagsHtml(p.tags, 'sm')}
          ${links ? `<div class="card-links">${links}</div>` : ''}</article>`;
      }).join('');
      return `${filters}<div class="cards">${cards}</div>${D.projectsNote ? `<p class="note center">${esc(D.projectsNote)}</p>` : ''}`;
    },
    hobby() {
      return `<div class="hobby-grid">${hobbies.map(h => {
        const l = Math.max(0, Math.min(100, Number(h.level) || 0));
        return `<div class="hobby reveal"><div class="h-icon">${esc(h.icon || '⭐')}</div><h3>${esc(h.title)}</h3><p>${esc(h.desc)}</p>
          ${tagsHtml(h.tags, 'sm')}${l ? `<div class="level"><span>${esc(h.levelLabel || 'LVL')}</span><div><i style="--lvl:${l}%"></i></div></div>` : ''}</div>`;
      }).join('')}</div>`;
    },
    contact() {
      const C = D.contact || {};
      const social = [];
      if (C.email) social.push({ label: 'Email', url: 'mailto:' + C.email });
      const wa = String(C.whatsapp || '').replace(/\D/g, '');
      if (wa) social.push({ label: 'WhatsApp', url: 'https://wa.me/' + wa });
      arr(C.links).forEach(l => { const u = safeUrl(l.url); if (u && l.label) social.push({ label: l.label, url: u }); });
      return `${C.intro ? `<p class="center reveal muted">${esc(C.intro)}</p>` : ''}
        ${C.email ? `<form class="form reveal" id="form">
          <div class="row"><input type="text" id="fname" placeholder="Nama" required /><input type="email" id="femail" placeholder="Email" required /></div>
          <textarea id="fmsg" rows="5" placeholder="Pesan" required></textarea>
          <button class="btn primary" type="submit">Kirim Pesan →</button></form>` : ''}
        <div class="socials reveal">${social.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div>`;
    }
  };
  $('#app').innerHTML = visible.map((k, i) => shell(k, i, build[k](), k === 'contact')).join('');

  /* ---------- Mobile menu ---------- */
  const links = $('#links');
  $('#burger').addEventListener('click', () => links.classList.toggle('open'));
  $$('#links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* ---------- Scroll: progress, nav, scrollspy ---------- */
  const progress = $('#progress'), nav = $('#nav');
  const spy = $$('section[id]');
  const navLinks = $$('#links a');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', y > 20);
    let cur = '';
    spy.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor glow ---------- */
  const glow = $('#cursorGlow');
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
  } else glow.style.display = 'none';

  /* ---------- Typing effect ---------- */
  const roles = arr(H.roles).filter(Boolean);
  const typed = $('#typed');
  if (roles.length) {
    let ri = 0, ci = 0, del = false;
    (function type() {
      const word = roles[ri];
      typed.textContent = word.slice(0, ci);
      if (!del && ci === word.length) { del = true; return setTimeout(type, 1500); }
      if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; }
      ci += del ? -1 : 1;
      setTimeout(type, del ? 35 : 80);
    })();
  }

  /* ---------- Reveal + counters + bars ---------- */
  const fillBars = scope => $$('.bar i', scope).forEach(i => (i.style.width = i.dataset.w + '%'));
  const countUp = el => {
    const target = +el.dataset.count, dur = 1400, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString('id-ID') + (p === 1 && target >= 1000 ? '+' : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      $$('[data-count]', el).forEach(countUp);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

  const panels = $('#skillPanels');
  if (panels) {
    const pio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { fillBars($('.panel.active', panels)); pio.disconnect(); }
    }), { threshold: 0.2 });
    pio.observe(panels);
  }

  /* ---------- Skill tabs ---------- */
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const p = $('#' + t.dataset.tab);
    p.classList.add('active');
    $$('.bar i', p).forEach(i => (i.style.width = 0));
    requestAnimationFrame(() => requestAnimationFrame(() => fillBars(p)));
  }));

  /* ---------- Project filter ---------- */
  $$('.filter').forEach(b => b.addEventListener('click', () => {
    $$('.filter').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $$('.card').forEach(c => c.classList.toggle('hide', b.dataset.f !== 'all' && c.dataset.cat !== b.dataset.f));
  }));

  /* ---------- 3D tilt cards ---------- */
  if (matchMedia('(pointer: fine)').matches && !reduce) {
    $$('.tilt').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      c.addEventListener('mouseleave', () => (c.style.transform = ''));
    });
  }

  /* ---------- Contact form -> mailto ---------- */
  const form = $('#form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#fname').value, m = $('#fmsg').value, em = $('#femail').value;
    const body = encodeURIComponent(`${m}\n\n— ${n} (${em})`);
    location.href = `mailto:${(D.contact || {}).email}?subject=${encodeURIComponent('Pesan dari portfolio: ' + n)}&body=${body}`;
  });

  /* ---------- Hero particles ---------- */
  const pc = $('#particles'), px = pc.getContext('2d');
  let pw, ph, pts = [];
  const mouse = { x: -999, y: -999 };
  const sizeP = () => {
    pw = pc.width = pc.offsetWidth; ph = pc.height = pc.offsetHeight;
    pts = Array.from({ length: Math.min(90, Math.floor(pw / 16)) }, () => ({
      x: Math.random() * pw, y: Math.random() * ph, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.8 + .6
    }));
  };
  sizeP(); addEventListener('resize', sizeP);
  pc.parentElement.addEventListener('mousemove', e => { const r = pc.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  const drawP = () => {
    px.clearRect(0, 0, pw, ph);
    const light = root.getAttribute('data-theme') === 'light';
    const col = light ? '40,60,110' : '170,200,255';
    pts.forEach((a, i) => {
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > pw) a.vx *= -1;
      if (a.y < 0 || a.y > ph) a.vy *= -1;
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 120) { a.x += (a.x - mouse.x) * .01; a.y += (a.y - mouse.y) * .01; }
      px.beginPath(); px.arc(a.x, a.y, a.r, 0, 7); px.fillStyle = `rgba(${col},.7)`; px.fill();
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) { px.strokeStyle = `rgba(${col},${(1 - d / 110) * .25})`; px.beginPath(); px.moveTo(a.x, a.y); px.lineTo(b.x, b.y); px.stroke(); }
      }
    });
    requestAnimationFrame(drawP);
  };
  if (!reduce) drawP();
})();

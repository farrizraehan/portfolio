(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;

  /* ================= Data ================= */
  const DRAFT_KEY = 'portfolioDraft';
  let isPreview = false;
  const loadData = () => {
    let d = window.PORTFOLIO_DEFAULT || {};
    try {
      if (/[?&]preview\b/.test(location.search)) {
        const s = localStorage.getItem(DRAFT_KEY);
        if (s) {
          d = JSON.parse(s); isPreview = true;
          const def = window.PORTFOLIO_DEFAULT || {};
          const fill = (t, x) => Object.keys(x).forEach(k => {
            if (t[k] === undefined) t[k] = x[k];
            else if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) fill(t[k], x[k]);
          });
          fill(d, def);
        }
      }
    } catch (e) {}
    return d;
  };
  const D = loadData();
  const arr = v => (Array.isArray(v) ? v : []);
  const obj = v => (v && typeof v === 'object' ? v : {});

  /* ================= Helpers ================= */
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
  const initials = s => String(s || '').trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();

  let toastTimer;
  const toast = msg => {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  };
  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta);
      ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  };

  /* ================= Tema & meta ================= */
  const T = obj(D.theme), FX = obj(D.effects);
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
  const toggleTheme = () => setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  setTheme(saved || (T.mode === 'light' ? 'light' : 'dark'), false);
  themeBtn.addEventListener('click', toggleTheme);
  if (isPreview) $('#previewBanner').hidden = false;

  /* ================= Section config ================= */
  const defLabels = { about: 'Tentang', skills: 'Skill', journey: 'Perjalanan', projects: 'Proyek', testimonials: 'Testimoni', hobby: 'Hobi', contact: 'Kontak' };
  const sec = k => Object.assign({ show: true, label: defLabels[k], title: defLabels[k] }, obj(D.sections)[k]);
  const order = ['about', 'skills', 'journey', 'projects', 'testimonials', 'hobby', 'contact'];

  const groups = arr(D.skillGroups), exps = arr(D.experience), projs = arr(D.projects), testis = arr(D.testimonials), hobbies = arr(D.hobbies);
  const A = obj(D.about), N = obj(D.now), C = obj(D.contact), H = obj(D.hero);
  const has = { about: true, skills: groups.length > 0, journey: exps.length > 0, projects: projs.length > 0, testimonials: testis.length > 0, hobby: hobbies.length > 0, contact: true };
  const visible = order.filter(k => sec(k).show && has[k]);

  const name = D.name || 'Nama Anda';
  const words = name.trim().split(/\s+/);
  const email = String(C.email || '').trim();
  const wa = String(C.whatsapp || '').replace(/\D/g, '');
  const socials = arr(C.links).map(l => ({ label: l.label, url: safeUrl(l.url) })).filter(l => l.label && l.url);
  const cvUrl = safeUrl(H.cvUrl);

  /* ================= Hero, nav, footer ================= */
  $('#heroName').innerHTML = words.length > 1 ? `${esc(words[0])} <span class="grad">${esc(words.slice(1).join(' '))}</span>` : `<span class="grad">${esc(name)}</span>`;
  $('#logo').innerHTML = `${esc(initials(name))}<span>.</span>`;
  $('#heroEyebrow').textContent = H.eyebrow || '';
  $('#heroLead').textContent = H.lead || '';
  $('#heroChips').innerHTML = arr(H.chips).map(c => `<span>${esc(c)}</span>`).join('');
  $('#cta1').textContent = H.cta1 || 'Lihat Proyek';
  $('#cta2').textContent = H.cta2 || 'Hubungi Saya';
  $('#cta1').setAttribute('href', visible.includes('projects') ? '#projects' : '#about');
  $('#cta2').setAttribute('href', visible.includes('contact') ? '#contact' : '#home');
  const av = obj(H.available);
  if (av.show && av.text) { $('#heroAvail').hidden = false; $('#heroAvail span').textContent = av.text; }
  if (cvUrl) { const b = $('#ctaCv'); b.hidden = false; b.href = cvUrl; b.textContent = '⬇ ' + (H.cvLabel || 'Download CV'); b.target = '_blank'; b.rel = 'noopener'; }
  $('#footName').textContent = name;
  $('#footText').textContent = D.footerText || '';
  $('#year').textContent = new Date().getFullYear();
  $('#links').innerHTML = visible.map(k => `<a href="#${k}">${esc(sec(k).label)}</a>`).join('');

  /* ================= Render sections ================= */
  const shell = (k, i, inner, narrow) => {
    const s = sec(k);
    const num = String(i + 1).padStart(2, '0');
    return `<section class="section${i % 2 === 1 ? ' alt' : ''}" id="${k}"><div class="wrap${narrow ? ' narrow' : ''}">
      <h2 class="title reveal"><small>${num} / ${esc(s.label)}</small>${gradText(s.title)}</h2>${inner}</div></section>`;
  };
  const tagsHtml = (list, cls) => arr(list).length ? `<div class="tags${cls ? ' ' + cls : ''}">${arr(list).map(t => `<span>${esc(t)}</span>`).join('')}</div>` : '';

  const build = {
    about() {
      const photo = safeImg(A.photo);
      const avatar = photo ? `<img src="${esc(photo)}" alt="Foto ${esc(name)}" />` : `<span>${esc(A.initials || initials(name))}</span>`;
      const stats = arr(A.stats);
      const tech = arr(A.techStack);
      const now = N.show !== false && (arr(N.items).length || obj(N.listening).show);
      const gh = obj(N.github);
      const lis = obj(N.listening);
      const boxes = [];
      boxes.push(`<div class="bx r2 profile reveal"><div class="avatar">${avatar}</div>
        <h3>${esc(name)}</h3>${A.status ? `<div class="status"><i></i> ${esc(A.status)}</div>` : ''}</div>`);
      boxes.push(`<div class="bx s2 bio reveal"><h4>Tentang saya</h4>${arr(A.paragraphs).map(p => `<p>${rich(p)}</p>`).join('')}</div>`);
      if (A.location) boxes.push(`<div class="bx loc reveal"><h4>Lokasi</h4><div class="big">📍 ${esc(A.location)}</div><div class="clock" id="clock" data-tz="${esc(A.timezone || '')}"></div></div>`);
      stats.slice(0, 4).forEach(s => boxes.push(`<div class="bx stat reveal"><div class="num"><b data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix || '')}">0</b></div><span>${esc(s.label)}</span></div>`));
      if (tech.length) boxes.push(`<div class="bx s2 tech-box reveal"><h4>Tech stack & tools</h4><div class="techs">${tech.map((t, i) => `<button type="button" class="tech" data-i="${i}" title="${esc(t.note || t.name)}"><span>${esc(t.icon || '🔹')}</span><em>${esc(t.name)}</em></button>`).join('')}</div><p class="tech-note" id="techNote">Klik ikon untuk detail.</p></div>`);
      if (now) boxes.push(`<div class="bx s2 now reveal"><h4>${esc(N.title || 'Sedang saya kerjakan')}</h4>
        <ul class="nowlist">${arr(N.items).map(it => { const p = Math.max(0, Math.min(100, Number(it.progress) || 0)); return `<li><div class="nl-top"><b>${esc(it.title)}</b>${p ? `<span>${p}%</span>` : ''}</div>${it.note ? `<small>${esc(it.note)}</small>` : ''}${p ? `<div class="mini"><i style="--p:${p}%"></i></div>` : ''}</li>`; }).join('')}</ul>
        ${lis.show && lis.track ? `<div class="listening">🎧 <div><b>${lis.url && safeUrl(lis.url) ? `<a href="${esc(safeUrl(lis.url))}" target="_blank" rel="noopener">${esc(lis.track)}</a>` : esc(lis.track)}</b><small>${esc(lis.artist || '')}</small></div><span class="eq"><i></i><i></i><i></i></span></div>` : ''}</div>`);
      if (gh.show && gh.user) boxes.push(`<div class="bx s2 gh reveal"><h4>${esc(gh.title || 'Aktivitas GitHub')} <a class="ghlink" href="https://github.com/${esc(encodeURIComponent(gh.user))}" target="_blank" rel="noopener">@${esc(gh.user)} ↗</a></h4><div id="ghList" data-user="${esc(gh.user)}"><p class="muted small">Memuat repo terbaru…</p></div></div>`);
      return `<div class="bento">${boxes.join('')}</div>${A.statsNote ? `<p class="note">${esc(A.statsNote)}</p>` : ''}`;
    },
    skills() {
      return `<div class="tabs reveal">${groups.map((g, i) => `<button class="tab${i === 0 ? ' active' : ''}" data-tab="sk${i}">${esc(g.icon || '')} ${esc(g.title)}</button>`).join('')}</div>
      <div id="skillPanels">${groups.map((g, i) => `<div class="panel${i === 0 ? ' active' : ''}" id="sk${i}">
        <div class="bars">${arr(g.items).map(it => { const l = Math.max(0, Math.min(100, Number(it.level) || 0)); return `<div class="bar"><label>${esc(it.name)} <em>${l}%</em></label><div><i data-w="${l}"></i></div></div>`; }).join('')}</div>
        ${tagsHtml(g.tags)}</div>`).join('')}</div>`;
    },
    journey() {
      const types = new Set(exps.map(e => e.type === 'education' ? 'education' : 'work'));
      const filters = types.size > 1 ? `<div class="filters reveal"><button class="filter tl-filter active" data-t="all">Semua</button><button class="filter tl-filter" data-t="work">💼 Pengalaman</button><button class="filter tl-filter" data-t="education">🎓 Pendidikan</button></div>` : '';
      return `${filters}<div class="timeline">${exps.map(e => {
        const type = e.type === 'education' ? 'education' : 'work';
        const det = arr(e.details);
        return `<div class="tl-item reveal${det.length ? ' expandable' : ''}" data-type="${type}" tabindex="${det.length ? 0 : -1}" ${det.length ? 'role="button" aria-expanded="false"' : ''}><span class="dot"></span>
          <div class="tl-head"><time>${esc(e.period)}</time><span class="tl-type">${type === 'education' ? '🎓 Pendidikan' : '💼 Pengalaman'}</span></div>
          <h3>${esc(e.title)}${det.length ? '<i class="caret-i">▾</i>' : ''}</h3><p class="where">${esc(e.place)}</p><p>${esc(e.desc)}</p>
          ${det.length ? `<div class="more"><ul>${det.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}</div>`;
      }).join('')}</div>`;
    },
    projects() {
      const cats = [];
      projs.forEach(p => { const c = (p.category || '').trim(); if (c && !cats.some(x => slug(x) === slug(c))) cats.push(c); });
      const filters = cats.length > 1 ? `<div class="filters reveal"><button class="filter pf active" data-f="all">Semua</button>${cats.map(c => `<button class="filter pf" data-f="${esc(slug(c))}">${esc(c)}</button>`).join('')}</div>` : '';
      const cards = projs.map((p, i) => {
        const demo = safeUrl(p.demo), code = safeUrl(p.code);
        const links = [demo ? `<a href="${esc(demo)}" target="_blank" rel="noopener">Demo ↗</a>` : '', code ? `<a href="${esc(code)}" target="_blank" rel="noopener">Kode ↗</a>` : ''].join('');
        return `<article class="card tilt reveal" data-cat="${esc(slug(p.category))}" data-idx="${i}" tabindex="0" role="button" aria-label="Detail proyek ${esc(p.title)}">
          <div class="thumb t${(i % 6) + 1}"><span>${esc(p.icon || '📁')}</span></div>
          ${p.category ? `<span class="cat-badge">${esc(p.category)}</span>` : ''}
          <h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${tagsHtml(p.tags, 'sm')}
          <div class="card-links"><span class="more-link">Lihat detail →</span>${links}</div></article>`;
      }).join('');
      return `${filters}<div class="cards">${cards}</div>${D.projectsNote ? `<p class="note center">${esc(D.projectsNote)}</p>` : ''}`;
    },
    testimonials() {
      return `<div class="carousel reveal" id="carousel" aria-roledescription="carousel">
        <div class="car-viewport"><div class="car-track" id="carTrack">${testis.map(t => `<figure class="testi"><blockquote>“${esc(t.text)}”</blockquote>
          <figcaption><span class="av">${esc(initials(t.name))}</span><div><b>${esc(t.name)}</b><small>${esc(t.role || '')}</small></div></figcaption></figure>`).join('')}</div></div>
        ${testis.length > 1 ? `<div class="car-ctrl"><button type="button" id="carPrev" aria-label="Sebelumnya">←</button><div class="dots" id="carDots">${testis.map((_, i) => `<button type="button" data-i="${i}" aria-label="Testimoni ${i + 1}"></button>`).join('')}</div><button type="button" id="carNext" aria-label="Berikutnya">→</button></div>` : ''}</div>`;
    },
    hobby() {
      return `<div class="hobby-grid">${hobbies.map(h => {
        const l = Math.max(0, Math.min(100, Number(h.level) || 0));
        return `<div class="hobby reveal"><div class="h-icon">${esc(h.icon || '⭐')}</div><h3>${esc(h.title)}</h3><p>${esc(h.desc)}</p>
          ${tagsHtml(h.tags, 'sm')}${l ? `<div class="level"><span>${esc(h.levelLabel || 'LVL')}</span><div><i style="--lvl:${l}%"></i></div></div>` : ''}</div>`;
      }).join('')}</div>`;
    },
    contact() {
      const social = [];
      if (email) social.push({ label: 'Email', url: 'mailto:' + email });
      if (wa) social.push({ label: 'WhatsApp', url: 'https://wa.me/' + wa });
      socials.forEach(s => social.push(s));
      return `${C.intro ? `<p class="center reveal muted">${esc(C.intro)}</p>` : ''}
        ${email ? `<div class="mailrow reveal"><code>${esc(email)}</code><button type="button" class="btn ghost sm" id="copyMail">📋 Copy Email</button></div>` : ''}
        ${email || wa ? `<form class="form reveal" id="form" novalidate>
          <div class="row"><input type="text" id="fname" placeholder="Nama" required /><input type="email" id="femail" placeholder="Email Anda" required /></div>
          <textarea id="fmsg" rows="5" placeholder="Pesan" required></textarea>
          <div class="form-actions">
            ${wa ? '<button class="btn primary" type="button" data-send="wa">💬 Kirim via WhatsApp</button>' : ''}
            ${email ? `<button class="btn ${wa ? 'ghost' : 'primary'}" type="button" data-send="mail">✉️ Kirim via Email</button>` : ''}
          </div></form>` : ''}
        <div class="socials reveal">${social.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div>`;
    }
  };
  $('#app').innerHTML = visible.map((k, i) => shell(k, i, build[k](), k === 'contact')).join('');

  /* ================= Mobile menu ================= */
  const links = $('#links');
  $('#burger').addEventListener('click', () => links.classList.toggle('open'));
  $$('#links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* ================= Scroll: progress, nav, scrollspy, timeline ================= */
  const progress = $('#progress'), nav = $('#nav');
  const spy = $$('section[id]');
  const navLinks = $$('#links a');
  const tl = $('.timeline');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', y > 20);
    let cur = '';
    spy.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    if (tl) {
      const r = tl.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
      tl.style.setProperty('--tl', (f * 100).toFixed(1) + '%');
      $$('.tl-item', tl).forEach(it => it.classList.toggle('passed', it.getBoundingClientRect().top < innerHeight * 0.65));
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================= Cursor & spotlight ================= */
  const spot = $('#spotlight'), dot = $('#cursorDot'), ring = $('#cursorRing');
  if (fine && FX.spotlight !== false) {
    addEventListener('mousemove', e => { spot.style.setProperty('--mx', e.clientX + 'px'); spot.style.setProperty('--my', e.clientY + 'px'); spot.classList.add('on'); }, { passive: true });
  } else spot.style.display = 'none';
  if (fine && FX.cursor !== false) {
    document.body.classList.add('cc');
    let tx = 0, ty = 0, rx = 0, ry = 0, seen = false;
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
      if (!seen) { seen = true; rx = tx; ry = ty; dot.style.opacity = ring.style.opacity = 1; }
    }, { passive: true });
    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = 0; seen = false; });
    const loop = () => {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('mouseover', e => ring.classList.toggle('hover', !!e.target.closest('a, button, .card, .tech, .tl-item.expandable, input, textarea')));
  } else { dot.style.display = ring.style.display = 'none'; }
  // sorotan lembut di dalam kartu bento / proyek
  $('#app').addEventListener('mousemove', e => {
    const b = e.target.closest('.bx, .card');
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', (e.clientX - r.left) + 'px'); b.style.setProperty('--by', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ================= Typing effect ================= */
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

  /* ================= Reveal + counters + bars ================= */
  const fillBars = scope => $$('.bar i', scope).forEach(i => (i.style.width = i.dataset.w + '%'));
  const countUp = el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '', dur = 1600, t0 = performance.now();
    if (reduce) { el.textContent = target.toLocaleString('id-ID') + suffix; return; }
    const step = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString('id-ID') + (p === 1 ? suffix : '');
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
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const p = $('#' + t.dataset.tab);
    p.classList.add('active');
    $$('.bar i', p).forEach(i => (i.style.width = 0));
    requestAnimationFrame(() => requestAnimationFrame(() => fillBars(p)));
  }));

  /* ================= Bento: jam, tech stack, GitHub ================= */
  const clock = $('#clock');
  if (clock) {
    const tz = clock.dataset.tz;
    const tick = () => {
      try {
        const opt = { hour: '2-digit', minute: '2-digit', hour12: false };
        if (tz) opt.timeZone = tz;
        clock.textContent = '🕐 ' + new Intl.DateTimeFormat('id-ID', opt).format(new Date()).replace('.', ':') + (tz ? ' · ' + tz.split('/').pop().replace('_', ' ') : '');
      } catch (e) { clock.textContent = ''; }
    };
    tick(); setInterval(tick, 30000);
  }
  const techNote = $('#techNote');
  $$('.tech').forEach(b => b.addEventListener('click', () => {
    const t = arr(A.techStack)[+b.dataset.i] || {};
    $$('.tech').forEach(x => x.classList.toggle('sel', x === b));
    techNote.innerHTML = `<b>${esc(t.name)}</b>${t.note ? ' — ' + esc(t.note) : ''}`;
  }));

  const ghBox = $('#ghList');
  if (ghBox) {
    const ago = iso => {
      const d = Math.max(1, Math.round((Date.now() - new Date(iso)) / 86400000));
      return d < 30 ? `${d} hari lalu` : d < 365 ? `${Math.round(d / 30)} bulan lalu` : `${Math.round(d / 365)} tahun lalu`;
    };
    const lang = { JavaScript: '#f1e05a', Python: '#3572A5', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c', TypeScript: '#3178c6', Java: '#b07219', 'C++': '#f34b7d', Dart: '#00B4AB' };
    fetch(`https://api.github.com/users/${encodeURIComponent(ghBox.dataset.user)}/repos?sort=pushed&per_page=8`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(list => {
        const repos = list.filter(r => !r.fork).slice(0, 4);
        ghBox.innerHTML = repos.length ? `<ul class="ghlist">${repos.map(r => `<li><a href="${esc(r.html_url)}" target="_blank" rel="noopener"><b>${esc(r.name)}</b></a>
          <small>${r.language ? `<i class="ld" style="background:${lang[r.language] || 'var(--accent2)'}"></i>${esc(r.language)} · ` : ''}★ ${r.stargazers_count} · diperbarui ${ago(r.pushed_at)}</small></li>`).join('')}</ul>`
          : '<p class="muted small">Belum ada repository publik.</p>';
      })
      .catch(() => { ghBox.innerHTML = '<p class="muted small">Aktivitas GitHub tidak dapat dimuat saat ini.</p>'; });
  }

  /* ================= Timeline interaktif ================= */
  $$('.tl-filter').forEach(b => b.addEventListener('click', () => {
    $$('.tl-filter').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $$('.tl-item').forEach(it => it.classList.toggle('hide', b.dataset.t !== 'all' && it.dataset.type !== b.dataset.t));
    onScroll();
  }));
  const toggleTl = it => {
    if (!it.classList.contains('expandable')) return;
    const o = it.classList.toggle('open');
    it.setAttribute('aria-expanded', o);
  };
  $$('.tl-item.expandable').forEach(it => {
    it.addEventListener('click', () => toggleTl(it));
    it.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTl(it); } });
  });

  /* ================= Proyek: filter + modal ================= */
  $$('.pf').forEach(b => b.addEventListener('click', () => {
    $$('.pf').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $$('.card').forEach(c => c.classList.toggle('hide', b.dataset.f !== 'all' && c.dataset.cat !== b.dataset.f));
  }));

  let lastFocus = null;
  const lock = on => document.body.classList.toggle('noscroll', on);
  const openOverlay = (el, focusEl) => { lastFocus = document.activeElement; el.hidden = false; lock(true); requestAnimationFrame(() => { el.classList.add('open'); focusEl && focusEl.focus(); }); };
  const closeOverlay = el => { el.classList.remove('open'); el.hidden = true; if (!$('.overlay:not([hidden])')) lock(false); lastFocus && lastFocus.focus && lastFocus.focus(); };

  const modal = $('#modal');
  const openProject = i => {
    const p = projs[i]; if (!p) return;
    const demo = safeUrl(p.demo), code = safeUrl(p.code);
    const story = String(p.story || '').split(/\n+/).filter(Boolean);
    const meta = [p.category, p.year, p.role].filter(Boolean);
    $('#modalBody').innerHTML = `
      <div class="m-thumb t${(i % 6) + 1}"><span>${esc(p.icon || '📁')}</span></div>
      ${meta.length ? `<p class="m-meta">${meta.map(esc).join(' · ')}</p>` : ''}
      <h3>${esc(p.title)}</h3>
      <p class="m-desc">${esc(p.desc)}</p>
      ${story.length ? `<h4>Studi kasus</h4>${story.map(s => `<p>${esc(s)}</p>`).join('')}` : ''}
      ${arr(p.highlights).length ? `<h4>Sorotan</h4><ul class="m-list">${arr(p.highlights).map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
      ${tagsHtml(p.tags)}
      <div class="m-actions">
        ${demo ? `<a class="btn primary" href="${esc(demo)}" target="_blank" rel="noopener">🔗 Live Demo</a>` : ''}
        ${code ? `<a class="btn ghost" href="${esc(code)}" target="_blank" rel="noopener">💻 Source Code</a>` : ''}
        ${!demo && !code ? '<p class="muted small">Link demo dan kode belum tersedia.</p>' : ''}
      </div>`;
    openOverlay(modal, $('#modalX'));
    $('.modal-box', modal).scrollTop = 0;
  };
  $('#app').addEventListener('click', e => {
    const c = e.target.closest('.card');
    if (c && !e.target.closest('a')) openProject(+c.dataset.idx);
  });
  $('#app').addEventListener('keydown', e => {
    const c = e.target.closest && e.target.closest('.card');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProject(+c.dataset.idx); }
  });
  $('#modalX').addEventListener('click', () => closeOverlay(modal));
  modal.addEventListener('click', e => { if (e.target === modal) closeOverlay(modal); });

  /* 3D tilt */
  if (fine && !reduce) {
    $$('.tilt').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
      });
      c.addEventListener('mouseleave', () => (c.style.transform = ''));
    });
  }

  /* ================= Testimoni carousel ================= */
  const track = $('#carTrack');
  if (track) {
    let idx = 0, timer = null;
    const dots = $$('#carDots button');
    const go = n => {
      idx = (n + testis.length) % testis.length;
      track.style.transform = `translateX(${-idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    const start = () => { stop(); if (!reduce && testis.length > 1) timer = setInterval(() => go(idx + 1), 5000); };
    const stop = () => { clearInterval(timer); timer = null; };
    go(0); start();
    const car = $('#carousel');
    car.addEventListener('mouseenter', stop); car.addEventListener('mouseleave', start);
    car.addEventListener('focusin', stop); car.addEventListener('focusout', start);
    $('#carPrev') && $('#carPrev').addEventListener('click', () => { go(idx - 1); start(); });
    $('#carNext') && $('#carNext').addEventListener('click', () => { go(idx + 1); start(); });
    dots.forEach(d => d.addEventListener('click', () => { go(+d.dataset.i); start(); }));
    let sx = null;
    car.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); start(); } sx = null; });
  }

  /* ================= Kontak ================= */
  const copyEmail = async () => { if (!email) return; toast((await copyText(email)) ? '✓ Email disalin: ' + email : 'Gagal menyalin email'); };
  const cm = $('#copyMail'); if (cm) cm.addEventListener('click', copyEmail);
  const form = $('#form');
  if (form) {
    $$('[data-send]', form).forEach(b => b.addEventListener('click', () => {
      if (!form.reportValidity()) return;
      const n = $('#fname').value.trim(), em = $('#femail').value.trim(), m = $('#fmsg').value.trim();
      if (b.dataset.send === 'wa') {
        const text = `Halo ${name}, saya ${n} (${em}).\n\n${m}`;
        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      } else {
        location.href = `mailto:${email}?subject=${encodeURIComponent('Pesan dari portfolio: ' + n)}&body=${encodeURIComponent(`${m}\n\n— ${n} (${em})`)}`;
      }
      toast('Membuka aplikasi pesan…');
    }));
  }

  /* ================= Command palette ================= */
  const pal = $('#palette'), palInput = $('#palInput'), palList = $('#palList');
  const scrollToId = id => { const t = $('#' + id); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  const cmds = [];
  cmds.push({ icon: '🏠', label: 'Ke Beranda', kw: 'home atas top', run: () => scrollToId('home') });
  visible.forEach(k => cmds.push({ icon: '🧭', label: 'Ke bagian ' + sec(k).label, kw: 'navigasi section ' + k, run: () => scrollToId(k) }));
  projs.forEach((p, i) => cmds.push({ icon: p.icon || '📁', label: 'Proyek: ' + p.title, kw: 'project proyek ' + arr(p.tags).join(' '), run: () => openProject(i) }));
  if (email) cmds.push({ icon: '📋', label: 'Copy Email', kw: 'salin email mail', run: copyEmail });
  if (wa) cmds.push({ icon: '💬', label: 'Buka WhatsApp', kw: 'chat wa whatsapp', run: () => window.open('https://wa.me/' + wa, '_blank', 'noopener') });
  if (email) cmds.push({ icon: '✉️', label: 'Kirim Email', kw: 'mailto', run: () => (location.href = 'mailto:' + email) });
  socials.forEach(s => cmds.push({ icon: '🔗', label: 'Buka ' + s.label, kw: 'sosial media link ' + s.label, run: () => window.open(s.url, '_blank', 'noopener') }));
  if (cvUrl) cmds.push({ icon: '⬇', label: H.cvLabel || 'Download CV', kw: 'cv resume unduh', run: () => window.open(cvUrl, '_blank', 'noopener') });
  cmds.push({ icon: '🌓', label: 'Ganti tema (gelap/terang)', kw: 'dark light mode theme', run: toggleTheme });

  let palItems = [], palIdx = 0;
  const renderPal = () => {
    const q = palInput.value.trim().toLowerCase();
    palItems = cmds.filter(c => !q || (c.label + ' ' + (c.kw || '')).toLowerCase().includes(q));
    palIdx = Math.min(palIdx, Math.max(0, palItems.length - 1));
    palList.innerHTML = palItems.length
      ? palItems.map((c, i) => `<li role="option" data-i="${i}" class="${i === palIdx ? 'sel' : ''}"><span>${esc(c.icon)}</span>${esc(c.label)}</li>`).join('')
      : '<li class="empty">Tidak ada hasil</li>';
    const s = $('li.sel', palList); s && s.scrollIntoView({ block: 'nearest' });
  };
  const openPal = () => { palInput.value = ''; palIdx = 0; renderPal(); openOverlay(pal, palInput); };
  const closePal = () => closeOverlay(pal);
  const runPal = i => { const c = palItems[i]; if (!c) return; closePal(); setTimeout(c.run, 80); };
  palInput.addEventListener('input', () => { palIdx = 0; renderPal(); });
  palInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palIdx = (palIdx + 1) % Math.max(1, palItems.length); renderPal(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palIdx = (palIdx - 1 + palItems.length) % Math.max(1, palItems.length); renderPal(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPal(palIdx); }
  });
  palList.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) runPal(+li.dataset.i); });
  palList.addEventListener('mousemove', e => { const li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== palIdx) { palIdx = +li.dataset.i; $$('li', palList).forEach((x, i) => x.classList.toggle('sel', i === palIdx)); } });
  pal.addEventListener('click', e => { if (e.target === pal) closePal(); });
  $('#searchBtn').addEventListener('click', openPal);
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
    else if (e.key === 'Escape') { if (!pal.hidden) closePal(); else if (!modal.hidden) closeOverlay(modal); }
  });

  /* ================= Hero particles ================= */
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

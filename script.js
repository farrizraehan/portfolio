(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const themeBtn = $('#themeBtn');
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  const setTheme = t => {
    if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    themeBtn.textContent = t === 'light' ? '☀' : '☾';
    try { localStorage.setItem('theme', t); } catch (e) {}
  };
  setTheme(saved || 'dark');
  themeBtn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'));

  /* ---------- Mobile menu ---------- */
  const links = $('#links');
  $('#burger').addEventListener('click', () => links.classList.toggle('open'));
  $$('#links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

  /* ---------- Scroll: progress, nav, scrollspy, parallax ---------- */
  const progress = $('#progress'), nav = $('#nav');
  const sections = $$('main, section[id]');
  const navLinks = $$('#links a');
  const front = $('#mtnFront'), back = $('#mtnBack');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', y > 20);
    let cur = '';
    sections.forEach(s => { if (s.id && s.getBoundingClientRect().top < innerHeight * 0.4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    if (front && !reduce) {
      const r = $('.mountains').getBoundingClientRect();
      const p = (innerHeight - r.top) / (innerHeight + r.height);
      front.style.transform = `translateY(${(0.5 - p) * 30}px)`;
      back.style.transform = `translateY(${(0.5 - p) * -15}px)`;
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor glow ---------- */
  const glow = $('#cursorGlow');
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
  } else glow.style.display = 'none';

  /* ---------- Typing effect ---------- */
  const roles = ['Assistant Chef of Store', 'Mahasiswa Teknologi Informasi', 'Programmer', 'Trader', 'Gamer', 'Pendaki Gunung'];
  const typed = $('#typed');
  let ri = 0, ci = 0, del = false;
  (function type() {
    const word = roles[ri];
    typed.textContent = word.slice(0, ci);
    if (!del && ci === word.length) { del = true; return setTimeout(type, 1500); }
    if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; }
    ci += del ? -1 : 1;
    setTimeout(type, del ? 35 : 80);
  })();

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
      if (el.matches('.bar')) fillBars(el);
      $$('[data-count]', el).forEach(countUp);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

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
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#fname').value, m = $('#fmsg').value, em = $('#femail').value;
    const body = encodeURIComponent(`${m}\n\n— ${n} (${em})`);
    location.href = `mailto:emailkamu@gmail.com?subject=${encodeURIComponent('Pesan dari portfolio: ' + n)}&body=${body}`;
  });

  $('#year').textContent = new Date().getFullYear();

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

  /* ---------- Simulated candlestick chart ---------- */
  const cv = $('#chart'), cx = cv.getContext('2d');
  const priceEl = $('#price');
  let candles = [], price = 2350;
  const newCandle = () => {
    const o = price, steps = 10;
    let h = o, l = o, c = o;
    for (let i = 0; i < steps; i++) { c += (Math.random() - 0.48) * 4; h = Math.max(h, c); l = Math.min(l, c); }
    price = c;
    return { o, h, l, c };
  };
  for (let i = 0; i < 40; i++) candles.push(newCandle());
  const sizeC = () => {
    const dpr = devicePixelRatio || 1;
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeC(); addEventListener('resize', sizeC);
  const drawC = () => {
    const w = cv.clientWidth, h = cv.clientHeight, pad = 10;
    cx.clearRect(0, 0, w, h);
    const styles = getComputedStyle(root);
    const up = styles.getPropertyValue('--up').trim(), down = styles.getPropertyValue('--down').trim(), line = styles.getPropertyValue('--line').trim();
    const vis = candles.slice(-Math.floor(w / 14));
    const max = Math.max(...vis.map(c => c.h)) + 2, min = Math.min(...vis.map(c => c.l)) - 2;
    const Y = v => pad + (max - v) / (max - min) * (h - pad * 2);
    cx.strokeStyle = line; cx.lineWidth = 1; cx.font = '10px JetBrains Mono, monospace'; cx.fillStyle = '#8b95ab';
    for (let i = 0; i <= 4; i++) {
      const y = pad + i * (h - pad * 2) / 4;
      cx.beginPath(); cx.setLineDash([3, 5]); cx.moveTo(0, y); cx.lineTo(w, y); cx.stroke(); cx.setLineDash([]);
      cx.fillText((max - i * (max - min) / 4).toFixed(1), 4, y - 3);
    }
    const bw = w / vis.length;
    vis.forEach((c, i) => {
      const x = i * bw + bw / 2, bull = c.c >= c.o;
      cx.strokeStyle = cx.fillStyle = bull ? up : down;
      cx.lineWidth = 1.2;
      cx.beginPath(); cx.moveTo(x, Y(c.h)); cx.lineTo(x, Y(c.l)); cx.stroke();
      const top = Y(Math.max(c.o, c.c)), bh = Math.max(2, Math.abs(Y(c.o) - Y(c.c)));
      cx.fillRect(x - bw * .3, top, bw * .6, bh);
    });
    const last = vis[vis.length - 1];
    const ly = Y(last.c);
    cx.strokeStyle = last.c >= last.o ? up : down; cx.setLineDash([4, 4]);
    cx.beginPath(); cx.moveTo(0, ly); cx.lineTo(w, ly); cx.stroke(); cx.setLineDash([]);
    priceEl.textContent = last.c.toFixed(2);
    priceEl.className = last.c >= last.o ? 'up' : 'down';
  };
  const tick = () => {
    // update candle terakhir, sesekali buat candle baru
    if (Math.random() < 0.18) candles.push(newCandle());
    else {
      const c = candles[candles.length - 1];
      c.c += (Math.random() - 0.48) * 1.6; c.h = Math.max(c.h, c.c); c.l = Math.min(c.l, c.c); price = c.c;
    }
    if (candles.length > 200) candles.shift();
    drawC();
  };
  drawC();
  if (!reduce) setInterval(tick, 350);
})();

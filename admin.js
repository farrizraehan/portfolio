(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const KEY = 'portfolioDraft';
  const DEFAULT = window.PORTFOLIO_DEFAULT || {};
  const clone = o => JSON.parse(JSON.stringify(o));
  const fmt = d => 'window.PORTFOLIO_DEFAULT = ' + JSON.stringify(d, null, 2) + ';\n';

  /* ---------- State ---------- */
  let data, fromDraft = false;
  try {
    const s = localStorage.getItem(KEY);
    if (s) { data = JSON.parse(s); fromDraft = true; }
  } catch (e) {}
  if (!data) data = clone(DEFAULT);

  const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const set = (o, path, v) => {
    const ks = path.split('.');
    const last = ks.pop();
    const t = ks.reduce((a, k) => (a[k] == null || typeof a[k] !== 'object' ? (a[k] = {}) : a[k]), o);
    t[last] = v;
  };

  /* ---------- Status & autosave ---------- */
  const statusEl = $('#status');
  const refreshStatus = () => {
    const same = JSON.stringify(data) === JSON.stringify(DEFAULT);
    statusEl.textContent = same ? '✓ Sama dengan versi online' : '● Ada perubahan (belum online) — unduh content.js untuk memublikasikan';
    statusEl.className = same ? '' : 'dirty';
  };
  let timer;
  const changed = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { toast('Gagal menyimpan draf (storage penuh?)'); }
      refreshStatus();
    }, 250);
  };
  const toast = msg => {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
  };

  /* ---------- Schema ---------- */
  const secFields = k => [
    { k: `sections.${k}.show`, t: 'check', l: 'Tampilkan bagian ini di situs' },
    { k: `sections.${k}.label`, t: 'text', l: 'Nama menu (navigasi)' },
    { k: `sections.${k}.title`, t: 'text', l: 'Judul bagian', hint: 'Bungkus kata dengan **dua bintang** agar berwarna gradien, mis. Satu orang, banyak **peran**' }
  ];
  const SECTIONS = [
    { id: 'help', icon: '📖', label: 'Panduan' },
    { id: 'umum', icon: '⚙️', label: 'Umum & Tema', fields: [
      { k: 'name', t: 'text', l: 'Nama lengkap', hint: 'Kata pertama = putih, sisanya = gradien warna.' },
      { k: 'siteTitle', t: 'text', l: 'Judul tab browser' },
      { k: 'siteDescription', t: 'textarea', l: 'Deskripsi situs (SEO / hasil pencarian)' },
      { k: 'footerText', t: 'text', l: 'Teks footer' },
      { k: 'theme.mode', t: 'select', l: 'Tema bawaan', options: [['dark', 'Gelap'], ['light', 'Terang']] },
      { k: 'theme.accent', t: 'color', l: 'Warna aksen utama' },
      { k: 'theme.accent2', t: 'color', l: 'Warna aksen kedua' }
    ] },
    { id: 'hero', icon: '🏠', label: 'Hero (Beranda)', fields: [
      { k: 'hero.eyebrow', t: 'text', l: 'Teks kecil di atas nama' },
      { k: 'hero.roles', t: 'lines', l: 'Peran (diketik bergantian)', hint: 'Satu peran per baris.' },
      { k: 'hero.lead', t: 'textarea', l: 'Kalimat pembuka' },
      { k: 'hero.chips', t: 'lines', l: 'Lencana di bawah tombol', hint: 'Satu per baris, boleh pakai emoji.' },
      { k: 'hero.cta1', t: 'text', l: 'Teks tombol utama' },
      { k: 'hero.cta2', t: 'text', l: 'Teks tombol kedua' }
    ] },
    { id: 'about', icon: '👤', label: 'Tentang', fields: [
      ...secFields('about'),
      { k: 'about.photo', t: 'image', l: 'Foto profil', hint: 'Unggah foto (otomatis diperkecil) atau isi nama file/URL. Kosongkan untuk memakai inisial.' },
      { k: 'about.initials', t: 'text', l: 'Inisial (jika tanpa foto)' },
      { k: 'about.status', t: 'text', l: 'Lencana status', hint: 'Kosongkan untuk menyembunyikan.' },
      { k: 'about.paragraphs', t: 'strings', l: 'Paragraf', hint: 'Pakai **teks** untuk huruf tebal.', blank: '' },
      { k: 'about.stats', t: 'repeater', l: 'Statistik angka', blank: () => ({ value: 0, label: '' }), title: i => `${i.label || 'Statistik'}`, fields: [
        { k: 'value', t: 'number', l: 'Angka' }, { k: 'label', t: 'text', l: 'Label' }
      ] },
      { k: 'about.statsNote', t: 'text', l: 'Catatan kecil di bawah statistik', hint: 'Kosongkan untuk menghapus.' }
    ] },
    { id: 'skills', icon: '🛠', label: 'Skill', fields: [
      ...secFields('skills'),
      { k: 'skillGroups', t: 'repeater', l: 'Kelompok skill (tab)', blank: () => ({ icon: '⭐', title: 'Kelompok baru', items: [], tags: [] }), title: g => `${g.icon || ''} ${g.title || 'Kelompok'}`, fields: [
        { k: 'icon', t: 'text', l: 'Ikon (emoji)' }, { k: 'title', t: 'text', l: 'Nama kelompok' },
        { k: 'items', t: 'repeater', l: 'Skill & persentase', blank: () => ({ name: '', level: 70 }), title: i => `${i.name || 'Skill'} — ${i.level || 0}%`, fields: [
          { k: 'name', t: 'text', l: 'Nama skill' }, { k: 'level', t: 'number', l: 'Level (0–100)', min: 0, max: 100 }
        ] },
        { k: 'tags', t: 'lines', l: 'Tag tambahan', hint: 'Satu per baris.' }
      ] }
    ] },
    { id: 'journey', icon: '🧭', label: 'Perjalanan', fields: [
      ...secFields('journey'),
      { k: 'experience', t: 'repeater', l: 'Pengalaman & pendidikan (urut dari atas)', blank: () => ({ period: '', title: '', place: '', desc: '' }), title: e => `${e.title || 'Item'} · ${e.period || ''}`, fields: [
        { k: 'period', t: 'text', l: 'Periode', hint: 'mis. 2021 – 2023 atau Sekarang' }, { k: 'title', t: 'text', l: 'Jabatan / gelar' },
        { k: 'place', t: 'text', l: 'Tempat' }, { k: 'desc', t: 'textarea', l: 'Deskripsi' }
      ] }
    ] },
    { id: 'projects', icon: '📁', label: 'Proyek', fields: [
      ...secFields('projects'),
      { k: 'projects', t: 'repeater', l: 'Daftar proyek', blank: () => ({ icon: '📁', title: 'Proyek baru', desc: '', tags: [], demo: '', code: '', category: 'Web' }), title: p => `${p.icon || ''} ${p.title || 'Proyek'}`, fields: [
        { k: 'icon', t: 'text', l: 'Ikon (emoji)' }, { k: 'title', t: 'text', l: 'Judul' },
        { k: 'desc', t: 'textarea', l: 'Deskripsi' },
        { k: 'tags', t: 'lines', l: 'Teknologi', hint: 'Satu per baris.' },
        { k: 'category', t: 'text', l: 'Kategori (untuk filter)', hint: 'Filter muncul otomatis jika ada ≥ 2 kategori berbeda.' },
        { k: 'demo', t: 'text', l: 'Link demo', hint: 'Kosongkan jika tidak ada — tombol disembunyikan.' },
        { k: 'code', t: 'text', l: 'Link kode (GitHub)' }
      ] },
      { k: 'projectsNote', t: 'text', l: 'Catatan di bawah daftar proyek', hint: 'Kosongkan untuk menghapus.' }
    ] },
    { id: 'hobby', icon: '🎮', label: 'Hobi', fields: [
      ...secFields('hobby'),
      { k: 'hobbies', t: 'repeater', l: 'Daftar hobi', blank: () => ({ icon: '⭐', title: 'Hobi baru', desc: '', tags: [], levelLabel: 'LVL', level: 80 }), title: h => `${h.icon || ''} ${h.title || 'Hobi'}`, fields: [
        { k: 'icon', t: 'text', l: 'Ikon (emoji)' }, { k: 'title', t: 'text', l: 'Nama hobi' },
        { k: 'desc', t: 'textarea', l: 'Deskripsi' },
        { k: 'tags', t: 'lines', l: 'Tag', hint: 'Satu per baris.' },
        { k: 'levelLabel', t: 'text', l: 'Label bar (mis. LVL)' },
        { k: 'level', t: 'number', l: 'Level 0–100', min: 0, max: 100, hint: 'Isi 0 untuk menyembunyikan bar.' }
      ] }
    ] },
    { id: 'contact', icon: '✉️', label: 'Kontak', fields: [
      ...secFields('contact'),
      { k: 'contact.intro', t: 'textarea', l: 'Kalimat pengantar' },
      { k: 'contact.email', t: 'text', l: 'Email', hint: 'Dipakai untuk form pesan & tombol Email. Kosongkan untuk menyembunyikan form.' },
      { k: 'contact.whatsapp', t: 'text', l: 'Nomor WhatsApp', hint: 'Format 62812xxxxxxx (tanpa 0 / +). Kosongkan untuk menyembunyikan.' },
      { k: 'contact.links', t: 'repeater', l: 'Link sosial', blank: () => ({ label: '', url: '' }), title: l => `${l.label || 'Link'}`, fields: [
        { k: 'label', t: 'text', l: 'Nama (GitHub, LinkedIn, …)' }, { k: 'url', t: 'text', l: 'URL', hint: 'Kosong = tombol disembunyikan.' }
      ] }
    ] }
  ];

  /* ---------- Rendering ---------- */
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v);
    });
    kids.flat().forEach(c => c != null && n.append(c));
    return n;
  };
  let rerender = () => {};

  const wrap = (f, input) => el('div', { class: 'field' }, f.t === 'check' ? null : el('label', { text: f.l }), input, f.hint ? el('small', { text: f.hint }) : null);

  const resizeImage = (file, max = 800) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });

  const renderField = (obj, f) => {
    const v = get(obj, f.k);
    switch (f.t) {
      case 'text': case 'number': {
        const i = el('input', { type: f.t === 'number' ? 'number' : 'text', value: v == null ? '' : v, min: f.min, max: f.max });
        i.addEventListener('input', () => { set(obj, f.k, f.t === 'number' ? Number(i.value) || 0 : i.value); changed(); });
        return wrap(f, i);
      }
      case 'textarea': {
        const i = el('textarea', { rows: f.rows || 3 }); i.value = v || '';
        i.addEventListener('input', () => { set(obj, f.k, i.value); changed(); });
        return wrap(f, i);
      }
      case 'lines': {
        const i = el('textarea', { rows: 4 }); i.value = (Array.isArray(v) ? v : []).join('\n');
        i.addEventListener('input', () => { set(obj, f.k, i.value.split('\n').map(s => s.trim()).filter(Boolean)); changed(); });
        return wrap(f, i);
      }
      case 'color': {
        const i = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#ff7a3d' });
        i.addEventListener('input', () => { set(obj, f.k, i.value); changed(); });
        return wrap(f, i);
      }
      case 'select': {
        const s = el('select', {}, f.options.map(([val, lab]) => el('option', { value: val, text: lab, selected: val === v ? '' : null })));
        s.addEventListener('change', () => { set(obj, f.k, s.value); changed(); });
        return wrap(f, s);
      }
      case 'check': {
        const i = el('input', { type: 'checkbox', checked: v !== false ? '' : null });
        i.checked = v !== false;
        i.addEventListener('change', () => { set(obj, f.k, i.checked); changed(); });
        return el('div', { class: 'field' }, el('label', { class: 'check' }, i, el('span', { text: f.l })));
      }
      case 'image': {
        const box = el('div', { class: 'imgbox' });
        const draw = () => {
          box.textContent = '';
          const cur = get(obj, f.k);
          box.append(cur ? el('img', { src: cur, alt: 'Pratinjau' }) : el('div', { class: 'ph', text: 'tanpa foto' }));
          const file = el('input', { type: 'file', accept: 'image/*', hidden: '' });
          file.addEventListener('change', async () => {
            if (!file.files[0]) return;
            try { set(obj, f.k, await resizeImage(file.files[0])); changed(); draw(); toast('Foto diperbarui'); }
            catch (e) { toast('Gagal membaca gambar'); }
          });
          const path = el('input', { type: 'text', placeholder: 'atau nama file / URL, mis. foto.jpg', value: cur && cur.startsWith('data:') ? '' : cur || '' });
          path.addEventListener('input', () => { set(obj, f.k, path.value.trim()); changed(); });
          box.append(el('div', { style: 'flex:1;min-width:220px' },
            el('div', { style: 'display:flex;gap:8px;margin-bottom:8px' },
              el('button', { class: 'btn sm', type: 'button', text: '📷 Unggah foto', onclick: () => file.click() }),
              el('button', { class: 'btn sm danger', type: 'button', text: 'Hapus', onclick: () => { set(obj, f.k, ''); changed(); draw(); } }), file),
            path));
        };
        draw();
        return wrap(f, box);
      }
      case 'strings': {
        const list = Array.isArray(v) ? v : (set(obj, f.k, []), get(obj, f.k));
        const box = el('div');
        list.forEach((s, i) => {
          const ta = el('textarea', { rows: 3 }); ta.value = s;
          ta.addEventListener('input', () => { list[i] = ta.value; changed(); });
          box.append(el('div', { class: 'group' },
            el('div', { class: 'group-h' }, el('b', { text: `#${i + 1}` }), ...itemButtons(list, i)),
            ta));
        });
        box.append(el('button', { class: 'btn sm', type: 'button', text: '+ Tambah', onclick: () => { list.push(f.blank); changed(); rerender(); } }));
        return wrap(f, box);
      }
      case 'repeater': {
        const list = Array.isArray(v) ? v : (set(obj, f.k, []), get(obj, f.k));
        const box = el('div');
        list.forEach((item, i) => {
          const g = el('div', { class: 'group' },
            el('div', { class: 'group-h' }, el('b', { text: f.title(item, i) }), ...itemButtons(list, i)));
          f.fields.forEach(sf => g.append(renderField(item, sf)));
          box.append(g);
        });
        box.append(el('button', { class: 'btn sm', type: 'button', text: '+ Tambah', onclick: () => { list.push(f.blank()); changed(); rerender(); } }));
        return wrap(f, box);
      }
    }
    return el('div');
  };

  const itemButtons = (list, i) => [
    el('button', { class: 'btn sm', type: 'button', text: '↑', title: 'Naik', onclick: () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; changed(); rerender(); } } }),
    el('button', { class: 'btn sm', type: 'button', text: '↓', title: 'Turun', onclick: () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; changed(); rerender(); } } }),
    el('button', { class: 'btn sm danger', type: 'button', text: 'Hapus', onclick: () => { if (confirm('Hapus item ini?')) { list.splice(i, 1); changed(); rerender(); } } })
  ];

  const helpPanel = () => el('div', {},
    el('h2', { text: 'Panduan' }),
    el('p', { class: 'hint', text: 'Semua isi portfolio bisa diedit dari menu di kiri. Perubahan tersimpan otomatis sebagai draf di browser ini.' }),
    el('div', { class: 'help' }, el('b', { text: 'Cara memublikasikan perubahan' }),
      el('ol', {},
        el('li', { text: 'Edit data di menu kiri, lalu klik 👁 Pratinjau untuk melihat hasilnya.' }),
        el('li', { text: 'Klik ⬇ Unduh content.js.' }),
        el('li', { text: 'Timpa file content.js di folder proyek dengan file hasil unduhan.' }),
        el('li', { text: 'Commit & push ke GitHub (atau minta Claude melakukannya). Vercel akan men-deploy otomatis / dengan vercel --prod.' }))),
    el('p', { class: 'hint', style: 'margin-top:16px', text: 'Catatan: draf hanya ada di browser ini. Siapa pun yang membuka halaman admin ini hanya bisa mengubah draf di browsernya sendiri — situs publik tidak berubah sampai content.js diganti. Gunakan ↺ Reset untuk membuang draf, dan ⬆ Impor untuk memuat content.js lama.' }));

  const menu = $('#menu'), panel = $('#panel');
  let current = 'help';
  const show = id => {
    current = id;
    const sec = SECTIONS.find(s => s.id === id);
    [...menu.children].forEach(b => b.classList.toggle('active', b.dataset.id === id));
    const y = scrollY;
    panel.textContent = '';
    if (id === 'help') panel.append(helpPanel());
    else {
      panel.append(el('h2', { text: `${sec.icon} ${sec.label}` }));
      panel.append(el('p', { class: 'hint', text: 'Perubahan tersimpan otomatis. Klik Pratinjau untuk melihat hasilnya di situs.' }));
      sec.fields.forEach(f => panel.append(renderField(data, f)));
    }
    scrollTo(0, y);
  };
  rerender = () => show(current);
  SECTIONS.forEach(s => menu.append(el('button', { 'data-id': s.id, onclick: () => { show(s.id); scrollTo(0, 0); } }, el('span', { text: s.icon }), el('span', { text: s.label }))));

  /* ---------- Toolbar ---------- */
  $('#btnPreview').addEventListener('click', () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    window.open('index.html?preview', '_blank');
  });
  $('#btnDownload').addEventListener('click', () => {
    const blob = new Blob([fmt(data)], { type: 'text/javascript' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'content.js' });
    document.body.append(a); a.click(); a.remove();
    toast('content.js diunduh — timpa file lama di folder proyek');
  });
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const txt = await f.text();
      const obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
      if (!confirm('Ganti seluruh draf saat ini dengan isi file ini?')) return;
      data = obj; changed(); show(current); toast('Impor berhasil');
    } catch (err) { toast('File tidak valid'); }
  });
  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Buang draf dan kembali ke isi content.js yang online?')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    data = clone(DEFAULT); refreshStatus(); show(current); toast('Draf direset');
  });

  refreshStatus();
  if (fromDraft && JSON.stringify(data) !== JSON.stringify(DEFAULT)) toast('Draf sebelumnya dimuat');
  show('help');
})();

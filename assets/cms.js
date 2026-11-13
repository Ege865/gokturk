// GökTürk içerik yükleyici: sitedeki metinleri ve görselleri Supabase'deki `site_content` tablosundan alır.
//
// Sayfada her düzenlenebilir öğe bir anahtar taşır:
//   data-cms="hero.baslik"       metin   (satırın `value` alanı yazı olarak konur)
//   data-cms-img="hero.gorsel"   görsel  (`value` görselin adresi, `alt` görselin açıklaması)
//   data-cms-href="sponsor.eposta" bağlantı (`value` adres; yalnız e-posta yazılırsa mailto: eklenir)
//
// Sıra: önce tarayıcıda saklanan son içerik hemen uygulanır, sonra Supabase'den taze içerik en çok
// WAIT ms beklenir, ardından sitenin animasyon betikleri başlar. Supabase'e ulaşılamazsa sayfadaki
// HTML içeriği olduğu gibi kalır; site hiçbir zaman boş açılmaz.

// ---- Supabase bağlantısı: Project Settings → API (Data API) sayfasından kopyalayın ----
const SUPABASE_URL = 'https://zqzpfxyiysybljjcyxmi.supabase.co'; // örnek: https://abcdefghijkl.supabase.co
const SUPABASE_KEY = 'sb_publishable_OIbqmArjD7B0avCcVG-pXA_5-yEutuq'; // "anon public" ya da "publishable" anahtar (sb_publishable_...); secret anahtarı ASLA buraya koymayın
// -------------------------------------------------------------------------------------------

const TABLE = 'site_content';
const CACHE = 'gokturk-cms-v1';
const WAIT = 600;

const original = new Map(); // ilk HTML değerleri, değişiklik yoksa dokunmamak için

function remember(el, attr) {
  if (!original.has(el)) original.set(el, attr ? el.getAttribute(attr) : el.textContent);
}

function applyRows(rows, late) {
  if (!Array.isArray(rows)) return;
  const byKey = new Map(rows.filter(r => r && r.key).map(r => [r.key, r]));

  document.querySelectorAll('[data-cms]').forEach(el => {
    const row = byKey.get(el.dataset.cms);
    if (!row || row.value == null || row.value === '') return;
    // animasyonların harf ya da kelimelere böldüğü bir başlık geç gelen veriyle bozulmasın:
    // animasyon bitip başlık düz metne dönünce güncellenir (en çok 8 saniye beklenir)
    if (late && el.children.length) {
      let tries = 0;
      const wait = setInterval(() => {
        if (el.children.length === 0) { clearInterval(wait); if (el.textContent !== row.value) el.textContent = row.value; }
        else if (++tries > 40) clearInterval(wait);
      }, 200);
      return;
    }
    remember(el);
    if (el.textContent !== row.value) el.textContent = row.value;
  });

  document.querySelectorAll('[data-cms-img]').forEach(img => {
    const row = byKey.get(img.dataset.cmsImg);
    if (!row) return;
    if (row.value && row.value !== img.getAttribute('src')) {
      remember(img, 'src');
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = row.value;
    }
    if (row.alt != null && row.alt !== '' && row.alt !== img.getAttribute('alt')) img.alt = row.alt;
  });

  document.querySelectorAll('[data-cms-href]').forEach(a => {
    const row = byKey.get(a.dataset.cmsHref);
    if (!row || !row.value) return;
    let href = row.value.trim();
    if (/^[^\s:@/]+@[^\s@/]+\.[^\s@/]+$/.test(href)) {
      const was = a.getAttribute('href') || '';
      href = 'mailto:' + href + (was.startsWith('mailto:') && was.includes('?') ? was.slice(was.indexOf('?')) : '');
    }
    if (!/^(https?:|mailto:|tel:|#)/i.test(href)) return; // javascript: gibi adresler kabul edilmez
    if (href !== a.getAttribute('href')) a.setAttribute('href', href);
  });
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch { return null; }
}
function writeCache(rows) {
  try { localStorage.setItem(CACHE, JSON.stringify(rows)); } catch {}
}

async function fetchRows() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${TABLE}?select=key,value,alt`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

// test için: sayfa adresine ?cms=off eklenirse Supabase atlanır, HTML içeriği görünür
const off = new URLSearchParams(location.search).get('cms') === 'off';

if (!off) applyRows(readCache(), false);

const fresh = off ? Promise.resolve(null) : fetchRows().catch(err => { console.warn('[cms]', err.message); return null; });
let started = false;

const first = await Promise.race([fresh, new Promise(r => setTimeout(() => r(undefined), WAIT))]);
if (first) { applyRows(first, false); writeCache(first); }

// sitenin kendi betikleri, içerik yerleştikten sonra
started = true;
await Promise.all([import('./system.js'), import('./motion/motion.js'), import('./layout/layout.js')]);

if (first === undefined) {
  const rows = await fresh;
  if (rows) { applyRows(rows, started); writeCache(rows); }
}

// ---- Raporlar ve çalışmalar: Supabase'deki `reports` tablosundan, yayımlanmış olanlar en yeni üstte ----
const REPORTS = 'gokturk-reports-v1';
const safeUrl = u => {
  if (!u) return null;
  try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; }
};
const DATE = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderReports(list) {
  const box = document.querySelector('[data-reports]');
  const empty = document.querySelector('[data-reports-empty]');
  if (!box || !Array.isArray(list)) return;
  const items = list.filter(r => r && r.title);
  box.replaceChildren(...items.map(r => {
    const card = el('article', 'card card--row card--open span-4 report');
    const panel = el('div', 'panel panel--top');
    const cover = safeUrl(r.cover_url);
    if (cover) {
      const img = el('img', 'frame__img');
      img.src = cover; img.alt = r.cover_alt || ''; img.loading = 'lazy'; img.decoding = 'async';
      img.width = 800; img.height = 480;
      panel.append(img);
    } else {
      const mark = el('span', 'logo logo--mark'); mark.setAttribute('aria-hidden', 'true');
      panel.append(mark);
    }
    card.append(panel);
    const meta = [r.category, r.published_on ? DATE.format(new Date(r.published_on + 'T12:00:00')) : null].filter(Boolean).join(' · ');
    if (meta) card.append(el('p', 't-small muted report__meta', meta));
    const h3 = el('h3');
    const href = safeUrl(r.file_url);
    if (href) {
      const a = el('a', null, r.title);
      a.href = href; a.target = '_blank'; a.rel = 'noopener';
      h3.append(a);
    } else h3.textContent = r.title;
    card.append(h3);
    if (r.summary) card.append(el('p', null, r.summary));
    if (href) {
      const more = el('p');
      const label = /\.pdf($|\?)/i.test(href) ? 'Raporu açın (PDF)' : 'Çalışmayı görün';
      const a = el('a', 'link', label);
      a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.tabIndex = -1; a.setAttribute('aria-hidden', 'true');
      more.append(a);
      card.append(more);
    }
    return card;
  }));
  box.hidden = items.length === 0;
  if (empty) empty.hidden = items.length > 0;
}

async function fetchReports() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/reports?select=title,summary,category,published_on,file_url,cover_url,cover_alt&published=eq.true&order=published_on.desc.nullslast,created_at.desc`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`Supabase reports ${res.status}`);
  return res.json();
}

if (!off) {
  try { renderReports(JSON.parse(localStorage.getItem(REPORTS) || 'null')); } catch {}
  fetchReports().then(list => {
    if (!list) return;
    renderReports(list);
    try { localStorage.setItem(REPORTS, JSON.stringify(list)); } catch {}
  }).catch(err => console.warn('[cms]', err.message));
}

// ---- Haberler: Supabase'deki `news` tablosundan, yayımlanmış olanlar en yeni üstte ----
const NEWS = 'gokturk-news-v1';
const NEWS_FIRST = 5; // sayfada ilk görünen haber sayısı; fazlası "Tüm haberleri gösterin" ile açılır

function openNews(n) {
  const dlg = document.querySelector('.news-dialog');
  if (!dlg) return;
  dlg.querySelector('.news-dialog__date').textContent = n.published_on ? DATE.format(new Date(n.published_on + 'T12:00:00')) : '';
  dlg.querySelector('h2').textContent = n.title;
  const img = dlg.querySelector('.news-dialog__img');
  const src = safeUrl(n.image_url);
  img.hidden = !src;
  if (src) { img.src = src; img.alt = n.image_alt || ''; } else img.removeAttribute('src');
  const body = dlg.querySelector('.news-dialog__body');
  const text = (n.body || n.summary || '').trim();
  body.replaceChildren(...text.split(/\n\s*\n/).map(t => el('p', null, t.trim())).filter(p => p.textContent));
  const link = dlg.querySelector('.news-dialog__link');
  const href = safeUrl(n.link_url);
  link.hidden = !href;
  if (href) link.querySelector('a').href = href;
  if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  dlg.scrollTop = 0;
}

function renderNews(list) {
  const box = document.querySelector('[data-news]');
  const empty = document.querySelector('[data-news-empty]');
  const more = document.querySelector('[data-news-more]');
  if (!box || !Array.isArray(list)) return;
  const items = list.filter(n => n && n.title);
  box.replaceChildren(...items.map((n, i) => {
    const li = el('li', 'news-item grid');
    if (i >= NEWS_FIRST) li.hidden = true;
    const time = el('time', 'span-2 t-small muted', n.published_on ? DATE.format(new Date(n.published_on + 'T12:00:00')) : '');
    if (n.published_on) time.dateTime = n.published_on;
    const text = el('div', 'span-7 start-3');
    const h3 = el('h3');
    const btn = el('button', null, n.title);
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.addEventListener('click', () => openNews(n));
    h3.append(btn);
    text.append(h3);
    if (n.summary) text.append(el('p', 'muted', n.summary));
    const thumb = el('div', 'news-thumb span-2 start-11');
    const src = safeUrl(n.image_url);
    if (src) {
      const img = el('img');
      img.src = src; img.alt = n.image_alt || ''; img.loading = 'lazy'; img.decoding = 'async'; img.width = 640; img.height = 480;
      thumb.append(img);
    } else {
      const mark = el('span', 'logo logo--mark'); mark.setAttribute('aria-hidden', 'true');
      thumb.append(mark);
    }
    li.append(time, text, thumb);
    return li;
  }));
  box.hidden = items.length === 0;
  if (empty) empty.hidden = items.length > 0;
  if (more) more.hidden = items.length <= NEWS_FIRST;
}

{
  const dlg = document.querySelector('.news-dialog');
  dlg?.querySelector('.news-dialog__close').addEventListener('click', () => dlg.close());
  dlg?.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // dışına tıklayınca kapanır
  document.querySelector('[data-news-more] button')?.addEventListener('click', e => {
    document.querySelectorAll('.news-item[hidden]').forEach(li => { li.hidden = false; });
    e.currentTarget.parentElement.hidden = true;
  });
}

async function fetchNews() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/news?select=title,summary,body,published_on,image_url,image_alt,link_url&published=eq.true&order=published_on.desc.nullslast,created_at.desc`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`Supabase news ${res.status}`);
  return res.json();
}

if (!off) {
  try { renderNews(JSON.parse(localStorage.getItem(NEWS) || 'null')); } catch {}
  fetchNews().then(list => {
    if (!list) return;
    renderNews(list);
    try { localStorage.setItem(NEWS, JSON.stringify(list)); } catch {}
  }).catch(err => console.warn('[cms]', err.message));
}

// index.html içindeki data-cms, data-cms-img ve data-cms-href anahtarlarını okuyup
// supabase/setup.sql dosyasını üretir (tablo, okuma izni, görsel klasörü ve sitenin şu anki içeriği).
// Çalıştırmak için: node supabase/build-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');

const SECTIONS = { menu: 'Menü', hero: 'Giriş', takim: 'Vizyon ve misyon', alanlar: 'Çalışma alanları', neden: 'Neden İHA', okul: 'Okul', nifarge: 'NIF Ar-Ge', sponsor: 'Sponsorlar', haberler: 'Haberler', raporlar: 'Raporlar', footer: 'Alt bilgi' };
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&copy;/g, '©');
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? decode(m[1]) : null; };

const rows = new Map();
const re = /<(\w+)\b([^>]*?\bdata-cms(-img|-href)?="([^"]+)"[^>]*)>([^<]*)/g;
let m, sort = 0;
while ((m = re.exec(html))) {
  const [, , attrs, kind, key, text] = m;
  if (rows.has(key)) continue;
  const tag = '<x ' + attrs + '>';
  let type, value, alt = null;
  if (kind === '-img') { type = 'görsel'; value = attr(tag, 'src'); alt = attr(tag, 'alt'); }
  else if (kind === '-href') { type = 'bağlantı'; value = attr(tag, 'href').replace(/^mailto:/, '').replace(/\?.*$/, ''); }
  else { type = 'metin'; value = decode(text).trim(); }
  sort += 10;
  rows.set(key, { key, section: SECTIONS[key.split('.')[0]] || key.split('.')[0], type, value, alt, sort });
}

const q = v => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const values = [...rows.values()].map(r => `  (${q(r.key)}, ${q(r.section)}, ${q(r.type)}, ${q(r.value)}, ${q(r.alt)}, ${r.sort})`).join(',\n');

const sql = `-- GökTürk sitesi: içerik tablosu ve görsel klasörü
-- Supabase panelinde SQL Editor → New query → bu dosyanın tamamını yapıştırın → Run.
-- Bu dosya node supabase/build-seed.mjs ile index.html'den üretildi; elle düzenlemeyin.

-- 1) İçerik tablosu: her satır sitedeki bir metin, görsel ya da bağlantı
create table if not exists public.site_content (
  key        text primary key,
  section    text not null,
  type       text not null check (type in ('metin', 'görsel', 'bağlantı')),
  value      text not null default '',
  alt        text,
  sort       int  not null default 0,
  updated_at timestamptz not null default now()
);

comment on table  public.site_content is 'GökTürk sitesinin metinleri ve görselleri. value: sitede görünen yazı ya da görselin adresi. alt: görselin açıklaması.';
comment on column public.site_content.key   is 'Sitedeki yeri. Değiştirmeyin.';
comment on column public.site_content.value is 'Metin: sitede görünen yazı. Görsel: görselin adresi (Storage → site-images → Get URL). Bağlantı: e-posta adresi ya da https:// adres.';
comment on column public.site_content.alt   is 'Yalnız görseller: görseli göremeyenler için kısa açıklama.';

-- düzenlenme zamanı kendiliğinden güncellensin
create or replace function public.site_content_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before update on public.site_content
  for each row execute function public.site_content_touch();

-- 2) Güvenlik: herkes okuyabilir, kimse siteden yazamaz (düzenleme yalnız Supabase panelinden)
alter table public.site_content enable row level security;
drop policy if exists "site_content herkes okur" on public.site_content;
create policy "site_content herkes okur" on public.site_content for select to anon, authenticated using (true);
grant select on public.site_content to anon, authenticated;

-- 3) Sitenin şu anki içeriği (var olan satırlara dokunmaz, yalnız eksikleri ekler)
insert into public.site_content (key, section, type, value, alt, sort) values
${values}
on conflict (key) do nothing;

-- 4) Görseller için herkese açık klasör: site-images
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

-- 5) Raporlar ve çalışmalar: her satır sitedeki "Raporlar" bölümünde bir kart
create table if not exists public.reports (
  id           bigint generated always as identity primary key,
  title        text not null,
  summary      text,
  category     text not null default 'Rapor',
  published_on date not null default current_date,
  file_url     text,
  cover_url    text,
  cover_alt    text,
  published    boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table  public.reports is 'Sitedeki Raporlar bölümü. Her satır bir kart; published işaretli olanlar en yeni tarih üstte görünür.';
comment on column public.reports.title        is 'Kartın başlığı (zorunlu).';
comment on column public.reports.summary      is 'Bir iki cümlelik özet.';
comment on column public.reports.category     is 'Kartın üstündeki etiket: Rapor, Çalışma, Tasarım raporu...';
comment on column public.reports.published_on is 'Yayın tarihi; kartlar bu tarihe göre sıralanır.';
comment on column public.reports.file_url     is 'Raporun adresi: Storage → raporlar klasörüne yüklenen PDF''in Get URL adresi ya da https:// bir bağlantı.';
comment on column public.reports.cover_url    is 'İsteğe bağlı kapak görseli adresi (site-images klasöründen). Boşsa kartta GökTürk kartalı görünür.';
comment on column public.reports.cover_alt    is 'Kapak görselinin kısa açıklaması.';
comment on column public.reports.published    is 'İşaret kaldırılırsa kart siteden gizlenir, silinmez.';

alter table public.reports enable row level security;
drop policy if exists "reports yayımlananları herkes okur" on public.reports;
create policy "reports yayımlananları herkes okur" on public.reports for select to anon, authenticated using (published);
grant select on public.reports to anon, authenticated;

-- rapor dosyaları (PDF) için herkese açık klasör: raporlar
insert into storage.buckets (id, name, public)
values ('raporlar', 'raporlar', true)
on conflict (id) do update set public = true;

-- 6) Haberler: her satır sitedeki "Haberler" bölümünde bir satır; tıklanınca haberin tamamı açılır
create table if not exists public.news (
  id           bigint generated always as identity primary key,
  title        text not null,
  summary      text,
  body         text,
  published_on date not null default current_date,
  image_url    text,
  image_alt    text,
  link_url     text,
  published    boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table  public.news is 'Sitedeki Haberler bölümü. published işaretli haberler en yeni tarih üstte görünür; ilk 5 haber açık, fazlası düğmeyle açılır.';
comment on column public.news.title        is 'Haberin başlığı (zorunlu).';
comment on column public.news.summary      is 'Listede başlığın altında görünen bir iki cümle.';
comment on column public.news.body         is 'Haberin tamamı; başlığa tıklanınca açılan pencerede görünür. Paragrafları boş bir satırla ayırın.';
comment on column public.news.published_on is 'Haberin tarihi; liste bu tarihe göre sıralanır.';
comment on column public.news.image_url    is 'İsteğe bağlı görsel adresi (Storage → site-images → Get URL). Boşsa GökTürk kartalı görünür.';
comment on column public.news.image_alt    is 'Görselin kısa açıklaması.';
comment on column public.news.link_url     is 'İsteğe bağlı https:// bağlantı (örneğin TEKNOFEST duyurusu); pencerenin altında görünür.';
comment on column public.news.published    is 'İşaret kaldırılırsa haber siteden gizlenir, silinmez.';

alter table public.news enable row level security;
drop policy if exists "news yayımlananları herkes okur" on public.news;
create policy "news yayımlananları herkes okur" on public.news for select to anon, authenticated using (published);
grant select on public.news to anon, authenticated;
`;

writeFileSync(root + 'supabase/setup.sql', sql);
console.log(`setup.sql: ${rows.size} satır (${[...rows.values()].filter(r => r.type === 'görsel').length} görsel)`);

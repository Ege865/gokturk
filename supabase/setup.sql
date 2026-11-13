-- GökTürk sitesi: içerik tablosu ve görsel klasörü
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
  ('menu.takim', 'Menü', 'metin', 'Takım', null, 10),
  ('menu.alanlar', 'Menü', 'metin', 'Alanlar', null, 20),
  ('alanlar.havacilik.baslik', 'Çalışma alanları', 'metin', 'Havacılık Sistemleri', null, 30),
  ('menu.havacilik.kisa', 'Menü', 'metin', 'Gövde, kanat ve itki', null, 40),
  ('alanlar.teknoloji.baslik', 'Çalışma alanları', 'metin', 'Teknoloji Geliştirme', null, 50),
  ('menu.teknoloji.kisa', 'Menü', 'metin', 'Elektronik ve yazılım', null, 60),
  ('alanlar.egitim.baslik', 'Çalışma alanları', 'metin', 'Eğitim ve Akademi', null, 70),
  ('menu.egitim.kisa', 'Menü', 'metin', 'Okulda ve şehirde atölyeler', null, 80),
  ('menu.okul', 'Menü', 'metin', 'Okul', null, 90),
  ('menu.nifarge', 'Menü', 'metin', 'NIF Ar-Ge', null, 100),
  ('menu.haberler', 'Menü', 'metin', 'Haberler', null, 110),
  ('menu.raporlar', 'Menü', 'metin', 'Raporlar', null, 120),
  ('menu.sponsor_buton', 'Menü', 'metin', 'Sponsor olun', null, 130),
  ('hero.baslik', 'Giriş', 'metin', 'Nilüfer''den bir lise İHA takımı', null, 140),
  ('hero.metin', 'Giriş', 'metin', 'GökTürk, Nilüfer Borsa İstanbul Fen Lisesi öğrencilerinin 2026''da kurduğu insansız hava aracı takımı. Hedefimiz TEKNOFEST''te Türkiye birinciliği.', null, 150),
  ('hero.buton1', 'Giriş', 'metin', 'Sponsor olun', null, 160),
  ('hero.buton2', 'Giriş', 'metin', 'Başarıları görün', null, 170),
  ('hero.gorsel', 'Giriş', 'görsel', 'assets/img/photo-f93507658.jpg', 'Dört pervaneli bir insansız hava aracı, mavi gökyüzünde bulutların üzerinde uçuyor', 180),
  ('takim.baslik', 'Vizyon ve misyon', 'metin', 'GökTürk''ün vizyonu ve misyonu', null, 190),
  ('takim.vizyon_baslik', 'Vizyon ve misyon', 'metin', 'Vizyon', null, 200),
  ('takim.vizyon', 'Vizyon ve misyon', 'metin', 'İnsansız hava aracı teknolojileri geliştirmek ve Ar-Ge kültürünü önce okulumuzda, sonra Bursa''da ve Türkiye''de yaymak.', null, 210),
  ('takim.misyon_baslik', 'Vizyon ve misyon', 'metin', 'Misyon', null, 220),
  ('takim.misyon', 'Vizyon ve misyon', 'metin', 'TEKNOFEST İnsansız Hava Aracı Yarışması''nda Türkiye birincisi olmak.', null, 230),
  ('takim.link', 'Vizyon ve misyon', 'metin', 'Çalışma alanlarımızı görün', null, 240),
  ('takim.gorsel', 'Vizyon ve misyon', 'görsel', 'assets/img/photo-f42208318-900.jpg', 'Sekiz pervaneli bir hava aracı, kumandasıyla birlikte açık havada bir çalışma masasının üzerinde', 250),
  ('alanlar.baslik', 'Çalışma alanları', 'metin', 'GökTürk''ün üç çalışma alanı.', null, 260),
  ('alanlar.altbaslik', 'Çalışma alanları', 'metin', 'Her biri logomuzun bir kolu.', null, 270),
  ('alanlar.havacilik.metin', 'Çalışma alanları', 'metin', 'Gövde, kanat ve itki sistemini tasarlayıp üretiyor, aracı uçuşa hazırlıyoruz.', null, 280),
  ('alanlar.havacilik.gorsel', 'Çalışma alanları', 'görsel', 'assets/img/photo-f136409350-900.jpg', 'Çakıllı bir zeminde duran, katlanır kollu bir insansız hava aracı', 290),
  ('alanlar.teknoloji.metin', 'Çalışma alanları', 'metin', 'Uçuş kontrol kartını, sensörleri ve aracı otonom uçuracak yazılımı geliştiriyoruz.', null, 300),
  ('alanlar.teknoloji.gorsel', 'Çalışma alanları', 'görsel', 'assets/img/photo-f4071999-960.jpg', 'Bir elektronik kart üzerinde cımbızla devre elemanı lehimleniyor', 310),
  ('alanlar.egitim.metin', 'Çalışma alanları', 'metin', 'Öğrendiklerimizi okulumuzda ve Bursa''da atölyelerle paylaşıyoruz.', null, 320),
  ('alanlar.egitim.gorsel', 'Çalışma alanları', 'görsel', 'assets/img/photo-f16007442-960.jpg', 'Osiloskop, multimetre ve lehim aletleriyle dolu bir elektronik çalışma tezgâhı', 330),
  ('neden.portre', 'Neden İHA', 'görsel', 'assets/photos/ataturk.jpg', '', 340),
  ('neden.baslik', 'Neden İHA', 'metin', 'İnsansız hava aracını seçme nedenimiz', null, 350),
  ('neden.soz', 'Neden İHA', 'metin', 'İstikbal göklerdedir.', null, 360),
  ('neden.soz_sahibi', 'Neden İHA', 'metin', 'Mustafa Kemal Atatürk', null, 370),
  ('neden.metin1', 'Neden İHA', 'metin', 'Takımımızdaki herkesin ortak ilgisi havacılık. Uçan bir aracı tasarlamak, üretmek ve uçurmak bizi bir araya getirdi.', null, 380),
  ('neden.metin2', 'Neden İHA', 'metin', 'İHA, TEKNOFEST''te rekabeti en yüksek kategorilerden biri. Zor bir alanı bilerek seçtik; güçlü rakipler bizi daha iyi mühendis yapacak.', null, 390),
  ('okul.baslik', 'Okul', 'metin', 'Nilüfer Borsa İstanbul Fen Lisesi', null, 400),
  ('okul.metin', 'Okul', 'metin', 'Takımımızın okulu, Bursa Nilüfer''de 2011–2012 eğitim yılında açılan, şehrin ikinci devlet fen lisesi. Öğrencilerini LGS ile alıyor.', null, 410),
  ('okul.bilgi1_baslik', 'Okul', 'metin', 'Açılış', null, 420),
  ('okul.bilgi1', 'Okul', 'metin', '2011–2012', null, 430),
  ('okul.bilgi2_baslik', 'Okul', 'metin', 'Yer', null, 440),
  ('okul.bilgi2', 'Okul', 'metin', 'Nilüfer, Bursa', null, 450),
  ('okul.bilgi3_baslik', 'Okul', 'metin', 'Ar-Ge çatısı', null, 460),
  ('okul.bilgi3', 'Okul', 'metin', 'NIF Ar-Ge', null, 470),
  ('okul.link', 'Okul', 'metin', 'NIF Ar-Ge''nin başarılarını görün', null, 480),
  ('okul.gorsel', 'Okul', 'görsel', 'assets/photos/school.jpg', 'Nilüfer İMKB Fen Lisesi''nin kırmızı tuğla girişi, iki yanında beyaz bloklar ve bayrak direkleri', 490),
  ('nifarge.baslik', 'NIF Ar-Ge', 'metin', 'NIF Ar-Ge''nin başarıları.', null, 500),
  ('nifarge.altbaslik', 'NIF Ar-Ge', 'metin', 'GökTürk bu çatının altında kuruldu.', null, 510),
  ('nifarge.roket.baslik', 'NIF Ar-Ge', 'metin', 'TEKNOFEST Roket Yarışması''nda Türkiye birinciliği', null, 520),
  ('nifarge.roket.metin', 'NIF Ar-Ge', 'metin', 'Türkiye şampiyonu NIF Ar-Ge roket takımı, okulumuzun önünde roketiyle.', null, 530),
  ('nifarge.roket.gorsel', 'NIF Ar-Ge', 'görsel', 'assets/photos/roket-takimi.jpg', 'NIF Ar-Ge roket takımı, okulun önünde ortalarında kırmızı roketle poz veriyor', 540),
  ('nifarge.sualti.gorsel', 'NIF Ar-Ge', 'görsel', 'assets/img/photo-f28083954-900.jpg', 'Sarı gövdeli, güneş panelli bir su altı aracı', 550),
  ('nifarge.sualti.baslik', 'NIF Ar-Ge', 'metin', 'İnsansız su altı aracı', null, 560),
  ('nifarge.sualti.metin', 'NIF Ar-Ge', 'metin', 'Aktif olarak çalışan takımımız su altı aracını tasarlıyor ve yarışmalara hazırlanıyor.', null, 570),
  ('nifarge.robot.gorsel', 'NIF Ar-Ge', 'görsel', 'assets/img/photo-f96809921-500.jpg', 'Yarışma alanında alüminyum gövdeli, tekerlekli bir robot', 580),
  ('nifarge.robot.baslik', 'NIF Ar-Ge', 'metin', 'Robot yarışmaları', null, 590),
  ('nifarge.robot.metin', 'NIF Ar-Ge', 'metin', 'Öğrencilerimiz kendi robotlarını yapıp robot yarışmalarında okulumuzu temsil ediyor.', null, 600),
  ('nifarge.eko.gorsel', 'NIF Ar-Ge', 'görsel', 'assets/img/photo-f93473375-500.jpg', 'Kırmızı toprakta yeni filizlenmiş bir fide', 610),
  ('nifarge.eko.baslik', 'NIF Ar-Ge', 'metin', 'Ekolojik okul projesi', null, 620),
  ('nifarge.eko.metin', 'NIF Ar-Ge', 'metin', 'Okulumuzda çevre ve sürdürülebilirlik üzerine yürüttüğümüz uzun soluklu proje.', null, 630),
  ('haberler.baslik', 'Haberler', 'metin', 'GökTürk''ten haberler.', null, 640),
  ('haberler.altbaslik', 'Haberler', 'metin', 'Takımda olan biten, en yenisi üstte.', null, 650),
  ('haberler.bos_baslik', 'Haberler', 'metin', 'İlk haberimiz yakında', null, 660),
  ('haberler.bos_metin', 'Haberler', 'metin', 'Atölyeden, testlerden ve yarışmalardan haberleri burada paylaşacağız.', null, 670),
  ('raporlar.baslik', 'Raporlar', 'metin', 'GökTürk''ün raporları ve çalışmaları.', null, 680),
  ('raporlar.altbaslik', 'Raporlar', 'metin', 'Yazdıkça burada yayımlıyoruz.', null, 690),
  ('raporlar.bos_baslik', 'Raporlar', 'metin', 'İlk raporumuz yazılıyor', null, 700),
  ('raporlar.bos_metin', 'Raporlar', 'metin', 'Tasarım, üretim ve test raporlarımızı tamamladıkça bu bölümde paylaşacağız.', null, 710),
  ('sponsor.baslik', 'Sponsorlar', 'metin', 'GökTürk''ün ilk sponsoru olun', null, 720),
  ('sponsor.metin', 'Sponsorlar', 'metin', 'Sponsor listemiz henüz boş. Bize destek veren kurumlar bu bölümde logolarıyla yer alacak.', null, 730),
  ('sponsor.eposta', 'Sponsorlar', 'bağlantı', 'sponsor@gokturk.example', null, 740),
  ('sponsor.buton', 'Sponsorlar', 'metin', 'Sponsor olun', null, 750),
  ('footer.takim_baslik', 'Alt bilgi', 'metin', 'Takım', null, 760),
  ('footer.okul_baslik', 'Alt bilgi', 'metin', 'Okul', null, 770),
  ('footer.sponsorlar_baslik', 'Alt bilgi', 'metin', 'Sponsorlar', null, 780),
  ('footer.sponsorlar_metin', 'Alt bilgi', 'metin', 'İlk sponsorumuzu arıyoruz.', null, 790),
  ('footer.iletisim_baslik', 'Alt bilgi', 'metin', 'İletişim', null, 800),
  ('footer.iletisim_metin', 'Alt bilgi', 'metin', 'Bilgilerimizi takım kurulumu tamamlanınca burada paylaşacağız.', null, 810),
  ('footer.telif', 'Alt bilgi', 'metin', '© 2026 GökTürk İHA Takımı', null, 820)
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

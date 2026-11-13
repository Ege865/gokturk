# GökTürk sitesini Supabase'e bağlama

Site açılırken metinleri ve görselleri Supabase'deki `site_content` tablosundan okur. Tabloda bir satırı değiştirdiğinizde, ziyaretçi sayfayı yenilediğinde yeni içeriği görür. Siteyi yeniden yüklemeniz gerekmez.

## 1. Bir kez yapılacak kurulum

1. https://supabase.com adresinde ücretsiz bir hesap açın ve **New project** ile yeni bir proje oluşturun. Bölge olarak Avrupa'yı (örneğin Frankfurt) seçin.
2. Sol menüde **SQL Editor → New query**'yi açın. `supabase/setup.sql` dosyasının tamamını yapıştırıp **Run**'a basın. Bu işlem içerik tablosunu kurar, sitenin bugünkü bütün metinlerini tabloya yazar ve `site-images` adında bir görsel klasörü açar.
3. **Project Settings → API** sayfasından iki değeri kopyalayın:
   - **Project URL**: `https://xxxx.supabase.co` biçimindedir.
   - **anon public** ya da **publishable** anahtar.
4. `assets/cms.js` dosyasının üstündeki iki satırı bu değerlerle doldurun:
   ```js
   const SUPABASE_URL = 'https://xxxx.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_...';
   ```
   **service_role** ya da **secret** anahtarını asla bu dosyaya koymayın. O anahtar veritabanının tamamına yazma izni verir.
5. Değişen `assets/cms.js` dosyasını GitHub'a yükleyin. Bu adım yalnız bir kez gerekir.

## 2. Metin değiştirmek

**Table Editor → site_content** tablosunu açın ve değiştirmek istediğiniz satırın **value** hücresine tıklayın. Yeni yazıyı girip kaydedin.

- `section` sütunu metnin sitenin hangi bölümünde olduğunu gösterir: Giriş, Vizyon ve misyon, Okul gibi.
- `key` sütununa dokunmayın. Site metni bu anahtarla bulur.
- **value** hücresini boş bırakırsanız sitedeki eski metin görünmeye devam eder.

## 3. Görsel değiştirmek

1. **Storage → site-images** klasörüne yeni görseli yükleyin. En fazla 2000 px genişliğinde bir JPG ya da WebP kullanın.
2. Görselin üstündeki **⋯** menüsünden **Get URL**'yi seçin ve adresi kopyalayın.
3. **site_content** tablosunda ilgili görsel satırını bulun. `type` sütununda `görsel` yazar. **value** hücresine bu adresi yapıştırın, **alt** hücresine görselde ne olduğunu kısaca yazın.

## 4. İletişim ve sponsor e-postası

`sponsor.eposta` satırının **value** hücresine e-posta adresini yazın. Sitedeki "Sponsor olun" düğmesi bu adrese e-posta açar. İletişim metni için `footer.iletisim_metin` satırını kullanın.

## 5. Rapor ya da çalışma eklemek

Sitedeki **Raporlar** bölümü `reports` tablosundan dolar. Tablo boşken bölümde kırmızı kartal ve "İlk raporumuz yazılıyor" yazısı görünür.

1. Rapor bir PDF ise **Storage → raporlar** klasörüne yükleyin. **⋯** menüsünden **Get URL**'yi seçip adresi kopyalayın.
2. **Table Editor → reports** tablosunda **Insert → Insert row**'a tıklayın ve alanları doldurun:
   - **title** (zorunlu): kartın başlığı, örneğin "Kavramsal Tasarım Raporu".
   - **summary**: bir iki cümlelik özet.
   - **category**: kartın üstündeki etiket, örneğin Rapor, Çalışma ya da Test.
   - **published_on**: yayın tarihi. Kartlar bu tarihe göre sıralanır, en yenisi solda durur.
   - **file_url**: PDF'in adresi ya da bir https:// bağlantı. Adres PDF ise kartta "Raporu açın (PDF)", değilse "Çalışmayı görün" yazar.
   - **cover_url** ve **cover_alt**: kapak görselinin adresi ve kısa açıklaması. Bu ikisi isteğe bağlı. Kapak eklemezseniz kartta GökTürk kartalı görünür.
   - **published**: kutu işaretliyse kart sitede görünür. İşareti kaldırırsanız kart gizlenir ama silinmez. Taslakları bu şekilde saklayabilirsiniz.
3. **Save**'e basın. Siteyi yenilediğinizde yeni kart görünür.

Bir satırda üç kart yan yana durur. Rapor sayısı arttıkça bölüm aşağı doğru uzar.

## 6. Haber yayınlamak

Sitedeki **Haberler** bölümü `news` tablosundan dolar. En yeni haber en üstte durur. İlk 5 haber açık görünür, daha fazlası varsa "Tüm haberleri gösterin" düğmesi çıkar. Bir habere tıklandığında haberin tamamı bir pencerede açılır.

**Table Editor → news** tablosunda **Insert → Insert row**'a tıklayın ve alanları doldurun:

- **title** (zorunlu): haberin başlığı.
- **summary**: listede başlığın altında görünen bir iki cümle.
- **body**: haberin tamamı. Paragrafları birbirinden bir boş satırla ayırın. Boş bırakırsanız pencerede özet görünür.
- **published_on**: haberin tarihi. Liste bu tarihe göre sıralanır.
- **image_url** ve **image_alt**: görselin adresi ve kısa açıklaması. Görseli önce **Storage → site-images** klasörüne yükleyin, **Get URL** ile adresini alın. Görsel eklemezseniz masaüstünde kırmızı kartal görünür, telefonda görsel yeri hiç açılmaz.
- **link_url**: isteğe bağlı bir https:// bağlantı, örneğin bir TEKNOFEST duyurusu. Pencerenin altında "Ayrıntılar" olarak görünür.
- **published**: işareti kaldırırsanız haber gizlenir ama silinmez.

## Bilmeniz gerekenler

- Supabase'e ulaşılamazsa site, içinde yazılı olan son metinlerle açılır. Sayfa hiçbir zaman boş görünmez.
- Tarayıcı, her ziyaretçinin gördüğü son içeriği saklar. Bu sayede site hızlı açılır.
- Animasyonlu iki başlık var: giriş başlığı ve "İstikbal göklerdedir." Supabase çok yavaş yanıt verdiğinde bu iki başlıktaki değişiklik ziyaretçiye ikinci açılışta görünür.
- Logolar, sayfa düzeni ve renkler tabloda yer almaz. Bunlar sitenin kendi dosyalarındadır.
- Sitede yeni bir metin alanı açıldığında `node supabase/build-seed.mjs` komutunu çalıştırın ve yeni `setup.sql` dosyasını tekrar çalıştırın. Bu dosya var olan satırlara dokunmaz, yalnız eksik satırları ekler.
- Ücretsiz Supabase projeleri bir hafta hiç kullanılmazsa duraklatılır. Böyle olursa panelden **Restore**'a basın. Proje duraklatılmışken site, içindeki metinlerle açılmaya devam eder.

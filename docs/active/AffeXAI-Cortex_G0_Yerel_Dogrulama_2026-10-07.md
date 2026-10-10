# AffeXAI-Cortex — G0 Yerel Doğrulama Kaydı

Tarih: 07.10.2026. Kapsam: G0-A workspace/backend temeli ve G0-B frontend derleme dilimi. Tam G0 ve tam ürün kabulü açık. Önceki ölçümler aşağıda tarihçe olarak korunur; güncel sonuçlar G0-B bölümündedir.

## Yapılanlar

- 33 modül için [kabul matrisi](AffeXAI-Cortex_Modul_Kabul_Matrisi.md) oluşturuldu. Bütün işlevsel kabul durumları bekliyor; bu çalışma modülleri tamamlanmış saymaz.
- Yerel çalışma ortamı Node 24.18.0 / pnpm 11.17.0 olarak `.nvmrc`, engines ve packageManager ile tanımlandı.
- Root seçili geliştirme/build komutları pnpm kullanır; backend build içindeki gereksiz npm alt çağrısı kaldırıldı. `dev.sh`, `prod.sh` ve operasyon scriptlerinin tamamı henüz göç ettirilmedi.
- pnpm lockfile Git ignore'dan çıkarıldı; dosya yerelde mevcut, henüz commitlenmedi. Eksik doğrudan bağımlılıklar mevcut cache sürümleriyle eklendi: backend dotenv/socket.io/uuid; frontend shared-types/dompurify/uuid.
- Shared-types `file:` bağımlılığı korundu. Docker/CI göçü yapılmadan `workspace:*` biçimine geçilmedi.
- TicketsService içindeki çift `getTicketSignal` tek implementasyona indirildi; frontend alanları ve eski yanıt alanları birlikte korundu.
- Neural crawler mevcut JwtAuthGuard/CurrentUser importlarına bağlandı. Bu derleme düzeltmesi tenant/SSRF güvenliği tamamlandı anlamına gelmez.
- Sertifika PDF üretiminde mevcut Puppeteer API'sine uygun load + network-idle beklemesi kullanıldı; tarayıcı kapanışı finally ile güvenceye alındı; cleanup hatası özgün üretim hatasını maskelemiyor.
- Backend üretim kapsamı için `pnpm run typecheck:backend:build` eklendi. Geniş eski `typecheck` komutu korunuyor; hataları sessizce dışlanmadı.

## Doğrulama ve sınırlar

| Kontrol | Sonuç | Sınır |
|---|---|---|
| `pnpm install --offline --ignore-scripts` | Exit 0; yeni indirme yok | Mevcut cache/node_modules; lifecycle scriptleri atlandı |
| `pnpm install --offline --frozen-lockfile --ignore-scripts` | Exit 0 | Temiz makine/Docker kurulum kanıtı değildir |
| `pnpm run build:shared` | Exit 0 | Tüketici runtime/E2E kanıtı değildir |
| Backend üretim TS kontrolü | 22 tanıdan 0'a, exit 0 | Genel backend kapsamı farklıdır; daha önce 1727 tanı vardı, bu çalışma onu düzeltmedi |
| `pnpm run build:backend` | Exit 0; Nest artifact + 10/10 HTML şablon | Uygulama/DB başlatılmadı |
| Yeni ticket/PDF testleri (5 hata yolu dahil) ve mevcut iki auth spec | Son birleşik çalışmada exit 0; 4 suite / 20 test geçti | Tenant izolasyonunun HTTP/E2E kanıtı değil; PDF gerçek tarayıcı/S3 kullanmadı |
| Frontend `tsc --noEmit --incremental false --pretty false` | Exit 2; 565 → 410 tanı | Frontend hâlâ başarısız; UI çalıştırılmadı |
| Bağımsız kod incelemesi | Bloklayıcı regresyon bulunmadı; runtime/PDF cleanup notları işlendi | Genel güvenlik bulguları sonraki G1 kapsamında açık |

Kod incelemesi için yeni agent açma sınırına takılınca mevcut bağımsız inceleme ajanı yeniden kullanıldı. İnceleme uygulayıcıdan ayrı yapıldı.

Derleme scripti kaynak HTML de üretir. Doğrulamada değişen üç üretilmiş kaynak HTML dosyası build öncesi alınan birebir kopyalarına geri kondu; dist artifact'leri korundu. Bu scriptin kaynak yazımı G0-B'de ayrı ele alınmalı.

## Açık kapılar

- Frontend kalan 410 TypeScript tanısı ve gerçek build/UI akışları.
- Genel backend kontrol kapsamındaki kopya frontend/araç dosyalarının doğru yerleşimi ve ayrı doğrulaması.
- Tam test keşfi/coverage ve geniş test grubundaki önceki heap sorunu.
- Temiz kurulum, native lifecycle scriptleri ve Docker/CI/package-lock uyumu. Eski npm lockfile ve Node18/20/22 Docker/CI tüketicileri henüz değiştirilmedi; yeni manifestlerle bunların doğruluğu iddia edilmez.
- G1 kritik auth/tenant, backup, commerce ve ticket sahipliği bulguları. Bu dilim güvenlik düzeltmesi değildir.

Mevcut kullanıcı değişiklikleri ve untracked chat/test dosyaları korundu. Commit, push, deploy, migration, provider çağrısı veya canlı sistem işlemi yapılmadı.

Kanıt logları: `docs/active/verification/2026-10-07/g0/` (yerel, Git ignore kapsamındaki `.log` dosyaları).


## G0-B — frontend derleme, sözleşmeler ve marka ayrımı

Ürün adı **AffeXAI Cortex**; Aluplan bağımsız ürünün markası değildir, önceki örnek tenant adıdır. Kullanıcının kararıyla örnek tenant **XYZ Company** oldu. Statik UI/metadata, örnek tenant metinleri, e-posta varsayılanları ve örnek SEO/iletişim alanları ayrıldı. Gerçek tenant ayarı örnek markayla ezilmez. Oturum storage/cookie anahtarları ve kayıtlı block/slug kimlikleri uyumluluk için korundu; DB içeriği taşınmadı. Master admin için yerleşik küçük model fikri sonraya bırakıldı, bu çalışma model kurmaz.

Yapılan dar onarımlar:

- CMS gerçek block registry'si, form schema adaptörü, factory/shared enum ve tarih sözleşmeleri, editor/template bileşen prop'ları düzeltildi. Eski `isFullWidth` kayıtları okunmaya devam eder; yeni açık `fullWidth=false` değerine öncelik verilir.
- Route/API tipleri gerçek yanıtlarla eşlendi; eksik profil alanları JWT'de var sayılmadı. Etkinlik kayıt hatası artık başarı olarak gösterilmez.
- Bulk import/export response zarfları açıldı, export create/preview isteği gerçek DTO'ya düz biçimde eşlendi; summary/detail ayrıldı. Backend'in sunmadığı metadata/örnek satırlar üretilmez.
- React-window v2 sanallaştırma, sortable tree props, Tiptap mention klavye/ref, grafikler ve Three bileşenlerinin kurulu sürüm sözleşmeleri düzeltildi.
- E-posta gerçek HTML render hataları (Hr, footer, style alanı) düzeltildi; tenant adı için regresyon eklendi.
- Ürün kartı gerçek commerce yanıtını kullanır; uydurma büyüme/müşteri sayısı çıkarıldı. Geçmiş fiyat kayıtlarında birim tutarsızlığı çözülmeden tutarlar doğrulanmış tahsilat olarak gösterilmez.
- Etkinlik liste endpoint'i katılımcı sayısı sağlamıyor, stats servisi kapasiteden simülasyon üretiyor. Grafik bu değeri gerçek ölçüm olarak sunmuyor; katılımcı verisi açıkça mevcut değil.

| Kontrol | Güncel sonuç | Sınır |
|---|---|---|
| Frontend `tsc --noEmit --incremental false --pretty false` | 410 → 0; exit 0 | Test dosyaları mevcut tsconfig kapsamında ayrı doğrulanır |
| Frontend `next build` | Exit 0; 193 statik sayfa üretildi | Mevcut config lint'i atlıyor; lint kabulü değildir |
| CMS/factory/layout + ürün fiyat girdisi + etkinlik kayıt sözleşmesi | 5 suite, 22 test geçti | Mock/yerel sözleşme kontrolü |
| Bulk transport + e-posta gerçek HTML render | 14 test geçti | Gerçek mail gönderimi/import worker/provider kullanılmadı |
| Tarayıcı | `/cms-demo` ve `/cms-demo-enhanced` dev sunucusunda render edildi; ürün adı doğrulandı | Editörün tamamı ve authenticated akışlar E2E kabulü almadı |
| Bağımsız inceleme | CMS width, destek çift sayımı, export zarfı, tenant e-posta preview bulguları düzeltildi | Genel güvenlik kabulü değildir |

Build sırasında backend URL yalnız `127.0.0.1:19006` olarak verildi; backend başlatılmadı. Bazı CMS sayfaları ECONNREFUSED yakalayıp mevcut fallback'i render etti. Bu yüzden build başarısı canlı veri veya tam kullanıcı akışının kanıtı değildir. Üretim önizlemesinin sonraki tarayıcı denemesi browser URL policy/önceki bağlantı-hata sayfası nedeniyle doğrulanamadı; dev render kanıtından ayrı tutulur.

Tekrarlanabilir kontroller (repo kökünden):

```sh
pnpm --filter nextn exec tsc --noEmit --incremental false --pretty false
BACKEND_URL=http://127.0.0.1:19006 NEXT_PUBLIC_API_URL=http://127.0.0.1:19006 pnpm --filter nextn build
pnpm --dir apps/backend exec tsx --tsconfig ../frontend/tsconfig.json --test ../frontend/src/emails/email-render-contracts.test.ts ../frontend/src/components/admin/email-marketing/bulk-contracts.test.ts
```

Jest'in odaklı 5-suite çalışması backend'deki mevcut jest/ts-jest runtime'ını kullanır; config ve log `verification/2026-10-07/g0b/` altında yerel kanıtta saklıdır. Genel test keşfi ve coverage halen açık; 66 odaklı test bütün ürünün yüzde 80 kapsamını kanıtlamaz.

### Sıradaki işler

1. G0 kalan Docker/CI/lockfile/Node uyumu, lint ve test düzeni, temiz kurulum; backend template compiler'ın kaynak HTML yazımı.
2. G1 auth/tenant/role/backup/commerce kritik sınırları ve iki tenant negatif senaryoları.
3. Ardından kabul matrisindeki bağımlılık sırasıyla modülleri tek tek tamamlamak; her modülü gerçek UI→API→kalıcı sonuç ve başarısızlık senaryolarıyla kabul etmek.

CMS `componentsRegistry` boşluğu, Neural Grid signals endpoint'i, export fields endpoint'i, gerçek event metrics ve commerce tutar birimi halen işlevsel modül işleri olarak açıktır. Modüller bu derleme dilimiyle tamamlanmış sayılmaz. Push/deploy/commit, migration, ödeme veya AI provider çağrısı yapılmadı.


### Son fiyat/editleme regresyon kontrolü

Commerce admin servisi USD ana birimini integer cent'e dönüştürürken `19.99 * 100` kayan nokta hatası oluşturuyordu. Girdi yazımdan/provider çağrısından önce doğrulanıyor; yalnız geçerli iki haneli USD tutarı dönüştürülüyor. Açık sıfır ve PostgreSQL decimal dönüşümü test edildi. Geçmiş kayıtların birim göçü ve DB/provider atomikliği bu düzeltmede çözülmedi.

- `product-management-price.spec.ts`: **29/29 geçti**, Stripe ve repository mock; bağımsız güvenlik/kod incelemesi yapıldı.
- `editor-log-regressions.test.mjs`: **1/1 geçti**; mention klavye/ref, boş sonuç, global çift handler olmaması ve 1000 logun 20 satırlık sanal penceresi sınandı. SSR test harness'ında beklenen useLayoutEffect uyarıları var.
- Son backend üretim tip kontrolü ve frontend tip kontrolü: **exit 0**. `git diff --check`: exit 0.
- Toplam bu dilimde yeniden çalıştırılan odaklı test: **66** (22 + 14 + 29 + 1). Genel ürün coverage/E2E iddiası yok.

```sh
pnpm --dir apps/backend exec jest --runInBand --runTestsByPath src/modules/commerce/services/product-management-price.spec.ts --silent
TSX_TSCONFIG_PATH=apps/frontend/tsconfig.json apps/backend/node_modules/.bin/tsx --test apps/frontend/src/components/__tests__/editor-log-regressions.test.mjs
pnpm run typecheck:backend:build
```

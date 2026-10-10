# AffeXAI-Cortex — Bağımsız Teknik Durum ve Tamamlanma Planı

Tarih: 07.10.2026
İncelenen dizin: `/Users/hazarvolgaekiz/dev/lab/AffeXAI-Cortex-main`
Git tabanı: `9895842`; inceleme mevcut commitlenmemiş değişiklikleri de kapsar.

## 1. Ürün amacı ve kapsam kararı

AffeXAI-Cortex; müşteri ilişkileri, destek, içerik, pazarlama, sosyal medya, etkinlik, sertifika, ticaret ve bilgi kaynaklarını ortak marka zekâsı etrafında birleştiren çok kiracılı bir platformdur. BCC yalnızca rapor ekranı değildir: dinleme → ortak hafıza → değerlendirme → öneri/aksiyon → sonuç → yeniden öğrenme döngüsünün merkezidir.

Dayanaklar: `README.md` proje vizyonu, `CORTEX_ZERO.md:2-27`, `docs/active/BCC_features.md`.

Kullanıcının kararı: vaat edilen bütün modüller çalışmadan piyasaya çıkılmayacak. Bu rapor kapsamı küçültmez. İşleri bağımlılık sırasına koyar; ara aşamalar geliştirme kilometre taşıdır, erken yayın önerisi değildir.

Sonuç: önemli miktarda gerçek iş mantığı ve entegrasyon kodu var. Ancak güvenli, tekrar kurulabilir, tüm modülleri birlikte çalışan ve sonuçlardan öğrenen ürün henüz kanıtlanmış değil. Bazı aktif akışlar simülasyon, bazı entegrasyonlar eksik, bazıları da çalıştırılarak doğrulanmadı. Sayısal tamamlanma yüzdesi vermek bu aşamada yanıltıcı olur.

## 2. Yöntem ve sınırlar

- Backend, frontend, AI/operasyon alanları bağımsız kaynak incelemeleriyle ele alındı; kritik güvenlik bulguları ayrıca gözden geçirildi.
- 33 backend modül dizini envantere alındı. Her modülün her satırı ve her iş akışı test edilmiş değildir; tablo bu farkı açıklar.
- Mevcut kaynak değişiklikleri korunmuştur. Uygulama koduna düzeltme, commit, push, deploy, migration veya canlı veri işlemi yapılmadı.
- Backend başlatılmadı: CommerceService açılış sırasında demo ürün/abonelik/kullanım verisi yazıyor. Mevcut DB üzerinde salt okunur inceleme varsayımı bozulurdu.
- Gerçek tarayıcı, provider, veritabanı, kuyruk ve çok kiracılı HTTP E2E doğrulaması yapılmadı. Statik güvenlik bulguları canlı saldırı kanıtı değildir.
- Yerel ortam Node `24.18.0`, pnpm `11.17.0`; `npm` PATH üzerinde yok. Kullanıcı varsayılanı olan Node 20 dizini bu makinede bulunamadı. CI ise Node 18/npm kullanıyor. Çalıştırma ortamları aynı değil.

## 3. Çalıştırılmış doğrulamalar

| Kontrol | Sonuç | Anlamı |
|---|---|---|
| Backend üretim TS yapılandırması: `tsc -p tsconfig.build.json --noEmit --incremental false --pretty false` | 22 TS tanısı | Üretim derlemesinin TypeScript aşaması temiz değil; tam Nest build çalıştırılmadı |
| Backend genel yapılandırma: `tsc --noEmit --incremental false --pretty false` | 1727 TS tanısı | Backend altına kopyalanmış frontend/araç dosyaları dahil daha geniş kapsam; 1727 bağımsız ürün hatası demek değil |
| Frontend: `tsc --noEmit --incremental false --pretty false` | 565 TS tanısı | Eksik workspace/import bağlantıları ve tip uyuşmazlıkları var |
| `tenant-guard.spec.ts` + `jwt-secret.spec.ts`, Jest `--runInBand --no-cache` | 2 suite, 12 test geçti | Birim test sonucu; gerçek HTTP guard sırası ve tenant izolasyonu kanıtı değil |
| neural-grid + strategy + insight-engine + commerce seçili testleri | Commerce suite geçti; süreç JS heap yetersizliğiyle sonlandı | Tüm seçili test grubu geçti denemez; coverage ölçülmedi |

Kanıt logları: `docs/active/verification/2026-10-07/`. Bu yerel `.log` dosyaları Git ignore kurallarına tabidir; commitlenmiş kanıt paketi değildir.

Backend üretim tanılarının 19'u TS2307 eksik modül/import; 2'si aynı metot için çift implementasyon; 1'i sertifika üreticisinde seçenek tipi uyuşmazlığı. Örnek: `tickets.service.ts:1801` ve `:1832` aynı `getTicketSignal` metodunu tanımlar. Neural crawler guard import yolu mevcut dizin yapısına uymuyor.

Frontend tanılarında 94 adet `@affexai/shared-types` bulunamama mesajı var; bunlar tek bir workspace bağımlılık sorununun birçok tüketiciye yansıması olabilir. Her tanıyı ayrı iş olarak saymak yanlış olur. Ayrıca gerçek olmayan export (`lib/api/neuralGridService.ts:1`), eksik CMS parçaları ve tip uyuşmazlıkları mevcut.

Testlerin anlamı ayrıca denetlenmeli: JWT testleri gerçek AuthModule yapılandırmasını yüklemek yerine doğrudan JwtService oluşturuyor. Strategy testi Cortex'in gerçekte döndürmediği `metadata.successScore` alanını mock ile sağlıyor (`test/strategy.spec.ts:61-62`). Insight testi tenantlar arası ortak `system-wide` davranışını beklenen sonuç olarak sabitliyor (`test/insight-engine.spec.ts:87-92`). Geçen test, doğru ürün sözleşmesi demek değildir.

## 4. Öncelikli güvenlik ve doğruluk engelleri

### 4.1 Tenant kimliği ve izin sırası — yayın engeli

`apps/backend/src/app.module.ts:145` TenantGuard'ı global kaydediyor; JWT doğrulaması controller düzeyinde. `core/guards/tenant.guard.ts:24` henüz kullanıcı yokken geçiş veriyor. `core/tenant/tenant.middleware.ts:13` gelen tenant header'ını alıyor. Kullanıcı ise `core/auth/guards/jwt-auth.guard.ts:97` sonrasında atanıyor. Ayrıca `admin` ve `super_admin` tenant kontrolünden birlikte muaf tutuluyor (`tenant.guard.ts:29`).

Bu birleşim nedeniyle sorgularda tenant filtresi olması, tenant seçiminin kullanıcıya yetkili olduğu anlamına gelmez. Auth → yetkili tenant çözümü → rol/izin → veri erişimi sırası tek sözleşmeye bağlanmalı; gerçek HTTP istekleriyle farklı tenant negatif testleri gerekir. RLS interceptor içindeki yorumlar aktif veritabanı RLS kanıtı değildir.

### 4.2 Yedekleme kapsamı — kritik koşullu veri ifşası yolu

`modules/backup/controllers/backup.controller.ts:41-48,76-83` ADMIN rolüne oluşturma/indirme verirken `services/backup.service.ts:132-146` tüm veritabanını pg_dump ile çıkarıyor. Tenant'a ait yedek kaydı, dosyanın tenant'a ait satırlarla sınırlı olduğunu göstermez. ADMIN müşteri yöneticisi olarak kullanılıyorsa bu kritik tenantlar arası veri erişimi yoludur. Platform yedeği ile müşteri veri dışa aktarımı ayrılmalı.

Kod yedeği filtrelerinde `.env` dışlama görünmüyor (`backup.service.ts:212-225`). Böyle dosyalar mevcutsa arşive dahil olabilir; içerikleri bu incelemede açılmadı.

### 4.3 Commerce ve destek yetkilendirmesi

`modules/commerce/controllers/commerce.controller.ts:7,17,45,51-63` yalnız JWT koruması altında ürün oluşturma, gönderilen tenant'a plan atama ve yönetim finansal verileri sunuyor. Ayrı AdminProductController üzerindeki doğru koruma bu diğer controller'ı korumaz. Token-economics endpoint'inin servis metodu boştur; bu endpoint için gerçek veri sızıntısı iddiasında bulunulmuyor.

`tickets.controller.ts:112,135` müşteri rolünü `roles.includes(...)` ile ararken JWT guard `Role[]` nesneleri atıyor (`jwt-auth.guard.ts:102-103`). Amaçlanan müşterinin yalnız kendi taleplerini görme kontrolü bu veri biçimiyle çalışmıyor.

Bilinen JWT fallback değeri hâlâ auth/config kodunda var. Production secret doğrulaması zorunlu olmalı; gerçek deployment'ın secret kullanıp kullanmadığı bu incelemede doğrulanmadı.

`database-import` public değildir; JWT + SUPER_ADMIN koruması vardır. Ancak production'da SQL çalıştıran aktif bir yönetim yüzeyidir; normal ürün runtime'ından ayrılması gerekir.

### 4.4 Yanlış başarı ve örnek veri

- `platform-integration/services/automation-executor.service.ts:331-365`: segment, bildirim ve CMS aksiyonlarının bazıları yalnız log yazıyor; yürütücü bunları başarılı aksiyon sayabiliyor (`:243-261`).
- `email-marketing/validation.controller.ts:52-53,86,108-122`: gerçek queue tetiklemesi yerine simülasyon ve rastgele ilerleme/log üretimi aktif controller'da.
- `commerce/services/commerce.service.ts:32-104`: ortam koşulu olmadan başlangıçta demo ürün, sahte provider kimlikleri ve rastgele kullanım yazımı.
- `commerce/controllers/payment.webhook.controller.ts:43-62`: provisioning hatası yutulabiliyor; abonelik yenileme/iptal dalları boş. İmza doğrulaması mevcut olması olumlu fakat lifecycle tamam değil.
- `brand/brand.service.ts:61-91`, `trust-dynamics/trust.service.ts:41-45`: bazı gerçek ölçümler yapay dağılım/geçmiş ile karışıyor.
- Frontend sosyal takvim sürükleme işlemi API çağrısı yorumdayken başarı bildiriyor: `apps/frontend/src/app/[tenant]/admin/social/scheduler/page.tsx:90-101`.
- Tenant CMS sayfa editörü statik fixture'dan okuyor: `apps/frontend/src/app/[tenant]/admin/cms/pages/[pageId]/page.tsx:83-85`.
- Strateji ve intelligence ekranlarının bazıları statik; komut merkezi grafiği gerçek agent orchestration kanıtı değil.

Kabul kuralı: başarısız, çalışmayan veya bağlanmamış işlem başarı göstermemeli; örnek veri açıkça demo olarak etiketlenmeli ve production akışından ayrılmalı.

## 5. BCC / Cortex ürün vaadi ile kod arasındaki fark

Gerçek parçalar: iş modülleri sinyal yayıyor, Neural Grid bunları alıp Cortex'e iletiyor, Cortex embedding üretip tenant etiketli hafıza yazmayı deniyor, retrieve tenant filtresi uyguluyor, Strategy gerçek AI çağrısı yapıyor. BCC tarafında ayrıca veritabanına kaydedilen tenant filtreli sinyaller ve kural tabanlı insight var. Dolayısıyla önceki rapordaki 'tamamı simülasyon' yorumu mevcut kod için fazla geniştir.

Fakat kapalı öğrenme döngüsü eksik:

1. **Başarı puanı sözleşmesi bozuk.** `apps/cortex/main.py:130-137` sonuçları `content/score/type` ile döndürüyor. `strategy/services/strategy.service.ts:55-62` ise `metadata.successScore` okuyor. Beklenen sonuca göre önceliklendirme bu sözleşmeyle gerçekleşmez.
2. **Kalıcı teslim garantisi yok.** Neural Grid reward defteri bellekte; gönderim hatası loglanıyor (`neural-grid/services/neural-grid.service.ts:30-31,80-105`). Cortex Qdrant yazma hatasını yakalayıp yine `ingested` döndürüyor (`main.py:78-101`).
3. **Otonom analiz tenant bazlı değil.** InsightEngine tek buffer tutuyor, sadece kaynak türüne göre ayırıyor, özet sayıları literal `system-wide` tenant'ına gönderiyor (`insight-engine/services/insight-engine.service.ts:11,47-86`). Bu özel akışta ham içerik sızıntısı kanıtlanmadı; karışan şey şu an toplamlar ve tenant sahipliği.
4. **Servis kimlik doğrulaması eksik.** Cortex request içindeki tenantId'yi kabul ediyor; dosyada auth kontrolü yok. Gerçek risk ağ erişilebilirliğine bağlı; deployment izolasyonu doğrulanmadı.
5. **Sinyal yolları parçalı.** BCC'nin `/bcc/emit` akışı ile `neural.signal` arasında köprü bulunamadı. Crawler `ticket.created` olayını dinlerken ticket servisi bunu `neural.signal` içindeki type olarak yayıyor.
6. **Crawler hata metni bilgiye dönüşebiliyor.** HTTP hata fallback'i normal sinyal olarak sabit güven puanıyla ilerleyebiliyor; raw HTML kısaltması gerçek kaynak değerlendirmesi değildir.

Hedef: tek sürümlü sinyal sözleşmesi; tenantId, olay/idempotency kimliği, kaynak, zaman, izin/veri sınıfı, sonuç ve başarı puanı. Kalıcı outbox/queue, retry, dead-letter, replay; NestJS–Python sözleşme testleri; kaynak gösteren tenant bazlı öneriler; aksiyon onayı ve gerçekleşen sonucun geri beslemesi.

## 6. 33 modül için dürüst durum envanteri

Tablo canlı çalışırlık sertifikası değildir. 'Envanter' işaretli alanlar ayrıca derin fonksiyon testi bekler. Shared gibi altyapı dizinleri tek başına müşteri özelliği sayılmaz.

| Modül | Gözlenen durum | Tamamlanma kanıtında öncelik |
|---|---|---|
| ai | Gerçek provider/router ve health kodu | Provider başarısı/hatası, maliyet, fallback, tenant |
| analytics | Analiz servisleri var; envanter | Metrikleri gerçek olay/veri kaynağına bağlama |
| backup | Gerçek dump/cloud kodu; kapsam riski | Platform/tenant ayrımı, restore, kalıcı depolama |
| bcc | Kalıcı sinyaller ve kurallar | Neural stream köprüsü, kaynaklı insight |
| brand | Gerçek aggregate ve yapay gösterimler karışık | Demo ayrımı, ölçüm tanımı, gerçek kanal dökümü |
| certificates | PDF/bulk/e-posta kodu | Üretim, saklama, doğrulama, gönderim E2E |
| chat | Servis/gateway geniş; yeni panel eksik | Gönderme/geçmiş, handoff, RAG ve tenant |
| cms | Geniş backend/UI; bazı editör/aksiyonlar eksik | Gerçek kaydetme/yayınlama/geri alma |
| commerce | Ürün/abonelik/provider kodu, kritik açıklar | Yetki, seed ayrımı, checkout/renew/cancel |
| crm | Tenant filtreli CRUD var | Yetkili tenant bağlamı ve kaynak dönüşümleri |
| database-import | Aktif yüksek yetkili operasyon endpoint'i | Ürün runtime'ından ayırma |
| email-marketing | Geniş gerçek iş mantığı + aktif simülasyon | Validation, otomasyon, gönderim/sonuç döngüsü |
| events | İş mantığı var; bazı metrikler yapay | Kayıt/katılım/sertifika, gerçek gelir verisi |
| faq-learning | Geniş öğrenme/review kodu; derin test bekliyor | Kaynak doğruluğu, onay, yanlış öğrenme geri alma |
| forms | CRUD/submission ve sinyal var | Yetki, spam, CRM/otomasyon/AI zinciri |
| insight-engine | Ortak buffer ve system-wide rapor | Tenant bazlı kanıt ve korumalı tetikleme |
| knowledge-sources | Ayrıştırma/arama var | Kaynak erişimi, id üzerinden tenant sınırı, RAG |
| mail | Provider/render kodu | Gerçek gönderim, hata/retry, teslim olayları |
| media | S3/upload kodu; envanter | Dosya güvenliği, sahiplik, saklama/silme |
| neural-crawler | HTTP kodu ve fallback; import/olay sorunları | URL güvenliği, gerçek extraction, olay uyumu |
| neural-grid | Gerçek event tüketimi ve forwarding | Kalıcı reward/teslim, idempotency/replay |
| notifications | API/service/gateway var | Tenant socket, gerçek otomasyon gönderimi |
| organizations | Entity/persistence temeli | Tenant/organizasyon yaşam döngüsü ve roller |
| platform-integration | Olay/kural/webhook yapısı | Gerçek aksiyonlar, onay, hata ve tekrar davranışı |
| roles | RBAC var; tüketiciler tutarsız | Tek rol/izin biçimi, negatif testler |
| settings | Tenant ayar servisleri; envanter | Secret sınırı, validation, güvenli varsayılanlar |
| shared | Ortak altyapı servisleri | Tüketici sözleşmeleri ve tutarlılık |
| social-media | Posting/scheduling kodu; comment sync stub | Gerçek provider yayın/yorum/sonuç alma |
| strategy | Gerçek retrieval + AI | Başarı puanı sözleşmesi, gerçek kullanım ölçümü |
| system-logs | API/modül; envanter | Tenant erişimi, redaksiyon, correlation |
| tickets | Geniş iş akışı; yetki/derleme sorunları | Müşteri sahipliği, SLA, mesaj, sinyal E2E |
| trust-dynamics | Heuristik + yapay tarihçe | Ölçüm temeli, belirsizlik ve gerçek zaman serisi |
| users | Kullanıcı/rol/tokenVersion var | Tenant üyeliği, davet, oturum iptali |

## 7. Dağıtım ve operasyon

- Production compose backend `9006` portunu kullanırken Traefik `3001` hedefliyor (`docker-compose.production.yml:83,93`). Health `/health`, uygulama prefix'i `/api` (`:104`, `apps/backend/src/main.ts:37`).
- İncelenen production/apps compose dosyaları Cortex/Qdrant/Ollama ve CORTEX_URL için bütünlüklü ortam tanımlamıyor. Harici servis kullanımı mümkün, fakat bu dosyalarla tam ürün tekrarlanabilir biçimde kurulamıyor.
- Migration entrypoint eski `dist/database/cli.js` yoluna bakıyor ve yoksa atlayıp başlıyor; kaynak CLI `src/core/database/cli.ts`. Temiz artifact ve boş DB ile doğrulama gerekiyor.
- Deploy workflow typecheck/test hatalarını tolere ediyor (`.github/workflows/deploy.yml:56-59,133-148`). Yeşil deployment iş akışı ürünün testlerden geçtiği anlamına gelmeyebilir.
- CI gerçek coverage yerine spec/service dosya oranını raporluyor. Gerçek instrumentation çıktısı gereklidir.
- Backend backup dizini ve MinIO dosya varsayımları production volume düzeniyle uyumsuz görünüyor; restore tatbikatı bulunmadı.
- Frontend tüm `/api` için public cache başlıkları tanımlıyor (`apps/frontend/src/middleware.ts:202-208` ve next.config.ts). Kişiye/tenant'a özel yanıtlar için politika ve gerçek response doğrulaması gerekiyor; cache üzerinden canlı sızıntı kanıtlanmış değil.

## 8. Tam ürün için önerilen hedefler

### G0 — Sözleşme ve doğrulama tabanı

Tüm modüller için kullanıcı rolleri, vaat edilen senaryolar, kaynak/çıktılar, tenant sınırı, sinyal üretimi/tüketimi, provider bağımlılıkları ve kabul kriterleri yazılmalı. Demo ile production davranışı ayrılmalı. Tek runtime/paket yöneticisi/workspace düzeni kurulmalı; üretim TS, test keşfi ve tekrarlanabilir kurulum temiz olmalı.

Çıkış: temiz kurulum + backend/frontend derleme + güvenilir test çalıştırma; hatalar kanıtlarıyla sıfır veya açıkça sınıflanmış release dışı araç kapsamına alınmış.

### G1 — Güvenlik ve veri temeli

Auth/tenant/rol sırası, ticket sahipliği, commerce izinleri, backup sınırı, Cortex servis auth ve crawler URL kontrolleri. Migration, secret doğrulaması, audit ve veri sahipliği.

Çıkış: iki ayrı tenant ve platform yöneticisiyle HTTP/WebSocket/işçi/RAG negatif testleri; yetkisiz erişimlerin reddi.

### G2 — Ortak olay, hafıza ve aksiyon altyapısı

Neural Grid, BCC, Cortex, Strategy ve platform-integration için tek sözleşme; kalıcı teslim, replay ve gerçek aksiyon yürütme. Başarısızlıkların dürüst gösterimi.

Çıkış: kaynağı bilinen olayın tenant hafızasına yazılması, retrieval ve öneride kullanılması; servis kesintisi sonrası kayıpsız/idempotent toparlanma.

### G3 — Tüm iş modüllerinin gerçek akışları

Geliştirme sırası bağımlılığa göre: kullanıcı/organizasyon/roller/ayarlar → CRM/forms/media/CMS → tickets/chat/mail/FAQ/knowledge → events/certificates → email/social/automation → commerce kullanım/abonelik bağları → analytics/brand/trust raporları. Billing limitlerinin ihtiyaç duyulan altyapısı daha erken G1/G2 ile yapılır.

Her modül için gerçek okuma-yazma, izin, boş/hatalı durum, sinyal, dış servis sonucu ve E2E kanıtı gerekir. Bu sıra modülleri kapsamdan çıkarmaz; entegre tamamlanmayı yönetir.

### G4 — BCC bütünleşik kabul

Referans senaryo: form/kampanya → CRM müşteri → destek/alışveriş/etkileşim sonucu → ölçülen outcome → kalıcı hafıza → kaynaklı öneri → yetkili onay → gerçek email/social/diğer aksiyon → sonuç ölçümü → sonraki öneride geri besleme.

En az iki tenant, başarısız provider, tekrarlanan webhook, yeniden başlatma ve izin iptali senaryoları dahil. Öğrenme iddiası yalnız metin üretilmesiyle değil, ölçülebilir kalite değerlendirmesiyle doğrulanmalı.

### G5 — Tam ürün yayın kabulü

Tam stack kurulumu, staging E2E, kapasite/maliyet ölçümü, izleme/uyarılar, yedekten geri dönüş ve rollback. Yerel AI kapasitesi ölçülmeden tek düşük kaynaklı VPS'e bütün bileşenleri sığdırma varsayımı yapılmamalı.

Çıkış: vaat edilen tüm modüllerin kabul senaryoları geçer; kritik/yüksek güvenlik engeli kalmaz; release CI başarısız testi gizlemez; provider ve restore kanıtları vardır. Yayın ayrıca kullanıcı kararıdır.

## 9. 'Tamamlandı' tanımı

Bir modül ancak gerçek iş akışı, kalıcı veri, rol/tenant izolasyonu, UI/API tutarlılığı, BCC bağlantısı (gerekiyorsa), hata/retry davranışı, ölçülebilir test ve operasyon kanıtı birlikte olduğunda tamamlanır. Coverage hedefi anlamlı unit/integration/E2E testleriyle ölçülür; dosya sayısıyla hesaplanmaz. Her modülün kendi yönetim ekranı olması zorunlu değildir; altyapı modülleri tüketicilerindeki senaryolarla doğrulanır.

Bu ölçütler ürünün bütünlüğünü korur ve 'yüzde 100' ifadesini sınanabilir hâle getirir. Zaman/maliyet tahmini, G0 kabul matrisi ve G1 güvenlik kapsamı çıkarılmadan güvenilir olmaz.

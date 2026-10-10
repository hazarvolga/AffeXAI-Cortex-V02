# AffeXAI Cortex — G1 güvenlik çalışması

Tarih: 07.10.2026. Yerel geliştirme; yayın kabulü değildir.

## Kararlar ve uygulanmış sınırlar

- HTTP tenant bağlamı middleware tarafından imzasız JWT/path/query/cookie üzerinden türetilemez. Açık `x-tenant-id` yalnız seçicidir. Korumalı istekte imza, token amacı/sürümü ve güncel aktif hesap doğrulandıktan sonra tenant eşleşmesi yapılır. Bağlam handler'ın gerçek Observable subscription'ında kurulur.
- Tenant yöneticisi platform yöneticisi değildir. Sunucu `PLATFORM_ADMIN_USER_IDS` UUID allowlist'i yalnız güncel doğrulanmış hesaba uygulanır; tenant rol adı veya `system.admin` yetkisi platform yetkisi vermez. Boş config kimseye platform yetkisi vermez. Bu ilk provisioning mekanizmasıdır; audit edilmiş platform tenant değiştirme arayüzü tamamlanmış değildir.
- Public kayıt yalnız kimlik/iletişim alanları ve newsletter tercihleri kabul eder. Role ID, aktiflik, tenant veya platform yetkisi istemciden alınmaz.
- Giriş ve e-posta varlık sorgusu açık tenant bağlamı gerektirir. Aynı e-posta başka tenant'ta bulunabilir; global e-posta aramasıyla oturum açılamaz.
- `JWT_SECRET` eksik/kısa ise uygulama başlangıcı başarısız olur. Örnek env secret sağlamaz; ortam başına rastgele üretilmelidir. Statik fallback kaldırılır.
- Keyfi SQL HTTP import yüzeyi normal AppModule'den ve bakım modülünün controller kaydından çıkarıldı. Servis kodunun bulunması HTTP erişim izni anlamına gelmez. İzole bakım/import CLI ve rollback kabulü henüz tamamlanmadı.

## Doğrulama kaydı

- Gerçek Nest HTTP tenant middleware/guard/interceptor zinciri: 14 test geçti. Yanlış tenant, admin rol biçimleri, token iptali/türü/imzası/aktiflik, eşzamanlı A/B async istekleri ve public bağlam sınandı. Değişen beş dosya için V8 instrumentation: statement/line/function %100, branch %91.48. Bu ürün geneli coverage değildir.
- Kayıt DTO/privilege allowlist, JWT config ve platform ID politikası: 15 test geçti.
- Tenant giriş/e-posta sınırı: önce 5 başarısız test, düzeltme sonrası 5/5 geçti.
- JWT config factory ve maintenance HTTP kayıt sınırı: 5 test geçti. Root paketindeki 25 test birlikte geçti. Normal ts-jest taraması bellek sınırında durduğundan bu tekrar isolated transpilation ile çalıştırıldı; ayrı backend üretim typecheck exit 0 ile doğrulandı.
- Yedekleme gerçek HTTP yetki sınırı: 8 test geçti; tenant admin ve taklit platform bayrakları reddedildi, doğrulanmış platform hesabı kabul edildi.
- Rol, kullanıcı CRUD ve refresh/verification lifecycle sonuçları devam eden entegrasyon sonrası eklenecek.

Loglar yerel `/tmp/affexai-g1-*` konumundadır. Bunlar geçicidir; bu belge doğrulama kapsamını saklar. Testlerde harici e-posta/provider çağrısı ve canlı veri işlemi yapılmaz. Gerçek SQL atomikliği, socket/queue/Cortex/crawler güvenliği ve modüllerin tam kabul senaryoları ayrıca doğrulanmalıdır.


## Oturum ve kullanıcı verisi

Refresh token'ları amaç, oturum sürümü ve rastgele nonce taşır. Yenileme güncel aktif kullanıcı ve veritabanındaki tek geçerli token ile eşleşir; karşılaştırmalı atomik güncellemede yalnız bir yarışmacı kazanabilir. Şifre değişikliği sürümü artırır ve refresh bilgisini temizler. E-posta doğrulaması ayrı `verify_` amaç belirteciyle tek kullanımlı tüketilir; askıya alınmış hesabı tekrar aktifleştirmez.

Mevcut eski refresh token'ları yeni sözleşmeye uymuyorsa yeniden giriş gerekir. Eski amaçsız doğrulama/reset linkleri otomatik giriş için kullanılamaz. Hiçbir canlı oturum veya veritabanına migration uygulanmadı.

User entity serialization'ında parola, refresh ve e-posta doğrulama token'ları ile süre alanları dışlanır; iç içe kullanıcı ilişkileri için regresyon önce başarısız, düzeltme sonrası başarılı oldu. Başarısız e-posta sağlayıcı sonucu artık gönderilmiş gibi sunulmaz. Kayıt sonrası e-posta başarısızlığında kalıcı hesap için tekrar gönderme/kurtarma UX'i hâlâ tamamlanmalıdır.

## G1-B rol / kullanıcı yazma sınırı ve gerçek PostgreSQL CAS kanıtı

- `role-boundaries.spec.ts` ve `user-write-boundaries.spec.ts`: **51/51 geçti** (29 rol, 22 kullanıcı testi). İlk rol sınırı RED: 17 başarısız / 1 başarılı; ilk kullanıcı yazma sınırı RED: 14 başarısız / 1 başarılı. Sonradan rol-only güncelleme ve admin parola iptali için 2 RED; bağımsız rol atama transaction sınırı için 1 RED üretildi ve düzeltildi.
- Tenant rol API'leri ayrılmış `super_admin`/`superadmin` adlarını ve `system.admin` atamasını reddeder. Rol/izin guard'ları yalnız sunucunun doğruladığı `isPlatformAdmin` işaretine platform yetkisi verir. Tenant yöneticisinin olağan rol yönetimi korunur.
- Rol atama/kaldırma; açık tenant, hedef kullanıcı ve tüm rollerin tenant eşleşmesini yazmadan önce doğrular. Rol değişiklikleri ve token sürümü artırımı aynı transaction içindedir. Yeni kullanıcı kaydı bütün rol referanslarını ilk save öncesi doğrular; kullanıcı ve rol bağlantıları birlikte commit/rollback olur. Oluşturulan kullanıcı işlem içinde tekrar okunur, eski token sürümü döndürülmez.
- Config ile belirlenen platform hesabının tenant kullanıcı CRUD üzerinden değiştirilmesi/silinmesi doğrulanmış platform aktörü olmadan reddedilir. Dahili auth güncellemesi ayrı, alan allowlist'li bir servis yoludur. Rol-only güncelleme boş SQL update üretmez ve gelen DTO'yu değiştirmez; admin parola değişimi de token sürümünü artırıp refresh oturumunu temizler.
- Bağımsız source review: yeni platform/tenant bypass bulunmadı. Son backend `tsc -p tsconfig.build.json --noEmit --incremental false` exit 0; diff whitespace kontrolü temiz.

Kaynak regresyon komutu (repo kökünden):

```sh
cd apps/backend
node node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/modules/roles/role-boundaries.spec.ts src/modules/users/user-write-boundaries.spec.ts
```

Gerçek PostgreSQL doğrulaması yalnız önceden yetkilendirilmiş `affexai-g0-isolated` projesinin tmpfs `postgres-test` servisine karşı yapıldı. Uygulama veya Nest başlatılmadı. `auth-persistence.ts` kaynak fonksiyonları TypeScript ile geçici dizine transpile edilip mevcut `affexai-cortex-backend:g0-local` imajında node entrypoint ile çalıştırıldı. Her çalıştırma yeni `g1_cas_<timestamp>` şeması oluşturdu ve `finally` içinde sildi; önceden var olan test şeması veya uygulama verisi kullanılmadı.

Tekrarlanabilir runner (repo kökünden):

```sh
sh apps/backend/scripts/test-auth-persistence-db.sh
```

Runner, doğru izolasyon projesi ve zaten çalışan PostgreSQL yoksa durur; servis başlatmaz. SQL/TypeORM assertion'ları `apps/backend/scripts/test-auth-persistence-db.cjs` içindedir. Üçüncü tekrar da exit 0:

- Eşzamanlı iki refresh girişiminden yalnız biri kazanır.
- Yanlış tenant, eski sürüm/token, süresi geçmiş refresh ve parola değişimiyle iptal edilen token reddedilir.
- Parola hash'i tekrar hash'lenmeden kaydedilir; gerçek PostgreSQL'de camelCase `"tokenVersion"` artırılır, refresh token/expiry NULL olur.
- Doğrulama tokenı amaç bağımlı, süreli ve tek kullanımlıdır; suspended hesap aktifleştirilmez.
- Soft-delete edilmiş hesapta refresh/parola/doğrulama CAS yazımlarının üçü de reddedilir.

Bu kanıt, gerçek SQL atomikliğini yalnız bu üç auth CAS işlemi için doğrular. Tam üretim User entity şeması, e-posta teslimatı, bütün kullanıcı/rol transaction akışlarının DB entegrasyonu ve ürünün uçtan uca kabulü yerine geçmez. Provider çağrısı, canlı DB, yayın, push veya deploy yapılmadı.

## Birleşik backend kontrolü

Son kaynak durumunda 11 paket / **136 test** birlikte geçti (exit 0): HTTP tenant14, auth boundaries15, tenant login5, JWT config4, token lifecycle33, mevcut auth service4, import boundary1, backup HTTP8, role boundaries29, user writes22, user serialization1. Komut `pnpm --dir apps/backend exec jest --runInBand --runTestsByPath <bu 11 spec> --globals '{"ts-jest":{"isolatedModules":true}}'`; log `/tmp/affexai-g1-combined-tests.log`. Test transpilation'ı bellek kontrollü tutuldu; ayrı `tsc --noEmit -p tsconfig.build.json` exit 0 (log `/tmp/affexai-g1-final-types.log`). `pnpm install --frozen-lockfile --offline --ignore-scripts` exit 0, lock/manifests eşleşiyor. Bu kontrol genel lint/ürün coverage kapısını kapatmaz.

## Frontend: tenant seçimi ve kimlik taşıma doğrulaması

Giriş/kayıt ekranlarında çalışma alanı kodu açıkça istenir. `/[tenant]/login` ve `/[tenant]/signup` adresleri kodu doldurur; normal uygulama yolları tenant diye yorumlanmaz. Seçim yalnız `x-tenant-id` başlığında taşınır; kullanıcıya tenant yetkisi vermez. Login BFF başlığı doğrular ve iletir, body içindeki tenant alanını yetki kaynağı yapmaz. Signup format/aynı tenant email kontrolünü kullanır; halka açık kayıt, yetki isteyen email-marketing doğrulayıcısına bağlı değildir. Eski async kontrol sonuçları tenant/email değişince uygulanmaz.

Platform arayüzü ve giriş yönlendirmesi artık sunucudan gelen kesin `isPlatformAdmin === true` değerini kullanır; düzenlenebilir role adları yetki göstergesi değildir. Public register istemci tipindeki roleId kaldırıldı. Login BFF token yanıtı loglamaz; HTTP tanı logları body/response/error payloadlarını kaydetmez, auth URL tokenlarını ve query'leri gizler.

```sh
TSX_TSCONFIG_PATH=../frontend/tsconfig.json pnpm --filter affexai-backend exec tsx --test ../frontend/src/lib/auth/tenant-selection.test.ts ../frontend/src/lib/auth/tenant-transport.test.ts ../frontend/src/lib/auth/platform-authority.test.ts ../frontend/src/lib/auth/http-logging.test.ts
pnpm --filter nextn exec tsc --noEmit --incremental false
```

Sonuç: **7/7 sözleşme testi geçti**, tam frontend TypeScript kontrolü **exit 0**. Tenant helper ve platform flag testleri önce RED; log testi önce gerçek sentinel sızıntısını yakaladı, düzeltmeden sonra GREEN. Loglar: `/tmp/affexai-g1-tenant-ui-contracts.log`, `/tmp/affexai-g1-tenant-ui-tsc-final.log`, `/tmp/affexai-g1-http-log-red.log`. Bağımsız kod/güvenlik incelemesi yapıldı.

Gerçek UI, native Firefox/CUA üzerinden görüldü: `http://127.0.0.1:9003/login` çalışma alanı alanını gösteriyor; `http://127.0.0.1:9003/xyz-company/signup` alanı `xyz-company` ile dolduruyor. Ekran görüntüleri araç çıktısında incelendi; ayrıca dışarı aktarılmadı. Önceki aynı-proje preview süreci kapatılıp `pnpm --filter nextn exec next dev --port 9003 --hostname 127.0.0.1` başlatıldı ve kullanıcı için açık bırakıldı; `/tmp/affexai-g1-tenant-preview.log` güncel kaynak önizlemesine aittir.

Tam backend uygulamasına karşı giriş/kayıt E2E akışı çalıştırılmadı; bu kanıt taşıma sözleşmeleri, tip kontrolü ve gerçek render ile sınırlıdır. Hesap oluşturulmadı, sağlayıcı veya canlı sistem çağrısı yapılmadı.

## G1-A ve auth oturum yaşam döngüsü: son kapsamlı yerel ölçüm

HTTP tenant sınırı için `tenant-http.spec.ts` **14/14 geçti**. İlk RED ölçümü 8 başarısız / 2 başarılıydı. Gerçek Nest middleware → controller guard → interceptor sırası, doğrulanmış güncel kullanıcı tenant'ı, admin dahil yabancı tenant reddi, paralel async A/B izolasyonu ve hata sonrası bağlam temizliği denendi. Değişen beş runtime dosyası (`JwtAuthGuard`, `TenantGuard`, tenant middleware/interceptor/service) için native V8 coverage: **%100 statement/line/function, %91,48 branch**. Log: `/tmp/affexai-g1-tenant-coverage-v8.log`.

AuthService oturum yaşam döngüsü için ilk RED 15 başarısız / 2 başarılı; mail sağlayıcısının başarısız sonuç döndürmesi ve HTML kaçışı için ayrı RED 3 başarısız / 22 başarılı üretildi. Son ölçüm **42/42 test**: yaşam döngüsü 33, tenant login 5, mevcut auth service 4. `auth.service.ts` kapsamı **%100 statement/line/function, %85,71 branch**; %80 eşiği azaltılmadı.

```sh
NODE_OPTIONS=--max-old-space-size=4096 pnpm --dir apps/backend exec jest --runInBand --runTestsByPath src/core/auth/auth-token-lifecycle.spec.ts src/core/auth/auth-tenant-login.spec.ts src/core/auth/auth.service.spec.ts --silent --coverage --coverageProvider=v8 --coverageDirectory=/tmp/affexai-g1-auth-coverage --collectCoverageFrom=src/core/auth/auth.service.ts --globals='{"ts-jest":{"isolatedModules":true}}'
NODE_OPTIONS=--max-old-space-size=4096 pnpm --dir apps/backend exec tsc -p tsconfig.build.json --noEmit --incremental false --pretty false
```

İki komut da exit 0. Test transpilation'ı büyük ts-jest tip grafiğinin bellek taşmasını önlemek için izole edildi; üretim TypeScript kontrolü ayrı ve hataları bastırmadan çalıştırıldı. Loglar `/tmp/affexai-g1-auth-coverage-final.log` ve `/tmp/affexai-g1-auth-types-final.log`. Bu dar coverage ölçümü bütün backend veya 33 modülün coverage sonucu değildir.

Refresh token'ları artık amaç, tokenVersion ve rastgele jti içerir; aktif hesap, kayıtlı token ve süre kontrolünden sonra atomik CAS ile döner. Parola değişimi sürümü artırıp refresh oturumunu siler. Doğrulama bağlantısı yalnız `verify_` amaç önekli, süreli, aktif ve doğrulanmamış hesaba ait token'ı atomik olarak tüketir; askıya alınmış hesabı açmaz. Controller doğrulama sonrası oturumu aynı sürümlü token üreticisinden alır. Login ve `/auth/me`, platform yetkisini yalnız sunucu tarafından belirlenen boolean olarak döndürür.

Mail başarısı yalnız `SendMailResult.success === true` ile kabul edilir; exception, false veya eksik sonuç 503 üretir. İsim/link HTML bağlamında kaçırılır, bağlantı http(s) ile sınırlandırılır, auth e-postası AffeXAI Cortex adını kullanır. Sağlayıcı çağrıları testlerde mock'tur. Bağımsız backend kaynak/güvenlik incelemesi yeni kritik/yüksek auth veya tenant bypass bulmadı; frontend selector/taşıma ve kesin platform flag tüketimi ayrıca incelendi.

Uyumluluk ve kalan iş: eski sürüm/jti içermeyen refresh token için yeniden giriş gerekir; ham eski doğrulama/reset token'ları email doğrulama üzerinden oturum açamaz ve yeniden üretilmelidir. Mail hatasında hesap kaydı geri alınmaz; tekrar gönderme/kurtarma UX'i henüz yoktur. Public tenant bağlamı yalnız açık başlıktan gelir; eksik tenant global sorguya çevrilmez. Tam login/signup/provider E2E, forgot/reset tamamlanması ve tüm modüllerin kabul senaryoları bu ölçümle kapanmış sayılmaz.

## G1-E: URL alma sınırı ve başarısız yenilemede içerik korunması

Chat URL işleme, knowledge URL işleme/erişilebilirlik kontrolü ve neural crawler ortak `core/network/public-url-fetcher.ts` üzerinden gider. HTTP(S), kimlik bilgisi içermeyen URL ve standart 80/443 portları kabul edilir. DNS sonucundaki tüm adresler public-address politikasından geçer; açılan soketin lookup cevabı kontrol edilen adrese sabitlenir. Her yönlendirmede URL/DNS yeniden doğrulanır; özel/ayrılmış IPv4, IPv6 ve geçiş adresleri reddedilir. Ayrı agentsız socket, toplam süre, yönlendirme, sıkıştırılmış ve açılmış boyut sınırları uygulanır. HTTP hata sayfası bilgi kaynağı olarak döndürülmez.

Başarısız chat refresh ve forceRefresh artık eski kaydı silmez veya FAILED ile kullanılmaz hale getirmez. Tekil/batch controller önce-cache-sil davranışı kaldırıldı. Knowledge kaynağında önceki ACTIVE içerik kopyası başarılı extraction/persistence tamamlanana kadar korunur; yenileme başarısızsa hata çağırana görünür. Neural crawler hata halinde RAW_FALLBACK metninden sahte bilgi sinyali üretmez. Bu akışlarda vektör tablosu değiştirilmedi.

Yerel TDD: ağ sınırı önce eksik implementation nedeniyle RED; consumer regression önce **9 başarısız/2 başarılı**, forceRefresh **1 başarısız/11 başarılı**, hata görünürlüğü **1 başarısız/11 başarılı**. Son ortak koşum **56/56 başarılı**. Ortak fetcher coverage: statement **%95,37**, branch **%86,30**, function **%90,47**, line **%95,19**; bu tüm ingestion modüllerinin veya backend'in coverage'ı değildir. Kontrol edilen loopback HTTP fixture'a yalnız test transport'u yönlendirildi; üretimde local adres istisnası veya env bypass eklenmedi. Dış sitelere veya gerçek sağlayıcıya istek yapılmadı.

```sh
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/core/network/public-url-fetcher.spec.ts src/core/network/url-ingestion-boundaries.spec.ts --coverage --collectCoverageFrom=src/core/network/public-url-fetcher.ts --coverageDirectory=/tmp/affexai-g1-url-coverage --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true}}]}}'
pnpm --filter affexai-backend exec tsc --noEmit --project tsconfig.build.json
pnpm --filter affexai-backend exec eslint src/core/network/public-url-fetcher.ts
```

Loglar `/tmp/affexai-g1-ingestion-green.log`, `/tmp/affexai-g1-url-tsc.log`, `/tmp/affexai-g1-url-lint.log`. Bağımsız güvenlik incelemesi socket/DNS/yönlendirme sınırında doğrudan bypass bulmadı; yenileme hatasının çağırana görünmesi bulgusu regresyon testiyle düzeltildi.

**Açık kabul:** tarayıcıyla dinamik sayfa rendering tamamlanmış değildir. Sınırsız Puppeteer gezinmesi kaldırıldı; okunabilir statik içerik bulunmazsa açık hata verilir. Dinamik rendering için izole browser + denetimli egress proxy (alt kaynaklar, WebSocket, yönlendirmeler ve DNS dahil) ve kendi kabul testleri gerekir. Siteye özel parser kalitesi ve gerçek sağlayıcı/vectordb E2E bu yerel kanıtla kapanmaz.

## G1-C: Cortex bellek sınırı — yerel doğrulama

Python servisi yalnız tenant kapsamlı vektör belleğini yönetir. İmzalı POST sözleşmesi tam gövde özeti, HTTP yöntemi, yol, tenant, zaman ve nonce değerlerini HMAC-SHA256 ile bağlar. Tenant uyuşmazlığı, tekrar, geçersiz zaman/imza reddedilir; dolu nonce belleği canlı kayıt silmek yerine 503 verir. Bu koruma tek süreç içindir; çoklu worker/replica ve yeniden başlatma dayanıklılığı henüz doğrulanmış değildir.

Import aşamasında model indirme veya ağ bağlantısı yoktur. Açıkça sağlanan yerel embedding modeli ilk istekte `local_files_only` ile yüklenir; başarısız/eksik depolama işlemi başarıya çevrilmez. `/health` yalnız canlılık bildirir. Python `/strategy/insight` yetkilendirmeden sonra 410 `use-tenant-strategy-api` döndürür. Strateji üretimi Nest içindeki tenant ayarlı sağlayıcı üzerinden sürer; ortak Ollama modeli zorlanmaz. Mevcut LOCAL sağlayıcının tenant özel uç nokta sözleşmesi tamamlanmadığından bu yol açık hata verir.

Doğrulama: Python **45/45**, çalışma zamanı dosyaları kapsamı `main.py %95`, `memory_runtime.py %98`, `service_auth.py %96` (branch dahil pytest-cov ölçümü). Testler sahte embedding/depolama ve yerel HTTP istemcisi kullanır. Nest **20/20**; imzalı taşıma + strateji kapsamı **%97,46 satır / %81,42 dal**; ayrı üretim TypeScript kontrolü exit 0. Ortak sabit HMAC örneği Node ve Python tarafından aynı şekilde doğrulandı. Kanıt: `/tmp/affexai-cortex-coverage.log`, `/tmp/affexai-cortex-nest-coverage.log`, `/tmp/affexai-cortex-tsc.log`. Sistem Python 3.9 LibreSSL uyarısı verdi; gerçek TLS/provider kabul testi yapılmadı.

Açık sınırlar: gerçek model/Qdrant kabulü, model kimliği sürümleme/migrasyonu, dayanıklı olay teslimi ve çoklu süreç replay deposu. NeuralGrid iş olayını alır ve belleğe en iyi çaba ile iletir; başarısızlık günlüğü kalıcı kaydın oluşmadığını açıkça belirtir. Hiçbir canlı sağlayıcı/model indirmesi veya yayın yapılmadı. Bağımsız Cortex incelemesi cortex_ops_audit tarafından tamamlandı; yeni yüksek/kritik yetkilendirme bulgusu yok. İncelemede bulunan reward metadata taşıma eksikliği test-first giderildi; retrieval yalnız sonlu sayısal successScore döndürür. Aynı boyutlu farklı embedding modeli karıştırma riski açık model-kimliği/migrasyon kapısı olarak devam eder.

### G1-D — Canlı bağlantı ve bildirim alıcısı sınırları

- Chat, ticket ve notification socket bağlantıları yalnız imzalı `type=access` JWT ile açılır. Güncel kullanıcı aktifliği, silinme durumu, tokenVersion ve gerçek tenant tekrar okunur; handshake tenant yalnız eşleşme kontrolüdür.
- Her korumalı socket eylemi yeniden doğrulanır; chat/ticket oda erişimi aynı tenant ve kaynak sahibi/atanmış kullanıcı veya güncel destek yetkisi gerektirir. Oda kimlikleri JSON tuple ile çakışmadan ayrılır.
- Korumalı sunucu yayınları alıcı başına sıralı gönderim kuyruğunda tekrar token/kimlik ve kaynak erişimi kontrol eder. Pasif bağlantıda token süresi dolması, credential revocation ve yönetici/destek rolünün kaldırılması sonraki yayını engeller. Chat parçalarının sırası korunur.
- Notification HTTP list/detail/read/read-all oturumdaki alıcıyla sınırlıdır. Create yalnız admin, aynı tenant içindeki açık alıcı ve doğrulanmış içerik içindir. Tenant geneli yayın ayrı admin socket eylemidir.
- Frontend socket URL/namespace mevcut API konfigürasyonundan, token mevcut tokenStorage'dan her bağlantı/yeniden bağlantıda okunur; sabit admin/default tenant kaldırıldı.
- RED: bildirim HTTP 5 başarısız; pasif socket bildirim 3 başarısız (önceki5 başarılı). GREEN: aşağıdaki birleşik24 gerçek loopback HTTP/Socket.IO testi başarılı; frontend transport5 başarılı. Backend ve frontend TypeScript denetimleri başarılı. Model/provider, Redis veya uygulama veritabanı çağrısı yok; kimlik/kaynak repository'leri fixture, gerçek Nest taşıması ve imzalı JWT kullanıldı.
- Bağımsız socket kaynak incelemesi: g0_plan, yeni kritik/yüksek bulgu yok. Sınır: yayın helper'ı mevcut tek proses Socket.IO kayıtlarını kullanır; dağıtık adapter/multi-instance fanout bu doğrulamanın kapsamında değildir. Her stream parçasındaki kimlik/kaynak sorgusunun yükü performans kabul testlerinde ölçülmelidir.

Tekrarlanabilir backend komutu (repo kökünden):

```sh
pnpm --dir apps/backend exec jest --runInBand --runTestsByPath src/core/auth/socket/socket-rooms-security.spec.ts src/modules/notifications/notifications-http-security.spec.ts src/modules/notifications/notifications-security.spec.ts
pnpm --dir apps/backend exec tsc --noEmit -p tsconfig.build.json
```

Frontend transport testi mevcut backend ts-jest ile, ek bağımlılık kurulmadan çalıştırılır:

```sh
node apps/backend/node_modules/jest/bin/jest.js --config '{"rootDir":"apps/frontend","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["<rootDir>/../backend/node_modules/ts-jest", {"tsconfig":{"module":"commonjs","jsx":"react-jsx"}}]}}' --runInBand --runTestsByPath apps/frontend/src/lib/auth/socket-transport.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false -p apps/frontend/tsconfig.json
```

## E-posta alıcı ilişkileri ve tenant-email şema sınırı

`GroupService`/`SegmentService` artık çağıranın açık tenant parametresi ile doğrulanmış `TenantService` bağlamını karşılaştırır; yabancı tenant override reddedilir. Create/update girdilerinde yalnız DTO'nun düzenlenebilir alanları kabul edilir; `id`, `tenantId`, token ve diğer kimlik alanları servis seviyesinde de değiştirilemez. Subscriber create/update, grup ve segment ID'lerinin tamamını aynı tenant içinde sorgular ve yazmadan önce doğrular. Eksik tenant ile suppression kontrolü artık fail-closed hata verir. Grup/segment alanları 1000 elemanla sınırlandırılmış string dizileridir.

İlişki regresyonu önce **9/9 başarısız**, düzeltme sonrası **9/9 başarılı**. Entity/aktif migration kaydı için önce **2/2 başarısız**, sonra başarılı. Son birleşik alıcı/HTTP/schema/discovery koşumu **37/37 başarılı**; bu sayı root ajanının genişlettiği HTTP sınır testlerini de içerir. Üretim TypeScript kontrolü exit 0. Loglar: `/tmp/affexai-g1-recipient-red.log`, `/tmp/affexai-g1-recipient-green.log`, `/tmp/affexai-g1-recipient-tsc.log`.

`SubscriberTenantEmailUnique1791374400000` migration'ı global email unique kısıtını `(tenant_id,email)` unique ile değiştirir. Legacy null-tenant satırlarının kendi aralarındaki email tekilliği partial unique index ile korunur; satır silinmez, başka tenant'a atanmaz. Down migration, aynı email farklı tenant'larda varsa veri kaybıyla birleştirmek yerine durur. Aktif katalog/CI beklenen tarihçe **6 migration** olarak güncellendi; daha eski G0 bölümündeki beşli sonuç o zamanki snapshot'a aittir.

Gerçek PostgreSQL kabulü yalnız `affexai-g0-isolated-postgres-test-1` üzerinde yapıldı; compose project etiketi `affexai-g0-isolated`, tmpfs veri dizini ve çalışan durum doğrulanır. `.env` okunmaz; bilinen disposable test kimliği kullanılır. Altı canonical migration uygulanmış, ikinci çalıştırmada **0** pending migration kalmıştır. Gerçek DB: aynı email iki tenant'ta kabul; aynı tenant veya legacy null tenant içinde duplicate **23505**; güvensiz rollback reddi doğrulandı. Aynı fixture gerçek `SubscriberService` + TypeORM repository ile yerel grup/segment kabulünü, yabancı grup/segment create ve update reddini, tenant alanı enjeksiyon reddini ve eski ilişkinin korunmasını da denedi. Test verileri transaction rollback ile temizlenir; dış mail/validasyon sağlayıcısı çağrılmaz.

```sh
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/modules/email-marketing/subscriber-tenant-unique.spec.ts src/modules/email-marketing/recipient-integrity.spec.ts src/modules/email-marketing/email-boundaries.http.spec.ts src/core/database/migration-discovery.spec.ts --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.[tj]sx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true,"allowJs":true}}]},"transformIgnorePatterns":["node_modules/(?!(?:\\.pnpm/@nestjs\\+mapped-types|@nestjs/mapped-types))"]}'
pnpm --filter affexai-backend exec tsc --noEmit --project tsconfig.build.json
sh apps/backend/scripts/test-subscriber-tenant-db.sh
```

DB kanıtı `/tmp/affexai-g1-subscriber-db.log`; harness `apps/backend/scripts/test-subscriber-tenant-db.{sh,cjs}`. Servis ID kontrolü JSON dizi alanlarını ilişkisel foreign key'e dönüştürmez; başka veri yollarının ve grup silinmesi sonrası dangling relation davranışının tam kabulü ayrı kalır. Production migration veya deploy yapılmadı. Mevcut schema değişikliğinin canlı veri ön kontrolü ve rollback kararı yayın aşamasında ayrıca gerekir.

## G1-F: halka açık bülten onayı ve tercihler

`OptInOutService` varsayılan tenant geri dönüşünü kaldırır. Onay bağlantısı, mevcut token kolonunda saklanan sürüm/amaç/tenant/son-kullanım/rastgele değerinden oluşur; veritabanındaki tam değer eşleşmesi ve koşullu atomik güncelleme gerekir. Onay süresi 24 saat, abonelikten çıkış süresi 90 gündür. Eski UUID bağlantıları reddedilir; yeni onay istenir, pazarlama gönderiminden önce `ensureUnsubscribeToken` uygun kayıt için eski/eksik tokenı CAS ile yeniler. Yarışın kaybedeni kazananın tokenını yeniden okur.

Onay ve abonelikten çıkış API'ları artık **POST** gerektirir; GET tarayıcı/tarama isteği durumu değiştirmez. Yeniden abonelik isteği tek başına izinleri açmaz. BOUNCED/COMPLAINED durumları halka açık onayla yeniden etkinleştirilmez; eşzamanlı durum değişiklikleri CAS koşuluyla korunur. Mevcut aboneyi güncelleyen onay başlatma ve tercih kaydı tam entity kaydetmez; yaşam döngüsü tokenı/durumu eski bir kopyayla geri getirilemez. Aynı anda yeni kayıt girişimindeki unique ihlali hesap varlığını açığa çıkaran yanıt üretmez.

Tercih okuma/yazma ve e-posta uygunluğu sorguları doğrulanmış oturumdaki e-posta ile sınırlıdır. Yanıt tokenları veya başka abonenin bilgilerini içermez. Tekrar kayıt için aynı genel alındı yanıtı kullanılır; SMTP başarılı olmadan “gönderildi/yeniden abone oldunuz” denmez. Teslimat başarısızlığında kayıt onaysız kalır; kullanıcı yeniden talep edebilir. Arka planda dayanıklı teslimat/retry kuyruğu ve teslimat durum paneli henüz bu dilimin parçası değildir.

Frontend `/preferences`, `/resubscribe`, `/confirm-subscription`, `/unsubscribe` güvenli sözleşmeye uyar. Çalışma alanı kodu istenir; tercihler giriş gerektirir; token işlemleri açık düğmeyle başlar ve StrictMode effect tekrarına dayanmaz. Eski tercihler ekranındaki backend'e hiç kaydedilmeyen kategori anahtarları kaldırıldı; gerçek iki tercih alanı gösterilir. Yerel Firefox `localhost:9003` üzerinde dört ekranın gerçek render durumu incelendi; onaysız/girişsiz sınırlar görüldü. Gerçek bir e-posta gönderilmedi ve geçerli tokenla canlı kayıt değiştirilmedi.

Kanıt: **36/36** backend birim + gerçek Nest HTTP testi, **%99,37 satır / %84,82 dal / %90 fonksiyon** (`/tmp/affexai-g1-consent-coverage.log`). Yarış ve suppression senaryolarında önce RED kaydedildi (`/tmp/affexai-g1-consent-race-red.log`, `/tmp/affexai-g1-consent-suppression-red.log`). Backend üretim TypeScript ve frontend TypeScript exit 0. Bağımsız son kaynak incelemesi cortex_ops_audit tarafından tamamlandı; yeni yüksek/kritik bulgu bulunmadı. SMTP/provider ve gerçek kullanıcı oturumu üzerinden uçtan uca teslimat kabulü bu sayılardan çıkarılamaz.

## G1-G: herkese açık medya yükleme sınırı

Medya yüklemede SVG/HTML içeriği herkese açık depoya kabul edilmez. PNG/JPEG/GIF/WebP dosyalarında boyut, uzantı, MIME ve ikili imza/temel dosya sonu uyumu depolamadan önce kontrol edilir; dosya boyutu istemci metadata'sından değil gerçek buffer'dan ölçülür. Bu kontrol tam görüntü decode/yeniden kodlama veya zararlı yazılım taraması değildir. Dosya adı sunucuda tam UUID ile üretilir, module/category yol parçaları enum ile sınırlanır. Eksik tenant artık `default` depoya yönlenmez.

`MediaService` açık tenant bağlamı ister, dış tenant override ve kimlik alanı toplu atamasını reddeder. Güncelleme yalnız sunum alanlarını kısmi olarak yazar; depolama URL'si/kimliği değiştirilemez. Metadata-only dış varlık kaydı için HTTPS origin `MEDIA_ALLOWED_EXTERNAL_ORIGINS` içinde açıkça tanımlanmalıdır; sunucunun gerçek yükleme sonucunu kaydetmesi ayrı `createFromUpload` yolundadır. URL kimlik bilgileri, aktif içerik şemaları ve SVG/HTML/JS kaynakları reddedilir. `/uploads/tickets/...` referansının metadata'da tutulması dosyanın herkese açık servis edildiği anlamına gelmez; root statik dosya sınırı ayrıca kapatılmıştır. Eski veritabanı kayıtlarına toplu değişiklik yapılmadı.

Doğrulama: **29/29** test (gerçek Nest multipart istekleri, üretim ValidationPipe, rol kapısı ve sahte S3 transport dahil), yeni `media-upload-policy.ts` **%100 satır/dal/fonksiyon**. Backend üretim TypeScript exit 0. Kanıt `/tmp/affexai-g1-media-coverage.log`, `/tmp/affexai-g1-media-tsc.log`. İlk test çalışması mevcut mapped-types ESM test altyapısına takıldı; eşdeğer Swagger mapped DTO helper mock'u sonrası davranış testleri çalıştı. Gerçek S3 yazımı, canlı dosya yayını veya dış provider çağrısı yapılmadı. Bağımsız kaynak incelemesi backend_audit tarafından tamamlandı; değişen yükleme sınırında yeni yüksek/kritik bulgu bulunmadı. Medya controller kütüphane CRUD/yükleme artık doğrulanmış ADMIN/EDITOR/MARKETING_MANAGER rollerini gerektirir; customer/viewer reddedilir. İç TicketAttachmentService çağrısı bu controller rol kapısından etkilenmez. Rol sınırı eklenmeden önce HTTP RED2/7, sonra tüm medya paketi GREEN29/29 doğrulandı ve backend_audit bağımsız incelemesi yeni yüksek/kritik bulgu bildirmedi.

### Alıcı eşzamanlılık incelemesi sonrası ek düzeltmeler

Bağımsız inceleme `SubscriberService.update` içindeki tam entity save'in eşzamanlı unsubscribe/token rotasyonunu eski snapshot ile geri yazabileceğini gösterdi. Artık sadece izin verilen alanlara tenant/id scoped partial update uygulanır ve sonuç tekrar okunur. Mailbox email değişimi bu endpoint üzerinden reddedilir; yeni adres için yeni doğrulanmış abonelik gerekir. Ek test önce **2 başarısız/9 başarılı**, sonra geçti.

Legacy admin subscribe doğrudan ACTIVE yapmaz; kanonik double-opt-in servisine iletir. Legacy unsubscribe ve webhook durum güncellemeleri tam eski entity'yi kaydetmez; consent bayrakları/token'lar partial SQL ile temizlenir. Unsubscribe, güncel satır BOUNCED/COMPLAINED ise SQL CASE ile bu durumu korur; böylece yarış sırasında kalıcı teslim engeli daha zayıf unsubscribed statüsüne çevrilmez. Gerçek PostgreSQL fixture bu durum korumasını ve token temizliğini de doğruladı. Ek legacy testleri önce **2 başarısız/11 başarılı** idi; son alıcı testi sayısı **14**.

## Resend webhook imzası, geçici tenant bağlama ve inbound sınırı

Aktif controller `modules/mail/controllers/resend-webhook.controller.ts`'dir; kardeş eski controller MailModule'a bağlı değildir. Aktif endpoint, tüm NODE_ENV değerlerinde Svix doğrulamasını orijinal `req.rawBody` baytlarıyla yapar. Secret eksikse 503, ham gövde/imza/başlık eksik veya geçersizse 400 döner; hiçbir persistence çağrısı yapılmaz. İmzalı ancak bilinmeyen event veya geçersiz recipient şeması reddedilir. Soft bounce kalıcı hard-bounce suppression'a dönüştürülmez.

G1 için geçici, açık tek-tenant provider binding kullanılır: `RESEND_WEBHOOK_SECRET` ile birlikte `RESEND_WEBHOOK_TENANT_ID` sunucu ayarı zorunludur. Tenant email adresinden, payload metadata'sından veya istemci header'ından seçilmez. Doğrulanmış olay açık bağlama ile `TenantService` scope'una alınır; WebhookService event metadata ile bu scope'un aynı olmasını ister. Suppression ve subscriber güncelleme hataları dışarı taşar; veritabanı başarısızlığı 200/201 olarak onaylanmaz. Provider çağrısı yapılmadı; yerel imzalar test-only secret ile üretildi.

**Inbound ticket reply bilinçli olarak henüz desteklenmiyor:** geçerli provider imzasından sonra bile controller ve service 503 döner. Provider imzası teslimatı doğrular; spoof edilebilen From adresini veya email header'ındaki tenant bilgisini yetki kanıtına dönüştürmez. Eski davranışta bilinmeyen sender'ın assigned staff gibi yazılması kaldırıldı. G3 kabulü: persisted reply capability; tenant-ticket-author binding; süre; tek kullanım/replay koruması; trusted mailbox mapping; gerçek provider/body integration. Bunlar tamamlanmadan inbound özelliği çalışır sayılmaz.

Tek-tenant binding, tenant BYO provider'ın çok tenant callback çözümü değildir. G3 için provider-message receipt ledger, tenant-scoped signing-secret endpoint ve kalıcı event idempotency gerekir. G1 testleri known-message-ID correlation veya replay korumasını kanıtlamaz. İmzalı provider event'i bu dar yapılandırılmış tenant scope'unda işlenir; bilinmeyen event type reddedilir. Production webhook ayarı değişmedi.

TDD: ilk signature/inbound HTTP koşumu **7 başarısız/1 başarılı**; tenant/persistence servisi önce **2 başarısız/2 başarılı**. Bağımsız incelemede yakalanan subscriber persistence swallow ve soft-bounce davranışı için ek **5 başarısız/26 başarılı** üretildi, ardından düzeltildi. Son ortak koşum **31/31 başarılı** (HTTP 10, webhook service 7, recipient 14); üretim TypeScript exit 0, scoped diff check temiz.

```sh
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/modules/mail/controllers/resend-webhook-security.http.spec.ts src/modules/mail/services/webhook-tenant-boundary.spec.ts src/modules/email-marketing/recipient-integrity.spec.ts --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true}}]}}'
pnpm --filter affexai-backend exec tsc --noEmit --project tsconfig.build.json
```

Loglar: `/tmp/affexai-g1-webhook-red.log`, `/tmp/affexai-g1-webhook-tenant-red.log`, `/tmp/affexai-g1-webhook-persistence-red.log`, `/tmp/affexai-g1-webhook-final.log`, `/tmp/affexai-g1-webhook-tsc.log`. Bootstrap'un gerçek ham gövde yakalaması root ajanının `useBodyParser` değişikliği/full app kabulüyle ayrıca doğrulanmalıdır.

### G1 ek yerel çalışma — gerçek uygulama, e-posta gönderimi ve özel içerik

- Tam Nest uygulaması, yalnız izole `affexai-g0-isolated` PostgreSQL/Redis ağıyla çalıştırıldı. `scripts/run-isolated-app-smoke.sh` etiketi kontrol ederek yalnız kendi acceptance containerını yeniler; `.env` okumaz. Auth login/refresh/password revoke, tenant sahipliği, platform backup/queue sınırı, credential serialization ve sahte commerce seed oluşmaması gerçek HTTP+DB ile geçti. Başlangıçta bulunan doğrudan `express` bağımlılığı, nonroot temp/backup izinleri ve TypeORM eager-select auth-cache hatası düzeltildi. Yerel üretim imajı+derleme kanıtıdır; production veya provider doğrulaması değildir.
- `scripts/test-fullapp-auth.cjs` aynı e-postalı iki tenant ve platform fixturelarını kendi oluşturup sonunda siler. PostgreSQL migration geçmişi 6'ya yükseldikten sonra da geçti. UI denemesi için izole containerın internet çıkışını açmadan `docker exec` üzerinden yalnız `127.0.0.1:9006` relay kullanıldı; gerçek tarayıcıda yerel login → `/portal/dashboard` görüldü. Portalın normal `user` rolündeki dashboard kartlarının boş olması ve bildirim düğmesinin görünür aksiyon üretmemesi henüz ürün kabulü değildir; G3 UI iş listesinde kalır.
- E-posta yönetimi HTTP sınırı ilk 17 RED → GREEN, ek gönderim DTO/otomasyon/kampanya testleriyle 25 GREEN. Grup/segment/subscriber/analytics/IP/stats/gönderim/kampanya/otomasyon yönetimi `marketing.manage` gerektirir. Global kuyruk gözlemi platform yöneticisine ayrıldı. Başlık tenant otoritesi olamaz.
- `EmailDispatchPolicy` alıcıyı ve kampanyayı doğrulanmış tenant içinde bulur; aktif **çift onaylı** abonelik ve açık e-posta/pazarlama izni gerektirir. Enqueue ve worker delivery öncesi tekrar uygulanır. Tenant olmayan eski işler varsayılan tenant üzerinden gönderilmez. Worker geçerli tenant tokenlı abonelikten ayrılma bağlantısını gövdeye ve List-Unsubscribe bilgisine ekler; provider başarısızlığında başarı sayacı artmaz. Buradaki header **RFC8058 one-click iddiası taşımaz**; bağlantı explicit kullanıcı onay ekranıdır. Gönderim sonrası DB hatası ve provider retry için kalıcı receipt/idempotency halen G3 kabul gereğidir. Gerçek provider/e-posta gönderimi yapılmadı.
- E-posta policy/service/worker odaklı kapsam (çift onay için ek iki negatiften önce): 50 test, satır %100, branch %83.82. Çift onay eksik/false testleri ayrıca RED→GREEN uygulanmıştır. Bu oran bütün ürünün kapsamı değildir.
- JWT HTTP doğrulaması `type=access` ve pozitif integer tokenVersion zorunlu tutar; soft-deleted hesap da reddedilir. Eski amaçsız tokenlar yeniden giriş gerektirir. Tenant/queue/backup/gateway seçili regresyonları 31 test geçti.
- `main.ts` tüm `uploads` ağacını anonim sunmayı bıraktı. Yalnız açıkça yayınlanmış `uploads/public` sunulur; chat/ticket/sertifika ham dosyaları eski URL'den anonim okunamaz. Public dosyalarda nosniff ve sandbox CSP uygulanır. Eski özel dosya bağlantılarının sahiplik kontrollü indirme akışına taşınması modül kabulünde takip edilir. Gerçek geçici dosyalarla 4 HTTP erişim testi geçti.
- Chat documents route üzerindeki çift `/api` düzeltildi. Belge yükleme/çıkarılan içerik/listeleme ve AI generate/SSE için aynı tenantın **oturum sahibi veya destek yetkilisi** kontrolü, ayrıca message-session ilişkisi, provider/persistence çağrısından önce uygulanır. 13 gerçek Nest HTTP testi geçti; başka kullanıcı, başka tenant, yanlış message ve SSE akışı kapsanır. Provider mock kullanıldı.
- Mail diagnostics için normal üyelerin sistem e-posta kanalını kullanması engellendi: `settings.manage`, kendi hesabına test gönderimi, HTML escaping ve provider hata bilgisini dışarı sızdırmayan 503. Altı gerçek HTTP testi geçti. Ürün kimliği AffeXAI Cortex olarak düzeltildi.

Bu çalışma G1'in tamamı veya 33 modülün tamamlanması olarak işaretlenmez. Yeni incelemelerle bulunan engeller kapatılıp birleşik test ve son derleme yeniden çalıştırılır; stale/mid-edit derleme çıktısı güncel source doğrulaması sayılmaz.

### Webhook ham gövde parser sözleşmesinin ek doğrulaması

Aktif Resend controller HTTP testi `NestExpressApplication({ rawBody: true })` üzerinde gerçek bootstrap ile aynı `useBodyParser('json', { limit: '10mb' })` ve URL-encoded parser ayarlarını kullanacak şekilde genişletildi. Boşlukları korunmuş JSON gövdesinin byte-exact imza testi dahil **10/10** geçti. Bu ek sözleşme testi mevcut doğru implementasyonda doğrudan GREEN verdi; yeni RED kanıtı olarak sayılmaz. Provider veya dış ağa istek yapılmadı. Tam uygulama bootstrap doğrulaması ile controller testinin kapsamı ayrı tutulur.

Komut: `NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/modules/mail/controllers/resend-webhook-security.http.spec.ts --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true}}]}}'`. Log: `/tmp/affexai-g1-webhook-parser-final.log`.

### Ek yönetim sınırları — kalan pazarlama controller'ları ve ayarlar

- Kalan 11 pazarlama yönetim controller'ı `JwtAuthGuard + marketing.manage` gerektirir. İş, dosya ve GDPR retention temizliği tenant yöneticisine açılmaz; `PlatformAdminGuard` gerekir. Gerçek HTTP RED 14 başarısız/1 başarılı → GREEN 16 başarılı (platform temizliği olumlu senaryosu dahil). Ağ, provider ve dosya silme çağrıları servis fixture'larıyla engellidir. Normal geniş ts-jest type graph ilk çalışmada bellek sınırına ulaştı; bu taşıma testi izole TS derlemesi ve mock servislerle yaklaşık bir saniyede tekrarlanır. Ürün kaynakları ayrıca build-tsconfig ile denetlenir.
- Settings yönetimi `settings.manage` ister. Genel ayar yanıtlarında credential değerleri maskelenir, encryptedDek çıkarılır; e-posta GET/PUT yanıtı maskelidir. Maskeli e-posta ve storage form değerleri mevcut credential ile sunucu içinde birleştirilir; `***` saklanan anahtarın üzerine yazılmaz. AI sağlayıcı testi gerçek bağlantı yapmadığından artık başarı bildirmez.
- Public `GET /settings/site` yalnız açık tenant seçicisiyle çalışır; eksik seçici 400 verir. Public DTO şirket/iletişim/sosyal/SEO alanlarıyla sınırlıdır, strategicRadar dışarı çıkarılmaz. Yetkili tam ayar `GET /settings/site/admin` üzerinden okunur; iki admin sayfası ve portal ayar test sayfası bu uçla güncellendi. Başlıksız root branding isteği artık default tenant seçmez; frontend mevcut fallback içeriğine düşebilir. Bu, bilinçli API davranışı değişikliğidir.
- Settings HTTP testleri: ilk RED 17 başarısız/1 başarılı; iki maskeli kaydetme ve iki storage/gerçek olmayan bağlantı testi ayrıca RED oldu; son GREEN 23 test başarılı. SettingsService içindeki önceki kullanıcı değişikliklerine dokunulmadı. Yeni sayfa tasarımı yok; frontend tip denetimi geçti, gerçek oturumlu admin tarayıcı kabulü ana smoke çalışmasında ayrıca yapılmalıdır.

```sh
pnpm --dir apps/backend exec jest --runInBand --runTestsByPath src/modules/email-marketing/remaining-admin-boundaries.http.spec.ts --transform '{"^.+\\.(ts|tsx)$":["ts-jest",{"tsconfig":{"isolatedModules":true}}]}'
pnpm --dir apps/backend exec jest --runInBand --runTestsByPath src/modules/settings/settings-authorization.http.spec.ts
```


## G1-H: genel sohbet ve URL önbelleği HTTP yetkisi

Genel sohbet controller'ındaki devre dışı JWT koruması açıldı. Oturum oluşturma doğrulanmış `user.id` kullanır; sorgu, context, istatistik, escalation ve geçmiş işlemleri provider/veri işlemi öncesinde ortak tenant+owner/staff kontrolünden geçer. Escalation toplamları tenant staff rolü gerektirir. Oturum mesaj sayısı sabit sıfır yerine saklanan gerçek sayaçtan okunur.

URL HTTP işleme/önbellek yönetimi admin/support rollerine kapılanır; kullanıcı mesajındaki URL işleme mevcut owner kontrollü WebSocket akışında sürer. Süreç-geneli önbellek metrikleri/reset platform yetkisi gerektirir. Sabit metrics rotası dinamik urlHash rotasından önce tanımlanarak shadow/bypass engellendi.

Gerçek Nest HTTP RED **21/21 başarısız** ardından ilk GREEN **24/24 başarılı**; son ek testler owner sayacı, aynı tenant staff ve statik metric rota yetkisini doğrular. Backend üretim TypeScript exit 0. Kanıt `/tmp/affexai-g1-general-url-red.log`, `/tmp/affexai-g1-general-url-green.log`, `/tmp/affexai-g1-general-url-tsc.log`. Gerçek AI/provider/URL ağı çağrısı yapılmadı. Bağımsız General/URL kaynak incelemesi root tarafından tamamlandı; yeni yüksek/kritik bulgu bulunmadı. Root üretim build kontrolü de exit 0 olarak doğrulandı.

### G1 integration olay görünürlüğü ve üretici tenant düzeltmesi

`IntegrationController` read/list/stats yolları mevcut `settings.manage` iznini gerektirir. İstatistik sorgusu tenant predicate uygular; eksik/geçersiz tenant sorgudan önce reddedilir. Events create/publish ve CMS publish üreticileri `system` yerine gerçek tenant gönderir. CMS bulk publish tek scoped PostgreSQL `UPDATE RETURNING` sonucundaki ID/slug kayıtları için olay üretir; yabancı, silinmiş veya bulunamayan istek ID'leri olay oluşturmaz; yinelenen ID'ler tek sayılır. Bu işlem henüz transactional outbox değildir; iş kaydı ile event persistence arasındaki crash aralığı G2'de kapanacaktır.

İlk RED: 8 davranış hatası (5 izinsiz HTTP route, 3 tenant/producer sınırı), ayrıca 1 test fixture eksikliği; fixture hatası ürün açığı olarak sayılmadı. Sonuç: 21/21 odaklı test GREEN, production `tsc --noEmit --project tsconfig.build.json` exit 0. CMS tek publish ve events status transition testleri ek regresyon olarak doğrulandı. Testler repository/provider mock kullanır; yeni PostgreSQL migration veya dış çağrı yapılmadı. Loglar: `/tmp/affexai-g1-integration-red.log`, `/tmp/affexai-g1-integration-green.log`, `/tmp/affexai-g1-integration-tsc.log`.

Tekrar komutu: `NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/modules/platform-integration/services/event-tenant-boundaries.spec.ts src/modules/platform-integration/controllers/integration-boundaries.http.spec.ts --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true}}]}}'`. Bu sayı/kapsam tüm 33 modülün negatif endpoint auditinin yerine geçmez.

G1 audit backlog: bütün modüllerin anonim, düşük yetki, başka tenant, başka kayıt sahibi, eksik scope ve yanlış amaçlı token kontrolleri endpoint matrisiyle tamamlanmalı; platform integration list limit/date validation ve diğer automation/webhook/approval controller yetkileri ayrıca incelenmelidir. G2 başlangıcı için ticket.resolved transaction+outbox+idempotent consumer dikey dilimi önerilir; mevcut Cortex rastgele point ID ve best-effort event emission doğrudan retry ile güvenilir teslimat sağlamaz.


### G1-H üretim ValidationPipe düzeltmesi

Bağımsız inceleme, General/URL sınıf DTO'larının decoratorsız olması nedeniyle gerçek whitelist/forbidNonWhitelisted pipe'ında geçerli isteklerin reddedildiğini buldu. HTTP harness'e üretim pipe'ı eklenince **2 başarısız / 22 başarılı** RED üretildi. DTO alanları gerçek tür, boyut, enum, UUID/URL ve batch sınırlarıyla dekore edildi; geçerli URL tekli/batch istekleri ve query limit dönüşümü test edildi. Sonuç **29/29 başarılı**, üretim TypeScript exit 0; `/tmp/affexai-g1-general-url-pipe-red.log` ve `/tmp/affexai-g1-general-url-green.log`. Önceki 24 testlik checkpoint, bu gerçek pipe kabulüyle tamamlanmış oldu. Son dar DTO incelemesi backend_audit tarafından tamamlandı; yeni yüksek/kritik bulgu yok.

### MailService varsayılan tenant seçiminin kapatılması

`sendMail`, `sendBulk` ve `testConnection` artık otomatik `default` tenant seçmez. Açık tenant, aktif ALS tenantıyla çelişemez; tenant verilmezse yalnız `authenticated` veya `system` kaynaklı ALS kabul edilir. Public routing hint tek başına provider yetkisi olmaz. Scope yok/geçersiz ise settings, template veya adapter çağrısından önce hata verir; testConnection bu yetki hatasını provider bağlantı hatası gibi yutmaz. Mail modülünün user-created ve iki ticket-message notification çağrısı açık payload tenantını iletir.

TDD: routing RED16/GREEN20; listener RED3/GREEN3; mevcut diagnostics6 ile birleşik **29/29** geçti. Production TypeScript kontrolü routing değişikliğinde exit0; listener değişikliği odaklı testle doğrulandı. Gerçek mail/provider çağrısı yok. Komut: `NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/modules/mail/mail-tenant-routing.spec.ts src/modules/mail/mail-diagnostics.http.spec.ts src/modules/mail/listeners/email-event-tenant.spec.ts --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true}}]}}'`. Loglar `/tmp/affexai-g1-mail-routing-{red,green,final,tsc}.log` ve `/tmp/affexai-g1-mail-listener-red.log`.

Açık kalan ayrı bulgu: MailService adapter cache yalnız tenant anahtarıyla tutulur ve cache hit üzerinde settings okunmaz; API key/provider rotasyonu adapterı yenilemez. Sonraki dilim settings snapshot/revision ile adapter invalidation ve yarış testi gerektirir. Commerce provisioning account-created helper çağrıları açık tenant parametresi taşımıyor; doğrulanmış ALS olmayan background yürütmeler artık güvenli şekilde başarısız olur ve açık tenant aktarımı ayrıca tamamlanmalıdır. Bu sınırlar mail modülünün bütünüyle ürün kabulünün tamamlandığı anlamına gelmez.

### Mail adapter rotasyonu ve provisioning çağrıları takip düzeltmesi

Önceki iki açık mail bulgusu bu dilimde ele alındı. Her send/bulk/test çağrısı tenant email settings snapshotını bir kez okur; provider adapterı ve gönderen varsayılanları aynı snapshotı kullanır. Cache tenant + provider/credential/SES region SHA-256 fingerprint eşleşmesiyle yeniden kullanılır; değişen veya kaldırılan credential eski adapter kullanımına dönmez. Fingerprint/credential loglanmaz. Devam eden bir gönderimin önceden okunmuş snapshotını iptal etme garantisi yoktur; gecikmiş eski okuma sonraki çağrılarda eski credentialın kalıcı kullanımına yol açmaz. SettingsService'in kendi tutarlılık sınırları değişmedi.

`sendAccountCreated` açık tenant parametresi ister; iki Commerce provisioning yolu transaction başarıyla bittikten sonra oluşturulan tenantı aktarır. Yeni tenantın provider ayarı yoksa başka tenant credentialına düşmez; onboarding provider kurulumu ayrıca gereklidir. Bu dar düzeltme provisioning'in mevcut parola üretimi, rol atama ve checkout idempotency akışının tam güvenlik kabulü değildir.

RED: 3 adapter/snapshot ve 2 provisioning tenant regresyonu. GREEN: routing, provider değişimi, SES credential/region rotasyonu, gecikmiş config yanıtı, listener ve diagnostics toplam **37/37**. Production tsc exit0; scoped diffcheck0. Dış mail, Stripe veya provider çağrısı yapılmadı. Loglar `/tmp/affexai-g1-mail-rotation-{red,green,final,tsc}.log`, `/tmp/affexai-g1-provisioning-mail-red.log`. Test komutu önceki mail routing komutuna `src/modules/commerce/services/provisioning-mail-tenant.spec.ts` eklenerek çalıştırıldı.

### İkinci inbound ticket yüzeyinin kapatılması

TicketsModule içinde aktif kayıtlı `/webhooks/tickets/email/{sendgrid,mailgun,postmark,resend,generic}` yolları provider imzası veya reply capability olmadan global ticket/message lookup yapabiliyordu; mesajı ticket sahibinin kimliğiyle yazıyordu. Controller düzeyindeki guard artık beş yolu da handler/parsing öncesi açık **503 unavailable** ile durdurur. `TicketEmailParserService.processInboundEmail` doğrudan servis çağrısında da repository erişiminden önce 503 verir. G3'te provider doğrulaması, tenant/ticket/author-bound kalıcı capability, süre ve replay koruması olmadan yeniden açılmaz. Bu geçici güvenlik sınırı inbound mail özelliğinin tamamlandığı anlamına gelmez.

TDD **6 RED → 6 GREEN** (beş gerçek HTTP yolu ve doğrudan parser çağrısı), production TypeScript exit0. Komut: `NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec jest --runInBand --runTestsByPath src/modules/tickets/controllers/ticket-inbound-boundary.http.spec.ts --config '{"rootDir":".","testEnvironment":"node","transform":{"^.+\\.tsx?$": ["ts-jest",{"tsconfig":{"isolatedModules":true}}]}}'`. Loglar `/tmp/affexai-g1-ticket-inbound-{red,green,tsc}.log`. Bağımsız kaynak incelemesinde yeni yüksek/kritik bulgu yok; dış mail/provider çağrısı yapılmadı.

### Organizations yaşam döngüsü ve canonical tenant kimliği

Kuruluş slug'ı canonical `tenant_id`, kuruluş UUID'si ilişki anahtarı olarak sabitlendi. Migration15 legacy UUID tenant değerlerini geçici UUID→küçük harf slug eşlemesiyle dönüştürür; `users.organizationId + tenant_id`, legacy `users.roleId + tenant_id` ve `user_roles` kullanıcı/rol ilişkileri composite foreign key ile tenant dışı bağlanmayı veritabanında reddeder. İzole PostgreSQL üzerinde legacy migration, küçük harf slug, FK reddi ve ikinci çalıştırmada sıfır bekleyen migration doğrulandı.

Platform create/status ve tenant current/member API'leri gerçek Nest HTTP+PostgreSQL ile çalıştırıldı. Üyelik kaldırma kullanıcıyı devre dışı bırakır, refresh tokenı temizler ve tokenVersion artırır. Kuruluş kapatma bağlı kullanıcı oturumlarını iptal eder; tekrar açma bu oturumları kendiliğinden geçerli yapmaz. Kuruluş satırı `FOR UPDATE` kilidiyle seri hale getirildi; iki yöneticinin eşzamanlı kaldırılmasında sonuç `[200,400]` ve bir aktif yönetici kaldı. İşlemler kalıcı organization audit kayıtlarına yazıldı. E-posta worker'ı kuyruktaki işi göndermeden önce aktif tenantı yeniden doğrular; Stripe provisioning tekrar teslimi mevcut subscription kimliğinde no-op olur ve hata webhook retry'ı için dışarı taşınır.

XYZ Company fixture'ı ve loopback-only izole backend relay ile gerçek tarayıcıda owner login → tenant organizasyon sayfası doğrulandı. Sayfa kuruluş adı/slug, aktif üye ve yönetici sayısını kalıcı veriden gösterdi. BCC tenant kenar çubuğuna Organizasyon bağlantısı eklendi ve aktif sayfada Kullanıcılar grubu açık gelir. Son yönetici kaldırma denemesi 400 sonrası üyeyi korudu; hem toast hem kalıcı Türkçe `role=alert` geri bildirimi görünür oldu. Odaklı birleşik sonuç 9 suite / 94 test; backend production build, frontend TypeScript ve production build exit 0. Production, provider veya dış ağ çağrısı yapılmadı. Socket reconnect matrisi G1 birleşik kabulinde yeniden çalıştırılacaktır.

# AffeXAI Cortex — G0 Docker ve CI doğrulaması

Tarih: 07.10.2026. Yerel macOS ARM64 / Docker Desktop; canlı deployment değildir.

## Yapılandırma düzeltmeleri

- Backend/frontend imajları Node 24.18.0 ve pnpm 11.17.0 kullanır. Kilit dosyası frozen; shared-types, `file:` tüketicilerinin kurulumundan önce derlenir.
- Frontend standalone artifact kullanır; production bağımlılıklarını tekrar npm ile kurmaz. TLS doğrulamasını kapatan ayar ve hatayı örten `tee` pipeline kaldırıldı.
- Backend production bağımlılıkları ayrı aşamada; Chromium/Puppeteer yolu tanımlı. İki runtime da `node` kullanıcısıdır. Upload dizini gerçek cwd ile `/app/uploads` olarak eşlendi.
- Backend derleme denemesi varsayılan heap ile exit 134 verdi; build adımına 4096 MiB V8 heap tanımlandı. Runtime için bu sınır zorlanmaz.
- Recursive Docker ignore, nested node_modules/dist/.next/.env/key/uploads/backups dosyalarının context'e taşınmasını engeller.
- Migration giriş noktası `dist/core/database/cli.js`; eksik CLI/hatalı migration başlatmayı durdurur. `RUN_MIGRATIONS=false` yalnız açık izolasyon smoke seçeneğidir.
- Kaynak ve derlenmiş migration keşfi aynı beş aktif migration sınıfını kullanır. Arşivlenmiş baseline'lar alınmaz; tarihsel SQL değiştirilmez.
- Frontend `/api/health` backend'e bağımlı olmayan liveness yanıtıdır. DB/Cortex/provider readiness kanıtı değildir.
- Üretim/apps Compose node-fetch health, backend 9006/API path, frontend build-time backend adresiyle eşlendi. Bu dosyalar çalıştırılmadı.
- CI/deploy validation pnpm/Node/shared-first olarak güncellendi. Sessiz hata toleransı ve dosya oranından uydurma coverage çıkarıldı; lint/typecheck/test/audit kapıları fail-closed. Deployment trigger/webhook çalıştırılmadı. İmaj tag'leri webhook'un beklediği tam SHA ile eşlendi.
- Frontend ESLint flat config doğrudan kullanılıyor; eski FlatCompat circular hatası kaldırıldı. ESLint 10/React plugin API uyuşmazlığı, mevcut uyumlu 9.39.5 sürümüne pinlenerek düzeltildi. Kurallar kapatılmadı.

## İzolasyon

`docker-compose.test.yml`, `affexai-g0-isolated` projesi, `--env-file /dev/null`, private Docker network. PostgreSQL pgvector16 sadece geçici tmpfs kullanır; host bind/veri volume yoktur. Başka projelerin volume/imaj/konteynerlerine dokunulmadı. Tam backend uygulaması başlatılmadı: mevcut commerce bootstrap demo billing verisi oluşturuyor. Yalnız migration CLI ve imaj kontrolleri bu dilimin kapsamıdır.

```sh
docker compose --env-file /dev/null -p affexai-g0-isolated -f docker-compose.test.yml --profile migration up -d postgres-test
docker compose --env-file /dev/null -p affexai-g0-isolated -f docker-compose.test.yml --profile migration run --rm migration-test
```

## Kanıtlar ve açık kapılar

- Entrypoint shell regresyonu: geçti; missing CLI, exit propagation, ordering ve opt-out sınandı.
- Migration discovery: 1/1 test geçti; backend üretim typecheck geçti.
- Frontend Docker build: temiz Linux kurulumu/193 statik sayfa/standalone export geçti.
- Frontend konteyneri UID 1000; health HTTP 200 JSON içeriği ve CMS SSR sayfasındaki AffeXAI Cortex başlığı doğrulandı; Docker health healthy. Browser etkileşim/E2E yerine geçmez.
- Frontend health route lint: geçti. Genel frontend lint artık çalışıyor: **840 hata, 159 uyarı**, exit 1. Henüz temiz kalite kapısı değildir.
- Backend lint config bağımlılıkları düzeltildi; genel tarama bellek sınırında durdu. Ayrıntı aşağıda. Üretim typecheck geçti; tam lint/test/coverage kapısı açıktır.
- GitHub Actions çalıştırılmadı; YAML/shell doğrulaması gerçek uzaktaki CI başarısı değildir.
- Eski root-owned uploads volume'ları production'a geçerken sahiplik kontrolü gerektirir. Bu çalışma mevcut volume sahipliğini değiştirmez.
- Üretim Compose içinde eski tenant domainleri ve mevcut harici altyapı seçimleri yayın yapılandırmasında ayrıca ele alınmalı; örnek tenant adı XYZ Company olsa da canlı domain kararı yapılmadı.

Backend imajı ve gerçek boş DB migration sonuçları aşağıda kayıtlıdır. G0 bütünü ve ürün kabulü açık.

## Ek doğrulama: lint altyapısı ve nihai yerel imaj kanıtları

Üstteki `@eslint/js` eksikliği artık giderildi: backend config'in doğrudan import ettiği `@eslint/js@9.39.5`, `globals@16.4.0`, `typescript-eslint@8.71.1` devDependencies olarak kilitlendi. Kurulum yerel önbellekten, sıfır indirmeyle tamamlandı; manifest/lock eşleşmesi ve bağımsız inceleme geçti. Kural kapatma veya toplu otomatik düzeltme yapılmadı.

Çalıştırılan komutlar:

```sh
pnpm --filter affexai-backend add --save-dev --save-exact --offline --ignore-scripts @eslint/js@9.39.5 globals@16.4.0 typescript-eslint@8.71.1
pnpm --filter affexai-backend exec eslint src/core/database/migration-catalog.ts
NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend exec eslint '{src,apps,libs,test}/**/*.ts'
```

Odaklı lint yapılandırmayı yükleyip beş Prettier tırnak ihlali bildirdi (exit 1). Genel lint 4096 MiB heap sınırında SIGABRT ile durdu; tam hata sayısı ölçülmedi. Loglar `/tmp/affexai-g0-backend-lint-install.log`, `/tmp/affexai-g0-backend-lint-focused.log`, `/tmp/affexai-g0-backend-lint-full.log`. Bu sonuç lint kapısının geçtiği anlamına gelmez; bellek kontrollü tam tarama ve mevcut kod borcu açıktır.

Nihai yerel izolasyon kanıtı: backend runtime UID 1000, runtime bağımlılıkları/upload yazılabilirliği/env dışlama kontrolü ve Chromium PDF üretimi geçti (**8926 byte**, `/tmp/affexai-g0-runtime-pdf.log`). Koordinatörün boş veritabanı doğrulamasında beş migration uygulandı; ikinci çalıştırma yeni migration uygulamadı. Frontend health ve CMS SSR HTTP 200 doğrulandı. Bunlar yerel konteyner kanıtlarıdır; uzaktaki CI, canlı sistem, sağlayıcı entegrasyonu veya tam ürün kabulü değildir.

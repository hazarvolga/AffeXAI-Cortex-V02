# AffeXAI Cortex — Geliştirme Handoff

**Son güncelleme:** 13 Ekim 2026, Europe/Istanbul (UI/UX F0 + F1 yerel commit'leri; aşağıdaki "Sonraki oturum: buradan başla" bölümüne bakın)

**Durum:** V02 commit `1419332` Coolify üzerinde çalışıyor; `affexai.tr` canlı. Forms → CRM → Automation backend dikey dilimi yerelde kabul edildi; 33 modülün tam ürün kabulü henüz tamamlanmadı

**Proje kökü:** `/Users/hazarvolgaekiz/dev/lab/AffeXAI-Cortex-main`

**Aktif dal:** `main`

**Ürün:** AffeXAI Cortex — Aluplan'dan tamamen bağımsız ürün

**Örnek tenant:** `xyz-company-ui` / XYZ Company

## Değiştirilemez proje kararları

- Tenant yönetim arayüzünün ana tasarım dili `BccEditorialWrapper`dır.
- Eski `apps/frontend/src/app/admin/layout.tsx` kabuğu tenant ekranlarının tasarım referansı değildir.
- Bir modül yalnız ekranı açıldığı için tamamlanmış sayılmaz. Backend davranışı, tenant izolasyonu, RBAC, veri kalıcılığı, hata durumları, migration, test ve gerçek çalışma zamanı birlikte doğrulanmalıdır.
- Ürün 33 modülün tamamı çalışır duruma gelmeden piyasaya çıkarılmayacak.
- Önemli yeşil dilimlerden sonra yerel checkpoint commit'i alınır. Kullanıcı ayrıca istemeden push veya deployment yapılmaz.

## Son tamamlanan çalışma

### Tenant CRM login/layout hatası

Gözlenen hata: `/xyz-company-ui/admin/crm` açıldığında tenant CRM ekranı yerine `ACCESS PROTOCOL` login içeriği eski admin sidebar/header kabuğunun içinde görünüyordu.

Kök neden: Middleware tenant admin isteğini global `/admin/login` yoluna yönlendiriyor, bu rota da legacy `/admin` layout ağacına giriyordu.

Uygulanan çözüm:

- Tenant'a özel `/[tenant]/admin/login` rotası eklendi.
- Middleware oturumsuz veya geçersiz token içeren tenant admin isteklerini tenant login rotasına yönlendiriyor.
- Login sonrası güvenli yerel `redirect` dönüşü eklendi.
- Doğrudan tenant login açıldığında staff `/admin` fallback yolları tenant kapsamında tutuluyor.
- Başka tenant'a veya dış adrese redirect denemeleri reddediliyor.
- CRM'in mevcut `BccEditorialWrapper` uygulaması korunuyor.
- Özel API ve sayfa yanıtları için `private, no-store`; yalnız açık statik dizinler için immutable cache politikası uygulanıyor.

Tarayıcıda doğrulanan davranış:

```text
GET /xyz-company-ui/admin/crm
307 -> /xyz-company-ui/admin/login?redirect=%2Fxyz-company-ui%2Fadmin%2Fcrm
```

Tenant login HTML ve erişilebilirlik ağacında legacy admin sidebar/header bulunmuyor.

## Yerel restore point commit'leri

```text
6870e27 test: make response cache contract runnable
c94f49f fix: isolate tenant login and private responses
9895842 fix(db): disable synchronize in database config (migrations only)
```

Bu commit'ler yereldir. Uzak repoya push yapılmadı.

## Forms ve Automation diliminin teknik durumu

Kaynak kod düzeyinde tamamlanan başlıklar:

- Form oluşturma, düzenleme, yayınlama ve public submission sözleşmesi.
- Koşullu görünürlük kurallarının frontend ve backend eşleşmesi.
- Duplicate, self-reference ve cycle içeren form mantık kurallarının reddi.
- Tenant kapsamı, idempotency, CRM lead aktarımı ve outbox akışı.
- Automation aksiyonlarında zorunlu insan onayı.
- Ayrı `automation.approve` yetkisi; requester self-approval engeli.
- Onayın yalnız tenant sahibi veya platform yöneticisi tarafından verilebilmesi.
- Approval anında approver ve pending action snapshot'ı.
- Action claim/heartbeat/finalize işlemlerinde lease token fencing.
- Webhook için HTTPS/443 allowlist, DNS/IP doğrulaması, SSRF koruması, redirect/proxy kapatma, süre ve gövde sınırları, transient retry ve idempotency.
- Email campaign alıcı job'larında deterministik kimlik ve doğru tenant/actor event kaydı.
- Docker/Coolify proxy hop, özel backend portu ve ortam bazlı host değişkenleri.
- Frontend backend URL normalizasyonu; `/api/api/*` oluşması engellendi.

Bu backend dikey dilimi güncel kaynak kodla Docker build, migration ve runtime testlerinde kabul edildi. Forms görsel editörünün gerçek tarayıcı kabulü, spam/abuse politikası, webhook sandbox teslimi ve diğer automation hedefleri tamamlanmadan iki modülün bütün kabulü kapatılmaz.

## Son yeşil doğrulamalar

- İlgili backend paketi: **17 suite, 125/125 test geçti**.
- Webhook odaklı paket: **20/20 test geçti**.
- Login/cache/backend URL odaklı frontend paket: **12/12 test geçti**.
- Frontend typecheck geçti.
- Forms/Automation kod incelemesi: **GO**.
- Forms/Automation güvenlik incelemesi: **GO**.
- CRM tenant login-shell düzeltmesi kod incelemesi: **GO**.
- `git diff --check` ilgili dosyalarda geçti.
- Forms → CRM → PII-free event/outbox → Automation approval → tek tenant kampanyası gerçek Nest/PostgreSQL akışı geçti.
- Kesilmiş worker'dan kalan süresi dolmuş `processing` dispatch lease'i restart sonrası yeniden claim edildi; attempts `1 → 2`, tek approval ve delivered sonuç doğrulandı.
- Güncel Forms/Automation runtime paketi: **6 suite, 66/66 test**, backend typecheck/build ve full auth smoke geçti.
- Son bağımsız kod ve güvenlik yeniden incelemeleri: **APPROVE**, açık CRITICAL/HIGH/MEDIUM yok.

## Çalışma zamanı durumu

- Frontend geliştirme sunucusu: `localhost:9003` üzerinde açık.
- Backend süreç: `127.0.0.1:9006` üzerinde açık.
- İzole PostgreSQL/Redis ve `affexai-g1-app-smoke` güncel `affexai-cortex-backend:g0-local` imajıyla çalışıyor.
- Migration CLI 25 uygulanmış migration ve 0 pending migration raporladı.

## Kritik çalışma ağacı uyarısı

Forms/Automation checkpoint dosyalarının yanında, bu dilime ait olmayan üç ticket e-posta şablonu değişikliği bulunuyor. Bunlar korunmalı ve Forms/Automation commit'ine alınmamalıdır.

**Devam ederken `git reset --hard`, geniş kapsamlı checkout, toplu stash, clean veya dosya silme çalıştırma.**

**`git add .` kullanma.** Commit'lerde yalnız doğrulanan dilime ait dosyaları açıkça seç.

## Devam edildiğinde ilk yapılacaklar

1. Bu dosyayı ve `docs/active/AffeXAI-Cortex_Modul_Kabul_Matrisi.md` dosyasını oku.
2. `git status --short` ve son commit'leri kontrol et; mevcut değişiklikleri koru.
3. Forms görsel editörünü ve public formu gerçek masaüstü/mobil tarayıcıda draft→edit→publish→submit→unpublish akışıyla doğrula.
4. Public form spam/abuse politikasını kalıcı ve tenant kontrollü biçimde tamamla; rate-limit restart/çoklu replica davranışını kanıtla.
5. Automation webhook aksiyonunu kontrollü HTTPS sandbox hedefiyle, retry/idempotency ve iptal UX'iyle doğrula.
6. Desteklenen automation hedefleri ürün sözleşmesine göre genişletilecekse CMS/segment/notification aksiyonlarını gerçek hedef DB/provider sonucu olmadan etkinleştirme.
7. Bu açıklar kapandıktan sonra Forms ve platform-integration satırlarının tam modül kapanışını yeniden değerlendir.
8. Bağımlılık sırasındaki sonraki modüle geç.

## Bilinen operasyon notları

- Repo pre-commit hook'u `npx lint-staged` çağırıyor. Codex kabuğunda `npx` görünmeyebilir.
- Root `lint-staged` frontend dosyaları için `apps/frontend/eslint.config.mjs` ve mevcut Prettier binary'si ile çalıştırılmalıdır; hook atlanmamalıdır.
- Üretilen dosyaları gelişigüzel stage etme.
- Docker'daki eski test konteynerlerini güncel kaynak doğrulaması gibi raporlama.
- Kullanıcı arayüzünde eski tasarım görüldüğünde önce routing/layout kompozisyonunu incele; `BccEditorialWrapper`ı kaldırma.

## Devam komutu

Kullanıcı “devam et” dediğinde izin veya rutin tercih sorusu sormadan yukarıdaki ilk adımlardan başlanır. Bu paragraf 8 Ekim'deki yerel pause kapsamını kaydeder; 11 Ekim'de kullanıcı V02 push, Coolify deployment ve public domain bağlantısını ayrıca açıkça istedi.

## V02 temiz depo aktarımı — 2026-10-10

Kullanıcı, güncel çalışma ağacının bağımsız ve temiz bir Git başlangıcı olarak `hazarvolga/AffeXAI-Cortex-V02` deposuna aktarılmasını açıkça istedi. Aktarım öncesi yerel artefaktlar, coverage, log, scratch test ve iç içe yanlış kaynak kopyaları `.gitignore` / `.dockerignore` kapsamına alındı; örnek credential değerleri açık placeholder biçimine çevrildi.

Aktarım kapıları:

- Shared types build: geçti.
- Backend typecheck ve production build: geçti.
- Frontend typecheck ve production build: geçti. Build sırasında çalışmayan yerel backend için beklenen `ECONNREFUSED` logları üretildi; statik üretim tamamlandı.
- Cortex Python testleri: 52 geçti.
- `git diff --check`: geçti.
- Backend tam Jest envanteri: 154 suite geçti, 4 atlandı, 139 başarısız. Başarısızlıklar eski test sözleşmeleri, auth fixture/env uyuşmazlıkları ve kaldırılmış `SettingsService` mock metotları dahil mevcut teknik borçtur.
- Frontend repo-geneli ESLint: 844 hata, 151 uyarı. Production build/typecheck başarılı olsa da lint borcu henüz kapanmamıştır.
- Backend repo-geneli ESLint: 4 GB heap sınırında OOM; sonuç kapı olarak kullanılamadı.

V02 snapshot, ürünün tamamlandığı veya 33 modülün runtime kabulünün bittiği anlamına gelmez. Bu commit güvenli bir geliştirme başlangıç noktası ve geri dönüş noktasıdır; modül kabul matrisi geçerliliğini korur.

Push öncesi güvenlik sertleştirmesi:

- Knowledge Sources CRUD, arama, işleme ve istatistik akışları tenant ve rol kapsamına alındı; odaklı 31/31 test geçti.
- WebSocket origin politikası ortam allowlist'ine bağlandı; odaklı 12/12 test geçti.
- Üç HTML render noktası DOMPurify ile temizleniyor.
- Sabit restore/seed parolaları ve parola logları kaldırıldı.
- Next.js `15.5.27` sürümüne yükseltildi; kullanılmayan eski `react-email` CLI kaldırıldı.
- Güvenlik açığı bulunan `xlsx` paketi `exceljs` ile değiştirildi.
- Production bağımlılık denetimi 5 kritik/47 yüksekten 0 kritik/22 yükseğe indirildi. Kalan transitif yüksek bulgular sonraki bağımlılık modernizasyon diliminde ele alınmalıdır.
- Push edilecek Git ağacında Gitleaks sonucu: 0 bulgu.
- Production deploy workflow'u yalnız manuel tetiklenir; ilk V02 push'u deployment başlatmaz.

## Coolify staging deployment hazırlığı — 2026-10-10

Yeni sunucuya kurulum için tek kaynak `/docker-compose.production.yml` olarak belirlendi. Stack sırası `postgres` (pgvector/PostgreSQL 16) + `redis` + `qdrant` + `cortex` + tek seferlik `migration` + `backend` + `frontend` biçimindedir. Backend yalnız bağımlılıklar sağlıklı ve migration başarılı olduğunda; frontend yalnız backend sağlıklı olduğunda başlar. Kalıcı veriler `postgres_data`, `redis_data`, `qdrant_data`, `uploads_data` ve `backups_data` volume'larında tutulur.

Zorunlu sırlar `DATABASE_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `BACKUP_ENCRYPTION_KEY`, `CORTEX_SERVICE_SECRET` ve `QDRANT_API_KEY`dir. Gerçek değerler repoya yazılmaz; Coolify secret/env alanında bağımsız değerler olarak saklanır. Qdrant anahtarı sunucuda da zorunlu tutulur; frontend veri ağına bağlanmaz. Public URL değişkenleri staging hostname'leriyle ayarlanır ve `NEXT_PUBLIC_*` değerleri build-time olduğu için hostname değişiminde frontend yeniden build edilir. Tam kurulum, health/readiness, backup ve rollback runbook'u `COOLIFY_DEPLOYMENT.md` içindedir.

Takip borcu: `JWT_REFRESH_SECRET` dağıtım sözleşmesinde ayrı tutulsa da mevcut `AuthService` refresh tokenlarını halen ana `JWT_SECRET` üzerinden imzalayıp doğruluyor. Ayrı refresh anahtarına geçiş mevcut oturumları sonlandıracağı için bağımsız bir auth migration işi olarak ele alınmalıdır.

Deployment kararı staging-first'tür. Güncel V02 GitHub CI run'ında migration job'u yeşildir; backend/frontend lint ve fail-closed production dependency audit kırmızıdır. Gitleaks tracked tree için 0 bulgu vermiştir, fakat production auditinde 0 kritik / 22 yüksek transitif bulgu kalmıştır. Bu planlama kapısı 10 Ekim hazırlık durumunu kaydeder. Kullanıcı 11 Ekim'de public domain bağlantısını açıkça istedi; domainin bağlanması tam ürün release kabulü anlamına gelmez ve açık CI/security/restore kapılarını kapatmaz.

Staging kabulü en az şunları kapsar: backend ve frontend `/api/health`, Qdrant `/readyz`, Cortex `/ready`, migration exit `0` ve tekrar çalıştırma idempotency'si; login, tenant izolasyonu, RBAC redleri, CRM, Forms idempotency/outbox ve Automation approval/dispatch; WebSocket origin allowlist; restart sonrası PostgreSQL/Redis/Qdrant/uploads kalıcılığı. Yalnız konteynerlerin healthy görünmesi release kanıtı değildir.

Her promotion öncesi PostgreSQL logical dump, beş kalıcı volume snapshot'ı, deploy edilen Git SHA/image/env revizyonu ve migration sonucu kaydedilir. Rollback önce bilinen iyi SHA/image'a yapılır; migration geri uyumsuzsa yazma trafiği durdurulur ve doğrulanmış deploy öncesi veritabanı/Qdrant/volume snapshot'ları matching uygulama SHA'sı ile geri yüklenir.

## Canlı domain ve outbox düzeltmesi — 2026-10-11

Kullanıcının açık talebiyle Coolify uygulaması `affexai.tr`, `www.affexai.tr` ve `api.affexai.tr` alan adlarına bağlandı; staging hostları geri dönüş yolu olarak korundu. Canlı URL sözleşmesi `APP_URL=https://api.affexai.tr`, `FRONTEND_URL=https://affexai.tr`, `NEXT_PUBLIC_API_URL=https://api.affexai.tr/api` ve iki public web originini içeren CORS allowlist biçimindedir.

İlk canlı gözlemde Cortex ve Automation outbox worker'ları `interval out of range` üretiyordu. Kök neden, TypeORM PostgreSQL sürücüsünün üst seviye `UPDATE ... RETURNING` için `[rows, rowCount]` döndürmesine rağmen worker'ların sonucu doğrudan satır listesi olarak işlemesiydi. Her iki claim sorgusu atomik `claimed AS (UPDATE ... RETURNING ...) SELECT * FROM claimed` biçimine geçirildi; `FOR UPDATE SKIP LOCKED`, tenant alanı ve lease-token fencing korundu.

Checkpoint ve canlı kanıt:

- Commit `1419332` (`fix: restore postgres outbox dispatch`) `origin/main` üzerine push edildi.
- İki worker için 13/13 odak testi, ilgili 15/15 regresyon testi ve backend typecheck geçti.
- İzole gerçek PostgreSQL harness'i 25 migration, tekrar 0, ayrık eşzamanlı claim, süresi dolan lease, stale ACK ve kayıp ACK retry senaryolarıyla geçti.
- Kod incelemesinde CRITICAL/HIGH bulgu yok; güvenlik incelemesinde CRITICAL/HIGH/MEDIUM bulgu yok.
- Coolify deployment `nd5l8ccgnmqotnq5f0foghlw` başarıyla tamamlandı; migration exit 0, backend/frontend healthy.
- Canlı backend loglarında `interval out of range` ve `outbox polling failed` eşleşmesi yok. `cortex_outbox` ve `automation_dispatch_outbox` satır sayıları deployment sonrası `0|0`.
- `https://affexai.tr/`, `https://www.affexai.tr/` ve `https://api.affexai.tr/api/health` HTTP 200 / TLS doğrulaması 0; `https://affexai.tr` originli API preflight HTTP 204 ve doğru `access-control-allow-origin` döndürüyor.
- Gerçek tarayıcıda `https://affexai.tr/login` AffeXAI Cortex portalı olarak render edildi.

Bu sonuç canlı temel stack'in yeni imajla çalıştığını ve boş kuyrukta polling hatası üretmediğini kanıtlar. Düzeltilen worker sözleşmesi izole gerçek PostgreSQL harness'inde kanıtlandı; canlı claim→deliver/ACK/retry akışı henüz tetiklenmedi. Forms/Automation tam son kullanıcı akışı, backup/restore tatbikatı, açık CI/lint/dependency borcu ve kalan modül kabul satırları tamamlanmadan ürünün bütünü yayın kabulü almış sayılmaz.

## Cortex Editorial portal pilotu — 2026-10-11

Frontend tasarım kararı tek sözleşmeye bağlandı: Radix/shadcn erişilebilir davranış katmanı olarak korunur; ürün kimliği Cortex Editorial token, pattern ve shell katmanından gelir. `BccEditorialWrapper` tasarım yönünün güçlü kanıtıdır, ancak portal için birebir yoğunluk şablonu değildir. Kanonik kararlar kök `DESIGN.md` ve `UX-CONTRACT.md` dosyalarındadır.

İlk pilot `/portal/dashboard` ve ortak portal shell üzerinde uygulandı:

- rol tabanlı desktop/mobile navigasyon tek immutable policy modelinden üretiliyor;
- debug `Caching Test`, eski kartlar ve Allplan/XYZ Company kopyaları yeni kabukta görünmüyor;
- skip link, landmark, `aria-current`, görünür focus, drawer ve responsive sidebar sağlandı;
- dashboard gerçek auth/tenant/rol, activity ve event API verisini kullanıyor; loading, empty ve error durumları kalıcı;
- portal light/dark semantik tokenları, `--cortex-*` component adapterları, görünür scrollbar, reduced-motion ve forced-colors davranışı tanımlandı;
- runtime `DesignTokensProvider` selector çakışması portal scope özgüllüğüyle sınırlandı; provider içindeki portal/public alias birleşimi sonraki migration borcudur.

Portalın etkinlik yüzeyi backend yetki sözleşmesiyle eşitlendi. Published upcoming yanıtı iç yapılandırma/tenant/audit alanlarını taşımayan sınırlı özet projeksiyonu döndürür. `events.participants` legacy izni idempotent migration ile `events.manage_attendees` adına dönüştürülür; portal etkinlik bağlantısını gören standart customer/student/subscriber/viewer/admin/organization_owner rolleri `events.view` alır. Seed ve rol katalogları aynı kanonik adlara geçirildi. Kullanıcı senkronizasyonu doğrulanmış `/users/me` sonucunu aynı sekmede doğrudan AuthContext'e aktarır; diğer sekmeler yalnız invalidation sinyaliyle yeniden okur.

Doğrulama: portal saf fonksiyon testleri 12/12; event guard, public projection ve migration testleri 23/23; frontend/backend typecheck; hedefli ESLint; `designmd lint` 0 error; production Docker build 205 route ve gerçek Chromium customer oturumunda desktop/mobile kabul geçti. Mobil drawer açıldı, yatay overflow olmadığı ve başlık/rol bazlı aksiyonların doğru render edildiği doğrulandı. İzole PostgreSQL migration sayısı 25'ten 26'ya çıktı; ikinci çalıştırma 0 pending döndürdü. Legacy customer izni kanonik attendee iznine çevrildi ve `events.view` eklendi. Gerçek HTTP kabulünde upcoming isteği 200, customer event oluşturma denemesi 403 döndürdü; özet yanıt yalnız sözleşmedeki dokuz alanı taşıdı. Geçici event silindi ve fixture parolası geri yüklendi. Bu pilot proje genelinin UI göçünü tamamlamaz; sıradaki UI dilimleri kalan portal rotaları, tenant admin CRUD yüzeyleri, platform admin ve özel CMS/builder workbench olarak ilerlemelidir.

Production auth hardening borcu açıktır: access/refresh tokenlarının JavaScript tarafından okunabilen localStorage katmanından HttpOnly/Secure/SameSite cookie oturumuna taşınması ve ölçülmüş CSP politikasının devreye alınması ayrı migration gerektirir. Pilot diffinde açık CRITICAL/HIGH güvenlik blockerı yoktur; bu borç kapanmadan auth yüzeyi tam production kabulü almaz.

İzole kabul harness'i için `docker-compose.test.yml` frontend/backend servislerine host erişimli `g0-edge` ağı eklendi ve tenant selector HTML pattern'i modern Chromium `v` regex kurallarıyla uyumlu hale getirildi. Bunlar canlı ortam değişikliği değildir.

## UI/UX F0 — public yüzey hasarı durduruldu — 2026-10-13

Plan: `docs/active/AffeXAI-Cortex_UIUX_Yol_Haritasi_F0-F4.md` (bug ID'leri kökteki UI/UX GAP & BUG raporundan). Yerel commit; push/deployment yapılmadı.

- **B01/B17:** test, demo, `backup-*` ve `(public-backup)` altındaki eski Aluplan rotaları route olmayan `apps/frontend/src/app/_dev/` altına taşındı. Bu yollar artık `[...slug]` catch-all üzerinden markalı 404 döner. `/privacy` ve `/terms` yerinde kaldı.
- **B02:** public header ve footer varsayılanları `AffeXAI`. Footer bağlantıları emekliye ayrılan rotalar yerine yaşayan sayfalara gidiyor.
- **B03/B04:** sertifika, SLA, latency, enclave ve ayrı şema iddiaları kaldırıldı. Modül rozetleri `src/lib/marketing/module-status.ts` üzerinden kabul matrisine bağlı; matris değişince bu dosya aynı changeset'te güncellenmeli.
- **B05 (D5):** `/pricing` fiyat ve checkout göstermeyen bir erken erişim sayfası oldu. CTA `mailto:` adresine gidiyor (`NEXT_PUBLIC_CONTACT_EMAIL`, varsayılan `info@affexai.tr`). Form F1'de gelecek.
- **B06:** about, support, contact ve products ortak `CmsBackedPage` kullanıyor. Ziyaretçi Türkçe bekleme/hata durumu görüyor; CMS kısayolu yalnız `cms.edit` yetkili oturuma görünüyor. Sayfalar artık build'e gömülmüyor.
- **B09:** üç giriş formunda `label htmlFor` bağlantısı var. "System Status" artık buton değil. İngilizce büyük harfli dekoratif metinlerde `lang="en"` kullanılıyor.
- **B11 (D3):** hukuk sayfaları `noindex, nofollow` ve görünür taslak bandı taşıyor.
- **B12:** markalı Türkçe `not-found.tsx`, `favicon.ico` ve `icon.svg` eklendi. Her pazarlama rotasının ayrı `<title>`'ı var.
- **B13:** ortak `MarketingHeader` (Radix Dialog drawer, `lg` altı mobil menü) ve `MarketingFooter` eklendi.
- **D1:** iki dilli seçildi. Public metinler `src/lib/i18n/public-copy.ts` içinde TR/EN olarak tutuluyor, TR aktif. Dil yönlendirmesi F1'de kararlaştırılacak, çünkü `/en` öneki `[tenant]` segmentiyle çakışıyor.

Doğrulama: frontend typecheck 0; değişen 36 dosyada ESLint 0; production build 0; yeni unit testler (`pnpm exec tsx --test ...`) 8/8; production server :9003 curl taraması plandaki beklenen kodları verdi; Chromium 375/768/1280 px'te 11 rotada yatay taşma yok; mobil menü yalnız klavyeyle çalışıyor.

Pre-commit notu: makinede `npx` yok; root'ta `eslint` ve `prettier` da yok. Hook atlanmadı. Scratchpad'deki shim'lerle çalıştırıldı: `npx` → `pnpm exec`, `eslint` → `apps/frontend` kurulumu ve config'i, `prettier` → `apps/backend/node_modules/.bin/prettier` (3.9.9). Repo daha önce Prettier'dan geçmediği için lint-staged stage'deki 84 dosyayı yeniden biçimlendirdi. Taşınan arşiv dosyalarındaki 18 eski lint hatası (kaçışsız tırnak; `backup-home`'da try/catch içinde JSX) kullanıcı kararıyla düzeltildi. Biçim değişikliği yüzünden 41 taşınan dosya git'te rename yerine sil+ekle olarak görünüyor; geçmiş `git log --follow` ile izlenebilir. Kalıcı çözüm için root'a `eslint`/`prettier` devDependency eklemek ayrı bir iş.

Açık kalanlar sonraki fazlara bırakıldı: pazarlama gövde metni (F1), giriş ekranı dili ve iddiaları (F2), CMS blok kataloğundaki Allplan verisi (F3.8), `/portal/*-test` ve demo rotaları (F3), provider debug logları.

## UI/UX F1 — anlatı, token ve erken erişim akışı — 2026-10-13

Plan: `docs/active/AffeXAI-Cortex_UIUX_Yol_Haritasi_F0-F4.md`. Yerel commit; push/deployment yapılmadı.

- **Site haritası (D1):** TR kökte (`/`, `/moduller`, `/nasil-calisir`, `/erken-erisim`, `/iletisim`), EN `/en/...` altında (`modules`, `how-it-works`, `early-access`, `contact`). Rota haritası `apps/frontend/src/lib/marketing/routes.ts`. Eski `/modules`, `/architecture`, `/manifesto`, `/features`, `/pricing` yolları `next.config.ts` içinde 308 ile yönleniyor. Manifesto, mimari ve özellikler sayfaları kaldırıldı.
- **`en` rezervasyonu:** `packages/shared-types/src/tenant-slug.types.ts` tek kaynak. Frontend tenant seçimi ve middleware `/en/...` yolunu tenant saymıyor. Backend `OrganizationsService.createOrganization` rezerve slug'ları reddediyor.
- **Metin:** TR/EN sözlükler `apps/frontend/src/lib/i18n/copy/{tr,en}.ts`; ikisi aynı arayüzü uyguluyor. Modül sayısı ve durumları `lib/marketing/module-status.ts` içinden geliyor; bir test bu dosyanın kabul matrisi dosyasıyla birebir eşleştiğini doğruluyor. Matris değişince test kırılır, iki dosya birlikte güncellenmeli.
- **Görsel dil:** `globals.css` içine `.theme-marketing` eklendi (DESIGN.md koyu değerleri; aynası DESIGN.md "Pazarlama teması"). Pazarlama bileşenleri yalnız semantik sınıf kullanıyor; hex renk, 100/200 font ağırlığı ve 9–11 px metin yok. Kullanılmayan `PricingCard` ve sahte ödeme akışı içeren `CheckoutModal` kaldırıldı.
- **Erken erişim formu (D2):** `EarlyAccessForm` public Forms API'sine gönderiyor. İdempotency anahtarı içeriğe bağlı (aynı içerikle yeniden deneme aynı anahtarı kullanır, içerik değişince yeni anahtar üretilir). Honeypot yalnız istemcide; dolu gelirse istek gönderilmiyor. Blur ve submit'te doğrulama, ilk hatalı alana odak, sayfa içi başarı/hata/429 durumları var. Form şablonu: `apps/backend/src/modules/forms/templates/early-access.json` (şema testi `early-access-template.spec.ts`).
- **Dağıtımda yapılacaklar:** `affexai` kuruluşunu oluşturun, şablondaki formu bu tenant'ta yayımlayın, frontend build'ine `NEXT_PUBLIC_EARLY_ACCESS_FORM_TENANT=affexai`, `NEXT_PUBLIC_EARLY_ACCESS_FORM_ID=<form uuid>` ve `NEXT_PUBLIC_SITE_URL=https://affexai.tr` verin. Ayar yoksa form yerine e-posta yolu gösterilir.
- **SEO:** `app/sitemap.ts` (10 URL, hreflang), `app/robots.ts` (ürün yüzeyleri kapalı); sayfalarda canonical, hreflang ve Open Graph var.
- **B15:** `/help` için boş, hata (yeniden dene) ve sonuç-yok durumları eklendi. Veri yükleme effect dışına taşındı.

Doğrulama: frontend/backend typecheck 0; değişen dosyalarda ESLint 0; frontend unit 30/30, backend forms şablonu 3/3 ve organizations 6/6; production build 0; axe 11 sayfa × 375/1280 px'te 0 ihlal ve 0 yatay taşma. İzole stack'te (güncel kaynaktan backend imajı, migration 0 hata) klavyeyle gönderilen başvuru `form_submissions` ve `crm_leads` tablolarına yazıldı. Test sırasında izole harness'in CORS allowlist'i nedeniyle frontend `:19003` origin'inden sunuldu; stack sonrasında `down --volumes` ile kaldırıldı.

Not: `cn()` içindeki tailwind-merge, `focus-visible:outline` ile `outline-2` birlikte verildiğinde ilkini düşürüyor ve odak çizgisi kayboluyor. Pazarlama odak göstergesi bu yüzden `components/ui/button` gibi ring yardımcılarına geçirildi ve klavye Tab'ıyla görünür olduğu doğrulandı. Bu tuzak axe ile yakalanmıyor.

Açık kalanlar: gerçek hukuk metinleri (D3), backend'in CORS reddini 500 olarak döndürmesi (403 olmalı), axe taramasının CI'a eklenmesi (`axe-core` şu an yalnız geçişli bağımlılık). Değişen `organizations.service.ts` dosyasında backend ESLint'in raporladığı 18 `no-unsafe-*` hatası HEAD'de de birebir aynı; dokunulmayan üyelik metotlarındaki `manager.query` sonuçlarından geliyor ve ayrı bir iş olarak bırakıldı.

## Sonraki oturum: buradan başla — 2026-10-13

Oturum token limiti nedeniyle F1 sonunda durduruldu. Planlanan devam: 13 Ekim 2026, 23:30 (Europe/Istanbul).

**Commit durumu (yerel, push yok):**

```text
b932eb0 feat(marketing): unify narrative, tokens and early-access flow (F1)
567c9a1 fix(frontend): stop public-surface damage (F0)
5addb3d docs: add UI/UX roadmap F0-F4
```

Çalışma ağacında yalnız bu plana ait olmayan dosyalar açık. Bunlara dokunmayın, commit'e almayın: üç ticket e-posta şablonu, kökteki UI/UX GAP & BUG raporu (`.md`/`.pdf`) ve `docs/evidence/`.

**Sıradaki iş: F2 · Giriş ve onboarding.** Plan dosyası: `docs/active/AffeXAI-Cortex_UIUX_Yol_Haritasi_F0-F4.md`.

1. Fazın başında kullanıcıya D4'ü sorun (self-serve kayıt; varsayılan: kapalı, davet tabanlı, `/signup` → `/erken-erisim`). Oturum hardening'inin (localStorage → HttpOnly cookie) F2'de yapılıp yapılmayacağını da sorun; bu adım mevcut oturumları sonlandırır.
2. F2 maddeleri:
   - Tek `LoginForm`: `/login`, `/admin/login`, `/[tenant]/admin/login`.
   - E-postadan tenant keşfi; varlık bilgisi sızdırmamalı.
   - Rol bazlı yönlendirme.
   - `/signup` davet akışı.
   - Form davranışı UX-CONTRACT'a uygun olmalı.
3. Doğrulama: iki tenant (A/B) ile Playwright E2E. İzole stack komutları `docker-compose.test.yml` başındaki yorumda.

**Her fazda tekrar eden kurallar ve araçlar:**

- **Kullanıcı tercihi:** her faz sonunda dur, kısa özet ver, sonraki faz için onay bekle. `git add .` yok, `--no-verify` yok, push/deploy yok.
- **Pre-commit hook:** makinede `npx` yok, root'ta `eslint`/`prettier` yok. Hook atlanmadan şu shim'lerle çalıştırıldı (scratchpad `bin/` klasöründe, oturum değişince yeniden oluşturun):
  - `npx` → `exec pnpm exec "$@"`
  - `eslint` → `cd apps/frontend && exec ./node_modules/.bin/eslint "$@"`
  - `prettier` → `exec apps/backend/node_modules/.bin/prettier "$@"`
  - Önerilen sıra: stage → `PATH=<shim>:$PATH node_modules/.bin/lint-staged` → doğrulamayı tekrarla → commit.
  - Backend dosyalarını ayrıca `apps/backend` ESLint config'iyle kontrol edin; shim frontend config'ini kullanıyor.
- **Prettier:** biçimlendirme ilk geçişte idempotent olmayabilir; commit öncesi `prettier --check` çalıştırın.
- **Paket yolları:** parantezli veya köşeli yollar (`(marketing)`, `[...slug]`) için `git --literal-pathspecs add --pathspec-from-file=...` kullanın.
- **Testler:**
  - Frontend birim testleri: `cd apps/frontend && pnpm exec tsx --test <dosyalar>`.
  - Backend: `cd apps/backend && pnpm exec jest <spec>`.
  - Frontend typecheck'ten önce `pnpm build` gerekebilir; taşınan veya silinen rotalar eski `.next/types` dosyalarında hata bırakıyor.
- **Tarayıcı ve axe:** `pnpm build && pnpm exec next start -p 9003`. axe taraması `axe-core@4.14.0` (pnpm store) ve önbellekteki Chromium (`~/Library/Caches/ms-playwright/chromium_headless_shell-1248`) ile yapıldı. CI'a alınması açık bir iş.
- **Form E2E:** izole harness'in CORS allowlist'i yalnız `:19003` origin'ini kabul ediyor. Frontend'i `NEXT_PUBLIC_API_URL=http://localhost:19003 BACKEND_URL=http://127.0.0.1:19006` ile build edip `-p 19003`'te sunun.
- **Tailwind tuzağı:** `cn()` (tailwind-merge) `focus-visible:outline` ile `outline-2`'yi birlikte görünce `outline`'ı düşürüyor. Odak için ring yardımcılarını kullanın.

**Açık borçlar (F0/F1'den):**

- Gerçek hukuk metinleri (D3).
- Backend CORS reddini 500 döndürüyor (403 olmalı).
- axe ve klavye testleri CI'da değil.
- `organizations.service.ts` içinde HEAD'den gelen 18 `no-unsafe-*` lint hatası.
- CMS blok kataloğunda Allplan verisi (F3.8).
- `/portal/*-test` ve demo rotaları (F3).
- Provider debug `console.log` gürültüsü.
- Giriş ekranlarındaki jargon ve `QUANTUM_RESISTANT` iddiası (F2'de kalkacak).
- graphify: bu repo için henüz graf üretilmedi (`graphify-out/` yok).

## UI/UX F2 — tek giriş, tenant keşfi ve rol bazlı yönlendirme — 2026-10-14

- **Tek giriş:** `/login`, `/admin/login` ve `/<tenant>/admin/login` aynı `components/auth/LoginForm` + `AuthShell` bileşenlerini kullanıyor (Cortex Editorial portal token'ları). Yeşil "portal gateway", amber "access protocol" ekranları, jargon ve `QUANTUM_RESISTANT` iddiası kalktı. `/portal/login` `/login`'e yönleniyor. Kullanılmayan `modules/auth/components/login-form.tsx` kaldırıldı.
- **Tenant keşfi (B10):** çalışma alanı kodu artık isteğe bağlı.
  - Yeni `POST /auth/login/discover` ucu yalnız şifresi eşleşen, aktif ve doğrulanmış hesapları değerlendiriyor. Tek eşleşme normal tenant giriş yolundan oturum açıyor; birden fazla eşleşme token vermeden çalışma alanı listesi döndürüyor.
  - Bilinmeyen e-posta ile yanlış şifre aynı 401'i alıyor; zamanlama sahte bir bcrypt karşılaştırmasıyla eşitleniyor.
  - Uç dakikada 10 istekle sınırlı.
  - Adaylar `hasUsableMembership` kuralıyla süzülüyor. Bu kural `JwtAuthGuard` ile ortak (`core/auth/session-eligibility.ts`): kuruluşu pasif olan ya da üyeliği bulunmayan hesaplar seçim listesine girmiyor.
- **Rol bazlı yönlendirme:** `lib/auth/post-login-destination.ts` tek kaynak.
  - Platform yöneticisi → `/editorial-console`.
  - Tenant ekibi → `/<tenant>/admin/...`.
  - Portal kullanıcısı → `/portal/dashboard`; profili eksikse `/complete-profile`.
  - `redirect` yalnız kullanıcının kendi kabuğunda ve tenant'ında kabul ediliyor; giriş sayfaları hedef olamıyor (döngü engeli).
- **BFF:** `/api/auth/login` tenant başlığı varsa `/auth/login`'e, yoksa keşfe gidiyor. Seçim gerekiyorsa cookie yazmıyor. Gövdedeki `tenantId`'ye güvenilmiyor.
- **Kayıt (D4):** `/signup`, `/admin/signup` ve `/<tenant>/signup` `/erken-erisim`'e yönleniyor. Eski `admin/(auth)/signup/actions.ts` kaldırıldı; hiçbir kayıt yapmadan "Kayıt başarılı" diyor ve şifre dahil form verisini sunucu loguna yazıyordu.
- **Form davranışı:** blur ve submit'te alan hatası, inline özet, ilk hatalı alana odak, sade Türkçe hata mesajları (401/400, 429, 5xx, ağ hatası). Ham sunucu metni gösterilmiyor.

Doğrulama:
- typecheck 0; frontend unit 57/57; backend auth+organizations+forms 108/111. Kalan 3 hata bir HEAD worktree'sinde birebir tekrarlandı, önceden vardı.
- Değişen backend dosyalarında yeni lint hatası yok.
- İzole stack'te iki tenant'lı klavye E2E 6/6; giriş sayfalarında axe 0 ihlal.
- E2E komutu: `LOGIN_ACCEPTANCE_ISOLATED=1 BASE_URL=http://localhost:19003 CHROME_PATH=<chromium> node apps/frontend/scripts/acceptance/login-two-tenants.cjs`. Önkoşul: güncel backend imajı ve frontend'in `:19003`'te sunulması. Keşif ucu oran sınırlı olduğu için dakikada en fazla bir tur çalıştırın.

Açık:
- Oturum hardening (HttpOnly cookie geçişi) ayrı bir auth dilimi olarak duruyor.
- Backend `/auth/register` hâlâ self-serve kayıt kabul ediyor; D4 ile tutarlı hale getirilmeli.
- Tenant girişi `/auth/login` kuruluş üyeliğini kontrol etmeden token veriyor; o token sonraki istekte reddediliyor.
- `refreshAccessToken` ve kuyruk paneli testlerindeki 3 eski kırmızı test.

## UI/UX F3.0 — bildirim, diyalog, sayfa pattern'leri, tek tema sahibi — 2026-10-14

- **Tek bildirim sistemi:** `src/lib/notify.ts`, sonner'ın kullanılan alt API'sini (`success/error/info/warning/loading/dismiss/promise`, `id` ile güncelleme) `hooks/use-toast` üzerinden sunuyor. 26 dosyanın `sonner` import'u buna çevrildi. Kök layout'ta yalnız `use-toast` `<Toaster>`'ı mount edildiği için bu dosyaların bildirimleri önceden kullanıcıya hiç görünmüyordu.
- **Diyalog servisi:** `lib/dialogs/dialog-queue.ts` (`confirmDialog`, `promptDialog`) ve kök layout'taki `components/patterns/DialogHost`. Tarayıcı `alert/confirm/prompt` yerine Promise döndüren Radix alert-dialog kullanılıyor. Host yoksa onay `false`, giriş `null` döner. Yıkıcı onaylarda ilk odak "Vazgeç" üzerinde. F3.1 bunu kullanacak.
- **Sayfa pattern'leri:** `components/patterns/page-states.tsx`: `PageHeader`, `EmptyState`, `NoResultsState`, `ErrorState`.
- **`useAsyncEffect` (`hooks/use-async-effect.ts`):** mount veya bağımlılık değişiminde veri yükleyen effect'ler için. Yükleyiciyi commit sonrasına erteliyor, iptal bayrağı veriyor. React Compiler'ın `set-state-in-effect` kuralını gerçek bir düzeltmeyle karşılıyor.
- **Tek tema sahibi:** `DesignTokensProvider` modu artık `next-themes`'ten alıyor. Kendi mode state'i, localStorage anahtarı ve `<html>`'e elle `dark` ekleyen kodu kaldırıldı; debug logları temizlendi. Önceden public sayfalara localStorage'daki bayat değerle admin-dark token'ları basılıyordu.
- **Public kabuk:** mobil menü düğmesine erişilebilir ad ve `aria-expanded`, breadcrumb'daki ev ikonuna "Ana sayfa" etiketi eklendi; yükleniyor metinleri token rengine geçti.

Not: pre-commit hook dokunulan her dosyayı lint'liyor. F3 dilimlerinde eski dosyalardaki hatalar dosya dokunuldukça düzeltiliyor. Scratchpad araçları (`fix-entities.cjs`, `move-effects.cjs`, `async-effects.cjs`) ESLint JSON çıktısıyla mekanik düzeltmeleri yapıyor.

Açık: eski public CMS kabuğunun token seti (`publicLightTokensProduction` adına rağmen koyu değerler taşıyor) beyaz header'da kontrast hatası veriyor; F3.6'da ele alınacak.

## UI/UX F3.1 — tarayıcı diyaloglarının kaldırılması — 2026-10-14

- **Dönüşüm:** 42 dosyada `alert` → `notify.error/success/info`, `confirm` → `await confirmDialog({ title, destructive })`, `prompt` → `await promptDialog({ title, label, defaultValue })`. Çağıran fonksiyonlar async yapıldı. Kalan eşleşmeler kabul edilen istisnalar: `confirm-subscription` sayfasındaki fonksiyon adı, `dialog-queue` metotları, `ai/flows/support-ticket-analysis.ts` içindeki Genkit `prompt()`.
- **Kabul testi:** `apps/frontend/scripts/acceptance/crm-confirm-dialog.cjs` izole G0 stack'inde (`:19003` frontend, `:19006` backend) bir tenant + `organization_admin` + müşteri seed'liyor; Escape'in kaydı değiştirmediğini, "Pasifleştir"in API'den kalıcı olduğunu, ilk odağın "Vazgeç"te olduğunu doğruluyor; herhangi bir native dialog açılırsa düşüyor. Giriş keşfi dakikada 10 istekle sınırlı; testi dakikada bir kereden sık koşma.
- **Token:** light tema `--destructive` 0 84% 60% → 0 72% 45%. Eski değer beyaz metinle AA'yı geçmiyordu (yıkıcı düğmeler).
- **Lint borcu:** dokunulan eski dosyalardaki hatalar düzeltildi (entity kaçışları, effect'lerin bildirimlerin altına taşınması, yükleyicilerde `useAsyncEffect`, türetilmiş sıfırlamalar için "render sırasında state ayarlama": CRM sayfa numarası, rich-text-editor liste durumu).
- **Test koşucusu notu:** `pnpm exec tsx --test` ile koşan node:test dosyaları yeşil. 22 dosya Jest API'si (`describe`, `jest`, `@testing-library/react`) kullanıyor ve bu koşucuda yüklenmiyor; durum HEAD'de de aynı. Ayrı bir test altyapısı işi olarak açık.

Açık: diğer ekranlardaki onayların `destructive` işareti dönüştürücünün tahmini (silme/kaldırma = yıkıcı). F3.4/F3.5 E2E'lerinde ekran ekran doğrulanacak.

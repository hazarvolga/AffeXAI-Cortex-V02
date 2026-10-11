# AffeXAI Cortex — Geliştirme Handoff

**Son güncelleme:** 11 Ekim 2026, Europe/Istanbul

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

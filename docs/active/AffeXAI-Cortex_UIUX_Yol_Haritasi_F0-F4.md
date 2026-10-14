# AffeXAI Cortex — UI/UX Uygulama Planı (F0–F4)

**Tarih:** 13 Ekim 2026
**Kaynak:** UI/UX GAP & BUG Raporu (13.10.2026) — kökteki `AffeXAI Cortex — UI UX GAP & BUG Raporu.md`
**Kapsam:** Kullanıcının gördüğü yüzey (pazarlama, public, giriş, portal, tenant admin, BCC). Backend kabul kapıları (G0–G5) bu planın dışındadır ve `AffeXAI-Cortex_Modul_Kabul_Matrisi.md` geçerliliğini korur.

## 0. Çalışma kuralları (her faz için geçerli)

1. Önce `DEV_HANDOFF.md`, `docs/active/AffeXAI-Cortex_Modul_Kabul_Matrisi.md`, `DESIGN.md`, `UX-CONTRACT.md` ve bu dosyayı oku.
2. `git status --short` ile mevcut değişiklikleri gör. Şu dosyalar bu plana ait değildir, **dokunma ve commit'e alma**:
   - `apps/backend/src/modules/tickets/templates/sla-approaching-alert.html`
   - `apps/backend/src/modules/tickets/templates/sla-breach-alert.html`
   - `apps/backend/src/modules/tickets/templates/ticket-escalated.html`
   - kökteki rapor `.md` / `.pdf` dosyaları ve `docs/evidence/`
3. `git add .`, `git reset --hard`, toplu `stash`, `clean` kullanma. Commit'te yalnız fazın dosyalarını açıkça seç.
4. Pre-commit hook'unu atlama (`--no-verify` yok).
5. Push ve deployment **yapma**. Kullanıcı ayrıca isterse yapılır.
6. Bir faz yalnız aşağıdaki "Doğrulama" bölümü geçince commit edilir. Geçmeyen kontrol varsa commit etme, nedenini kullanıcıya yaz.
7. Her faz sonunda bu dosyanın en altındaki "İlerleme kaydı" tablosuna bir satır ekle ve `DEV_HANDOFF.md`'ye kısa bir bölüm yaz.
8. Ürün kararı gerektiren noktalar (§ Kararlar) varsayılanla ilerletilebilir; seçilen varsayılanı commit mesajında ve ilerleme kaydında belirt.

### Ortak doğrulama komutları

```bash
pnpm --filter @affexai/shared-types build
cd apps/frontend && pnpm typecheck
cd apps/frontend && pnpm exec eslint <değişen dosyalar>      # repo-geneli lint borcu ayrı; yalnız değişen dosyalar temiz olmalı
cd apps/frontend && pnpm build                              # production build exit 0
cd apps/frontend && pnpm dev                                # localhost:9003 üzerinde tarayıcı kontrolü
```

Tarayıcı kontrolü: Chromium, 375 / 768 / 1280 px, light + dark (varsa), yalnız klavye ile gezinme, konsolda yeni hata yok.

## Kararlar (kullanıcıya fazın başında sor; cevap yoksa varsayılanla ilerle)

| # | Karar | Varsayılan |
|---|---|---|
| D1 | Pazarlama dili: TR, EN veya iki dilli | Türkçe birincil; EN sonra i18n ile |
| D2 | "Erken erişim / demo talebi" nereye düşsün | Mevcut Forms modülü → CRM lead (tenant: platform/AffeXAI) |
| D3 | Gizlilik / kullanım koşulları | F0'da `noindex` + açık "taslak" bandı; gerçek metin kullanıcıdan |
| D4 | Self-serve kayıt açık mı | Kapalı; davet tabanlı. `/signup` "Erken erişim talep et" akışına yönlenir |
| D5 | Fiyatlar gösterilsin mi | Hayır; "Erken erişim" ve iletişim |

## F0 · Hasarı durdur (0–3 gün)

**Hedef:** Canlı public yüzeyde test ekranı, yanlış marka ve kanıtsız iddia kalmasın.

| ID | İş | Dosyalar (başlangıç noktası) | Kabul kriteri |
|---|---|---|---|
| B01 / B17 | Test, demo ve eski Aluplan rotalarını production'da kapat | `apps/frontend/src/app/` altında: `test-editor`, `test-list`, `test-move`, `test-dynamic-blocks`, `cms-demo`, `cms-demo-enhanced`, `cms-drag-drop-demo`, `cms-responsive-demo`, `cms-component-test`, `backup-home`, `backup-products`, `backup-downloads`, `backup-solutions`, `(public-backup)`, `_archived_*` | Tercih: `apps/frontend/src/app/_dev/` gibi route olmayan bir yere taşı veya `NODE_ENV==='production'` iken middleware'de 404. Production build'de bu yollar 404 döner. Taşırsan import kırılmadığını typecheck doğrular |
| B02 | "ALLPLAN TÜRKİYE" sabitini kaldır | `src/components/layout/header.tsx:22` | Varsayılan ad site ayarından (`settings`) gelir; yoksa "AffeXAI". Kodda `ALLPLAN` sabiti kalmaz (bu dosyada) |
| B03 | Kanıtsız iddiaları kaldır | `src/app/(marketing)/page.tsx`, `modules/page.tsx`, `pricing/page.tsx`, `architecture/page.tsx`, `features/page.tsx` | ISO/IEC 27001, SOC 2, GDPR/CCPA "VERIFIED", "99.95% SLA", "<0.002ms", "cryptographic enclaves", "Dedicated PostgreSQL schemas", "mathematically impossible", "Cryptographic signature validated" metinleri yok. `grep -rnE "SOC 2|27001|99\.95|0\.002|enclave|mathematically" src/app/\(marketing\)` boş |
| B04 | Mod. durumlarını dürüstleştir | `(marketing)/page.tsx` "Operational Module Index", `modules/page.tsx` | "ACTIVE/STABLE/Operational" yerine kabul matrisiyle uyumlu "Erken erişim" / "Yol haritasında". Hiçbir modül matristeki durumundan ileri gösterilmez |
| B05 | `/pricing` boş durumu + erken erişim | `(marketing)/pricing/page.tsx`, `components/marketing/PricingCard.tsx` | Ürün listesi boşsa veya hata alınırsa sayfa içi açıklama + "Erken erişim talep et" CTA'sı görünür. `alert()` kalmaz. Header'daki "Request Access" bu CTA'ya gider. (Form F1'de; F0'da `mailto:` veya `/contact` yeterli) |
| B06 | CMS hata ekranında admin butonunu gizle | `src/app/about/page.tsx`, `support/page.tsx`, `contact/page.tsx`, `products/page.tsx` | Anonim ziyaretçi "Go to CMS Panel" görmez; hata metni Türkçe; yalnız oturumlu editör için panel bağlantısı |
| B09 | Giriş formu erişilebilirliği | `src/app/login/page.tsx`, `src/app/admin/(auth)/login/page.tsx`, `src/app/[tenant]/admin/login/page.tsx` | Her input bir `<label htmlFor>` ile bağlı; "SYSTEM STATUS" bir `button` değil; dekoratif uppercase metinde `lang="en"` veya düz metin (ONLİNE hatası yok) |
| B11 | Hukuk sayfaları | `/privacy`, `/terms` kaynağı (CMS veya app route) + pazarlama footer'ı (`architecture/page.tsx:254`) | `<meta name="robots" content="noindex">` + görünür taslak bandı; footer bağlantıları gerçek `<Link>` |
| B12 | 404, favicon, sayfa başlıkları | yeni `src/app/not-found.tsx`, `src/app/icon.svg` (veya `public/favicon.ico`), her `(marketing)/*/page.tsx` için `metadata` | Markalı Türkçe 404 + ana sayfaya dönüş; `/favicon.ico` 200; her pazarlama sayfasının `<title>`'ı farklı (`[Sayfa] · AffeXAI Cortex`) |
| B13 | Mobil menü | yeni `src/components/marketing/MarketingHeader.tsx` (6 sayfadaki kopya header'ı tek bileşene çıkar) | 375 px'te menü düğmesi + drawer; Login ve tüm bağlantılar erişilebilir; Escape kapatır, odak geri döner |

**Doğrulama:** ortak komutlar + şu kontrol:
```bash
for r in / /pricing /modules /architecture /features /manifesto /about /support /privacy /test-editor /cms-demo /backup-home /olmayan-sayfa /favicon.ico; do
  printf "%s " $r; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9003$r; done
```
Beklenen: test/demo/backup → 404, olmayan-sayfa → markalı 404, favicon → 200, diğerleri → 200.

**Commit:** `fix(frontend): stop public-surface damage (F0)` — gövdede B-ID listesi ve seçilen varsayılan kararlar.

## F1 · Anlatı ve marka (1.–2. hafta)

**Hedef:** Pazarlama sitesi tek, dürüst, Türkçe ve DESIGN.md ile uyumlu olsun.

1. **Site haritası (D1, D5):** Ana sayfa · Modüller · Nasıl çalışır · Erken erişim · İletişim. `manifesto` + `architecture` → tek `/nasil-calisir` (eski yollar 308 redirect). `features` içeriği ana sayfaya veya modüllere eritilir.
2. **Metin:** Jargon yerine sade Türkçe ("Initialize Authorization", "Neural Density", "Terms of Logic", "System Disclosure" çıkar). Modül sayısı tek kaynaktan: 33 (kabul matrisi). Certificates = etkinlik/eğitim sertifikası.
3. **Görsel dil:** `(marketing)/layout.tsx` içindeki sabit renkleri (#0a0a0a, #050505, #f9f906, #f9bc06, #444, #666) `globals.css` semantik tokenlarına bağla; tek amber = `--editorial-signal`. Pazarlama için koyu tema DESIGN.md dark değerlerini kullanır. Manifestonun mor/mavi paleti kaldırılır.
4. **Okunabilirlik (B14):** gövde ≥ 16 px, yardımcı ≥ 14 px, etiket ≥ 12 px; font-weight ≥ 300; kontrast ≥ 4.5:1 (büyük başlık ≥ 3:1).
5. **Erken erişim formu (D2):** `/erken-erisim` sayfası, mevcut public Forms submission API'sine bağlı; idempotency anahtarı, honeypot alanı, başarı/hata durumları sayfa içinde. Gönderim CRM lead olarak görünür.
6. **SEO temeli:** `app/sitemap.ts`, `app/robots.ts`, sayfa bazlı `metadata` + Open Graph.
7. **Boş durumlar (B15):** `/help` kategorisi yoksa "Henüz makale yok" + destek/iletişim CTA'sı.

**Doğrulama:** ortak komutlar; axe (ör. `@axe-core/playwright`) ile 5 pazarlama sayfasında ciddi/kritik ihlal 0; 375 px'te yatay kaydırma yok; formdan gönderilen kayıt CRM'de görünür (yerel stack); `grep -rnE "#f9f906|#f9bc06|#050505" src/app/\(marketing\)` boş.

**Commit:** `feat(marketing): unify narrative, tokens and early-access flow (F1)`

## F2 · Giriş ve onboarding (3.–4. hafta)

**Hedef:** Tek giriş deneyimi, doğru tenant'a sürtünmesiz ulaşım.

1. **Tek giriş bileşeni:** `/login`, `/admin/login`, `/[tenant]/admin/login` aynı `LoginForm` bileşenini kullanır; yalnız bağlam metni değişir. Yeşil palet ve "ACCESS PROTOCOL / Structural ID / Encrypted Key" dili kalkar → "E-posta", "Şifre", "Giriş yap".
2. **Tenant keşfi (B10):** Çalışma alanı kodu opsiyonel; boşsa backend'de e-postadan üyelik çözümü (yeni endpoint gerekiyorsa backend'de tenant izolasyonunu bozmayacak, var/yok sızdırmayan biçimde — her durumda aynı yanıt). Tek üyelik → doğrudan; çoklu → seçim ekranı.
3. **Rol bazlı yönlendirme:** başarılı girişte portal kullanıcısı `/portal/dashboard`, tenant ekibi `/[tenant]/admin`, platform yöneticisi platform paneli. Güvenli `redirect` mevcut kuralları korur.
4. **Kayıt (D4):** `/signup` davet yoksa erken erişim formuna yönlenir; davet bağlantısıyla gelen kullanıcı mevcut `accept-invitation` akışını kullanır. Kayıttaki bülten tercihleri ayrı adıma taşınır.
5. **Oturum hardening:** access/refresh token'ı localStorage'dan HttpOnly/Secure/SameSite cookie'ye taşıma ayrı bir auth migration'dır (DEV_HANDOFF'ta borç olarak kayıtlı). F2'de yapılacaksa backend + frontend birlikte, mevcut oturumların sonlanacağı kullanıcıya önceden söylenerek.
6. **Form davranışı:** UX-CONTRACT Validation bölümü — blur/submit'te hata, ilk hatalı alana odak, ham hata metni yok.

**Doğrulama:** ortak komutlar; iki tenant (A/B) ile Playwright E2E: giriş → doğru shell → çıkış; yanlış şifre, bilinmeyen e-posta, çoklu tenant, süresi dolmuş oturum; klavye-only giriş.

**Commit:** `feat(auth-ui): single login, tenant discovery and role routing (F2)`

## F3 · Uygulama göçü (5.–10. hafta, dilimler halinde)

**Hedef:** Portal, tenant admin ve platform ekranları Cortex Editorial + UX-CONTRACT'a taşınsın. Her dilim ayrı commit.

Dilim sırası (UX-CONTRACT "Migration durumu" ile aynı):

| Dilim | Kapsam | Bitti sayılması için |
|---|---|---|
| F3.0 | Altyapı: tek bildirim sistemi (`use-toast`; `sonner` 26 dosyadan kaldırılır), ortak `ConfirmDialog` (alert-dialog), `EmptyState` / `ErrorState` / `PageHeader` pattern'leri, `DesignTokensProvider` + `next-themes` tek mod sahibi | `grep -rl "from 'sonner'" src` boş; pattern'lerin testleri |
| F3.1 | `alert/confirm/prompt` → ConfirmDialog / toast (66 çağrı) | `grep -rnE "\b(alert|confirm|prompt)\(" src` yalnız kabul edilen istisnalar |
| F3.2 | Sahte veri temizliği (B07): `Math.random` ile üretilen UI verisi (monitoring-dashboard, quota-usage-card, editorial-console/overseer), sosyal takvim sahte başarı, tenant CMS editörü fixture | Gerçek API'ye bağlı veya açıkça "Demo veri" rozetiyle; başarı mesajı yalnız gerçek sonuçta |
| F3.3 | Portal rotaları (34) | Her rota: document title, loading/empty/error, 375–1280 px, klavye |
| F3.4 | Tenant CRUD (users, roles, settings, CRM, forms) | UX-CONTRACT akış ledger'ı (create/edit/delete/search/bulk) E2E |
| F3.5 | E-posta pazarlama, destek, otomasyon ekranları | aynı |
| F3.6 | CMS / builder workbench | aynı + kaydet/yayınla/geri al tarayıcı E2E |
| F3.7 | Legacy `/admin` ağacının emekliye ayrılması | Eşdeğeri `[tenant]/admin` veya platform panelinde olan her rota redirect; kalanlar listelenir |
| F3.8 | Allplan/Aluplan izleri (269 satır) | Örnek veri XYZ Company; `grep -rniE "allplan|aluplan" src` yalnız kabul edilen istisnalar |

Her dilimde: `BccEditorialWrapper` telemetry dekoru yeni ekrana taşınmaz; sayfa içi hex renk eklenmez; tablolar URL query state kullanır.

**Kabul matrisi değişikliği:** `AffeXAI-Cortex_Modul_Kabul_Matrisi.md`'ye her modül için "UX kabulü" alanı ekle: gerçek tarayıcı, 375/768/1280 px, light/dark, klavye, boş/hata/403 durumları, ekran görüntüsü kanıtı.

**Commit örneği:** `refactor(frontend): F3.1 replace browser dialogs with ConfirmDialog`

## F4 · BCC karar masası (G4 kapısından sonra)

**Önkoşul:** Kabul matrisinde G4 (form/kampanya → CRM → sonuç → kalıcı hafıza → kaynaklı öneri → onay → aksiyon → ölçülen sonuç) en az bir dikey dilimde iki tenantla geçmiş olmalı. Geçmediyse yalnız 1. ve 2. maddeler yapılır.

1. **Dürüstlük katmanı (G4'ten bağımsız, hemen yapılabilir):** brand, trust-dynamics, strategy, insight ve editorial-console ekranlarında gerçek veriye dayanmayan her değer "Önizleme / demo veri" rozeti taşır; yapay tarihçe çizilmez.
2. **Karar kartı pattern'i:** `DecisionCard` = öneri (tek cümle) → kanıt (kaynak kayıtlara bağlantı, tarih, tenant) → önerilen eylem (yetki kontrollü) → durum (bekliyor / onaylandı / uygulandı) → ölçülen sonuç. Storybook/test + `/portal/dashboard` veya tenant BCC sayfasında ilk kullanım.
3. **Gerçek veri bağlantısı (G4 sonrası):** Strategy önerisi Cortex retrieval kaynaklarını gösterir; onay platform-integration approval akışına gider; sonuç geri yazılır.
4. **Boş/eksik veri:** yetersiz sinyal olduğunda uydurma skor yerine "Yeterli veri yok — şu kaynakları bağlayın" eylemi.

**Doğrulama:** iki tenant ile öneri → onay → aksiyon → sonuç tarayıcı E2E; A tenantının önerisi B'de görünmez; demo rozetsiz sahte değer yok.

**Commit:** `feat(bcc): decision card and honest preview states (F4)`

## İlerleme kaydı

| Tarih | Faz/dilim | Commit | Doğrulama özeti | Seçilen varsayılanlar / açık kalanlar |
|---|---|---|---|---|
| 13.10.2026 | Plan | — | Plan yazıldı, kod değişikliği yok | — |
| 13.10.2026 | F0 | `fix(frontend): stop public-surface damage (F0)` | typecheck 0; stage'deki 84 TS/TSX dosyasında (taşınan arşiv dahil) ESLint 0; pre-commit lint-staged (`eslint --fix` + `prettier --write`, root'ta binary olmadığı için shim'le) geçti ve sonrasında tüm kontroller tekrarlandı; `pnpm build` 0; yeni unit testler 8/8; production `next start :9003` curl taraması beklenen kodlar (test/demo/backup + olmayan sayfa 404, favicon 200, diğerleri 200); Chromium 375/768/1280 px'te 11 rotada yatay taşma yok; mobil menü klavyeyle açılıyor, Escape kapatıyor, odak tetikleyiciye dönüyor; pazarlama sayfalarında konsol hatası yok | D1 = iki dilli (kullanıcı kararı): TR aktif, EN sözlüğü kilitli tutuluyor, dil yönlendirmesi F1'de (`/en` öneki `[tenant]` ile çakışıyor). D3, D5 varsayılan. Açık: pazarlama gövde metni İngilizce/jargon (F1), giriş ekranı dili ve `QUANTUM_RESISTANT` iddiası (F2), public header "Menü yüklenemedi" metni, CMS blok kataloğundaki Allplan verisi (F3.8), `/portal/*-test` ve demo rotaları (F3), provider `console.log` gürültüsü, axe taraması (F1 kapısı) |
| 13.10.2026 | F1 | `feat(marketing): unify narrative, tokens and early-access flow (F1)` | frontend/backend typecheck 0; değişen dosyalarda ESLint 0; frontend unit 30/30 (matris senkron testi dahil), backend forms şablonu 3/3 + organizations 6/6; production build 0; 10 TR/EN rota 200, 5 eski yol 308; axe (wcag2a/aa, 2.1, 2.2, best-practice) 11 sayfa × 375/1280 px: tüm etkiler 0 ihlal, yatay taşma 0; izole stack'te (güncel backend imajı, 26 migration) klavyeyle gönderilen başvuru `form_submissions` + `crm_leads` (`status=new`, `source_type=form`) olarak kaydedildi; honeypot isteği gönderilmedi; `grep #f9f906|#f9bc06|#050505` boş | D1 = iki dilli, `/en` öneki + `en` rezerv slug (shared-types, middleware, backend org doğrulaması). D2 varsayılan (Forms → CRM lead, tenant `affexai`). D5 varsayılan. Dağıtım için gerekli: `affexai` kuruluşu + `forms/templates/early-access.json` formunun yayımlanması, `NEXT_PUBLIC_EARLY_ACCESS_FORM_TENANT`/`_ID` ve `NEXT_PUBLIC_SITE_URL`; ayar yoksa sayfa e-postaya düşer. Açık: hukuk metinleri (D3), backend'in CORS reddini 500 döndürmesi, axe taraması henüz CI'da değil, `organizations.service.ts` içinde HEAD'den gelen 18 `no-unsafe-*` lint hatası |
| 14.10.2026 | F2 | `fde0bbe` `feat(auth-ui): single login, tenant discovery and role routing (F2)` | frontend/backend typecheck 0; frontend unit 57/57; backend auth+organizations+forms 108/111 (kalan 3 hata HEAD worktree'sinde birebir aynı); değişen dosyalarda yeni ESLint hatası yok; production build 0; izole stack'te iki tenant'lı klavye E2E 6/6 (`apps/frontend/scripts/acceptance/login-two-tenants.cjs`); axe 3 giriş sayfası × 375/1280: 0 ihlal | D4 varsayılan (kayıt kapalı, `/signup` → `/erken-erisim`). Oturum hardening ayrı auth dilimi. Açık: backend `/auth/register` hâlâ açık; tenant girişi kuruluş üyeliğini kontrol etmeden token veriyor |
| 14.10.2026 | F3.0 | `refactor(frontend): F3.0 single toast, dialog service, page patterns, one theme owner` | `grep -rl "from 'sonner'" src` boş (26 dosya `lib/notify`'a taşındı; Sonner'ın `<Toaster>`'ı hiç mount edilmediği için bu bildirimler önceden görünmüyordu); yeni testler: notify 5, dialog kuyruğu 5, `useAsyncEffect` zamanlayıcı 3, sayfa pattern'leri 4; frontend unit 65/65; typecheck 0; dokunulan dosyalarda ESLint 0 hata (önceden var olan 53 hata düzeltildi: 27 kaçışsız karakter, 20 bildirimden önce erişim, effect içinde senkron setState, render'da ref okuma); production build 0; axe 13 public/giriş sayfası × açık/koyu şema: `/privacy` dışında 0 ihlal | Açık: eski public CMS kabuğunun token seti (`publicLightTokensProduction` koyu değerler taşıyor) beyaz header'la kontrast hatası veriyor (`/privacy`, `/terms`, CMS sayfaları) → F3.6 |
| 14.10.2026 | F3.1 | `refactor(frontend): F3.1 replace browser dialogs with ConfirmDialog` | 42 dosyada `alert/confirm/prompt` → `notify` / `confirmDialog` / `promptDialog`; `grep` kabulü: yalnız `confirm-subscription` fonksiyon adı, `dialog-queue` metotları ve bir AI flow'undaki `prompt()` kalıyor; typecheck 0; değişen 39 TS/TSX dosyasında ESLint 0 hata (dokunulan eski dosyalardaki 27 entity, 7 bildirimden önce erişim, 19 effect içi senkron setState düzeltildi); production build 0; node:test suiteleri yeşil (22 Jest-yazımlı dosya bu koşucuda yüklenemiyor, HEAD'de de aynı); izole stack'te CRM pasifleştirme klavye E2E 2/2 (`scripts/acceptance/crm-confirm-dialog.cjs`: Escape hiçbir şeyi değiştirmiyor, "Pasifleştir" API'den kalıcı, native dialog açılırsa test düşüyor); açık diyalogda axe 375/768/1280: 0 ihlal, ilk odak "Vazgeç", taşma 0; public/giriş sayfaları axe 0; :9003 curl beklenen kodlar | Light tema `--destructive` 0 84% 60% → 0 72% 45% (beyaz metinle 3,8:1 → 5,8:1). CRM pasifleştirme yıkıcı onay olarak işaretlendi. Açık: diğer sayfalardaki onaylar dönüştürücünün `destructive` tahminine dayanıyor (silme = yıkıcı); F3.4/F3.5 E2E'lerinde tek tek doğrulanacak |

# AffeXAI Cortex — Modül durum analizi ve sprint planı (15.10.2026)

Bu belge UI/UX F0–F4 tamamlandıktan sonra 33 backend modülünün **ölçülen** durumunu ve buna dayanan sprint yol haritasını tutar. Proje Aluplan'dan bağımsızdır. Kabul sözleşmeleri `AffeXAI-Cortex_Modul_Kabul_Matrisi.md`'dedir; bu belge onları değiştirmez, sırayı ve kapsamı belirler.

## Nasıl ölçüldü

| Kanıt | Yöntem |
|---|---|
| Spec durumu | `pnpm exec jest src/modules --json` (2 worker) + bellek baskısıyla sonlandırılan 36 suite'in tek worker'la yeniden koşusu |
| Migration kapsamı | Kod içindeki `@Entity('…')` tabloları ↔ tüm migration'ları çalışmış izole PostgreSQL'deki tablolar |
| Uç nokta | `*.controller.ts` içindeki `@Get/@Post/@Put/@Patch/@Delete` sayısı |
| Sahte veri izi | `Math.random`, `mock/fake/simulat/placeholder` geçen üretim dosyaları |
| Kullanıcı yüzeyi | F3–F4 tarayıcı kabulleri (`apps/frontend/scripts/acceptance/*`) |

**Toplam:** 1.148 testin 1.066'sı geçiyor; 107 kırık suite'in 22'si yalnız bellek kaynaklı sonlandırmaydı, gerçek kırık **85 suite**. Kırıkların kök nedenleri: ~50 TypeScript sürüklenmesi (servis imzası değişmiş, spec güncellenmemiş), ~12 HTTP spec'inde sonradan eklenen organizasyon üyeliği kuralı (mock kullanıcı üyeliksiz → beklenen 403 yerine 401), ~11 eksik DI sağlayıcısı (çoğu `TenantService`), birkaç gerçek davranış farkı. CMS (10 suite) bu oturumda onarıldı.

**Migration açığı (entity var, tablo yok):** `social_posts`, `social_accounts`, `post_analytics`, `social_post_feedback` (sosyal medyanın tamamı), `theme_settings` (CMS), `email_validation_jobs` (e-posta), `token_usage` (ai), `ai_usage_logs` (chat). Temiz kurulumda bu modüller ilk sorguda 500 verir; daha önce sahte yedek veriyle gizleniyordu (F4'te görünür hale geldi).

## Modül tablosu

Seviye: **A** kabul edilebilir (yerelde doğrulandı veya spec + tarayıcı kabulü yeşil) · **B** çalışıyor, test/kabul borcu var · **C** eksik altyapı, kırık testler veya simülasyon · **D** iskelet / yardımcı.

| Modül | Matris | Uç nokta | Spec (geçen/kırık suite) | Migration | Seviye | Ana bulgu |
|---|---|---:|---|---|---|---|
| users | Yerelde doğrulandı | 18 | 46 / 0 | tamam | A | F3.3 `PATCH /users/me`; dış e-posta sağlayıcısı kanıtı açık |
| roles | Yerelde doğrulandı | 9 | 55 / 0 | tamam | A | — |
| organizations | Yerelde doğrulandı | 6 | 6 / 0 | tamam | A | — |
| settings | Yerelde doğrulandı | 23 | 70 / 0 | tamam | A | — |
| crm | Yerelde doğrulandı | 8 | 8 / 0 | tamam | A | F3.4 arama/sayfalama |
| forms | Uygulanıyor | 10 | 42 / 0 | tamam | A | Form → CRM lead (D2) çalışıyor |
| cms | Bekliyor | 94 | 60 / 0 | `theme_settings` yok | B | F3.6: yeni sayfa hiç oluşturulamıyordu, menü sonsuz özyineleme — düzeltildi; kiracı sayfası ziyaretçiye sunulamıyor (slug uç noktası JWT korumalı) |
| commerce | Bekliyor | 16 | 54 / 0 | tamam | B | Sandbox ödeme yaşam döngüsü E2E yok |
| events | Bekliyor | 18 | 20 / 0 | tamam | B | Kapasite/tekrar kayıt/iptal ve events→certificates entegrasyonu kanıtsız |
| tickets | Uygulanıyor | 119 | 424 / 14 | tamam | B | En geniş test tabanı; 401/üyelik ve sürüklenme kırıkları |
| platform-integration | Uygulanıyor | 27 | 44 / 3 | tamam | B | Otomasyon aksiyonları |
| mail | Bekliyor | 5 | 36 / 2 | tamam | B | Sandbox gönderim + delivery event kanıtı yok |
| media | Bekliyor | 11 | 18 / 4 | tamam | B | Upload HTTP spec'leri üyelik kuralına takılı |
| notifications | Uygulanıyor | 5 | 13 / 4 | tamam | B | — |
| backup | Uygulanıyor | 19 | 0 / 1 | tamam | B | Restore tatbikatı yok |
| knowledge-sources | Bekliyor | 10 | (2 suite yeniden koşuda geçti) | tamam | B | — |
| certificates | Bekliyor | 21 | 10 / 5 | tamam | C | Spec'lerin çoğu kırık (`path.dirname` mock, sürüklenme); PDF/storage/mail E2E yok |
| email-marketing | Bekliyor | 148 | 70 / 27 | `email_validation_jobs` yok | C | En büyük modül; F3.5'te simülasyon validation kaldırıldı; kampanya planlama/gönderim UI'si ve otomasyon kaydet/etkinleştir açık |
| faq-learning | Bekliyor | 47 | 61 / 19 | tamam (F3.5 migration) | C | Onay öncesi retrieval'a girmeme kanıtı yok |
| chat | Bekliyor | 55 | 11 / 17 | `ai_usage_logs` yok | C | Spec'lerin %90'ı kırık (DI) |
| social-media | Bekliyor | 17 | **0 spec** | **4 tablonun hiçbiri yok** | C | Modül temiz kurulumda hiç çalışmaz; `Math.random` 3 dosyada; BCC rezonans/gidişat buna bağlı |
| analytics | Bekliyor | 16 | 0 / 4 | tamam | C | Tüm spec'ler kırık; `Math.random` |
| ai | Bekliyor | 4 | 3 / 1 | `token_usage` yok | C | Maliyet kaydı tablosu yok |
| insight-engine | Bekliyor | 2 | 1 suite geçti / 1 kırık | tamam | C | — |
| neural-grid | Uygulanıyor | 0 | 0 / 1 | tamam | C | HTTP yüzeyi yok, servis içi |
| neural-crawler | Bekliyor | 1 | 0 spec | tamam | C | SSRF/timeout testi yok |
| strategy | Bekliyor | 2 | 1 suite geçti | tamam | C | Nest–Python sözleşmesi yok |
| brand | Bekliyor | 1 | 9 / 0 | tamam | B | F4: kaynak bazlı `dataQuality`, sahte yedek yok |
| bcc | Bekliyor | 4 | 2 / 0 | tamam | B | F4: sinyal yokken dürüst boş durum |
| trust-dynamics | Bekliyor | 1 | 3 / 0 | tamam | B | F4: uydurma geçmiş yok; arayüzü hiçbir rotada değil |
| system-logs | Bekliyor | 4 | 0 spec | tamam | C | Redaksiyon/cross-tenant testi yok |
| database-import | Uygulanıyor | 1 | 1 / 0 | — | D | Normal uygulamada kapalı olmalı |
| shared | Bekliyor | 0 | 0 spec | — | D | Yardımcılar |

Öncelikli modüller (kullanıcı isteği): **Sosyal medya** (C, en riskli), **Etkinlik** (B), **Sertifika** (C), **CRM** (A), **E-posta pazarlama** (C), **BCC** (B; G4 dikey dilimi bekliyor).

## Sprint planı

**Varsayım (bilgi verilmediği için):** tek geliştirici (ajan) + ürün sahibi onayı; sprint 1 hafta; kapasite 20 puan, planlanan yük ≤ 16 puan (%80). Her sprintin tamamlanma tanımı aşağıdaki DoD'dir. Sıra, matrisin "Bağımlılık sırasıyla geliştirme kapıları"na uyar: önce temeli doğrulanabilir hale getir, sonra dikey dilim.

### Sprint 1 — Kırmızıdan yeşile ve şema bütünlüğü
**Hedef:** Backend test paketinin tamamı yeşil ve temiz kurulumda kodun kullandığı her tablo var.

| Öncelik | İş | Puan | Bağımlılık |
|---|---|---:|---|
| P0 | Ortak test kimliği yardımcısı (aktif organizasyon üyeliği) ve ~12 HTTP spec'inin ona geçirilmesi | 3 | — |
| P0 | Eksik migration'lar: sosyal medya 4 tablo, `theme_settings`, `email_validation_jobs`, `token_usage`, `ai_usage_logs` (katalog + migration-discovery testi + izole koşu) | 5 | — |
| P0 | Entity ↔ migration tutarlılık testi (bu belgedeki taramanın kalıcı spec'i) | 2 | migration'lar |
| P1 | Eksik DI sağlayıcıları (`TenantService`, `JwtService`) ve TS sürüklenmesi: tickets, email-marketing, certificates | 4 | yardımcı |
| P2 | chat, faq-learning, analytics, media, notifications kırıkları | 2+ | — |

**Risk:** Sürüklenen spec'lerin bir kısmı gerçek bir regresyonu gizliyor olabilir → her düzeltmede önce davranış okunur, gerekirse servis düzeltilir (CMS'te `title` ve menü özyinelemesi böyle bulundu).

### Sprint 2 — Sosyal medya modülü
**Hedef:** Bir kiracı sosyal hesabını bağlar, gönderi planlar ve gerçek etkileşim geçmişi BCC'ye akar.
P0: sağlayıcı soyutlamasında `Math.random`'un kaldırılması, sandbox/izinli test hesabı bayrağı, token iptali/429/tekrar job davranışı; takvim kalıcılığı tarayıcı E2E; platform bazında etkileşim geçmişi (BCC topoloji ve gidişat bunu bekliyor). P1: gönderi yeniden planlama uç noktası (F3.2 açığı).

### Sprint 3 — E-posta pazarlama
**Hedef:** Kampanya oluştur → planla/gönder → sandbox teslim → açılma/tıklama → abonelikten çıkma, hepsi tarayıcıdan ve kanıtlı.
P0: kampanya planlama/gönderim UI'si (F3.5 açığı), sandbox gönderim, gerçek liste doğrulama işi (`email_validation_jobs`). P1: otomasyon kaydet/etkinleştir (düğüm → adım eşlemesi), e-posta şablon tasarımcısının kaydettiği şablonun kampanyada kullanılması.

### Sprint 4 — Etkinlik ve sertifika
**Hedef:** Etkinliğe kapasite sınırlı kayıt → katılım → toplu sertifika → PDF + doğrulama sayfası + e-posta, tek akış.
P0: kapasite/tekrar kayıt/iptal; events → certificates entegrasyonu; toplu işte kısmi hata çift sertifika üretmez. P1: object storage ve PDF açma E2E.

### Sprint 5 — G4 dikey dilimi (BCC)
**Hedef:** Form/kampanya → CRM → sonuç → kalıcı hafıza → kaynaklı öneri → onay → aksiyon → ölçülen sonuç, iki kiracıyla.
P0: F4 madde 3–4 (gerçek öneri kaynağı, platform-integration onay akışı, sonucun geri yazılması, "yeterli veri yok — şu kaynakları bağlayın"); `StrategyDecisionPreview`'daki örnek kartların gerçek kaynakla değişmesi. P1: kiracı CMS sayfalarının ziyaretçiye sunumu (public slug okuma uç noktası); `/editorial-console` sunucu tarafı koruma.

### Sprint 6 — Sohbet, SSS ve yapay zekâ maliyeti
**Hedef:** Chat ve FAQ öğrenme, tenant sınırı ve onay kapısı kanıtlı; AI kullanım maliyeti kaydediliyor.

### Sonrası
analytics, insight-engine, neural-grid/crawler (SSRF), system-logs redaksiyonu, backup restore tatbikatı, operasyon kapısı (tam stack, rollback).

### Riskler
| Risk | Etki | Önlem |
|---|---|---|
| Kırık spec'lerin gizlediği gerçek hatalar | Sprint 1 uzar | Puanlar P2'yi kesilebilir tutar; bulunan servis hatası ayrı satır olarak kaydedilir |
| Sosyal sağlayıcı sandbox erişimi yok | Sprint 2 kanıtı eksik kalır | Sağlayıcı sözleşmesi kontrollü HTTP fixture ile; gerçek hesap ayrı kabul satırı |
| Yerel makinede bellek baskısı | Test koşuları sonlandırılır | Jest 2 worker, ağır işler sırayla; sonlandırılan suite'ler tek worker'la doğrulanır |

### Tamamlanma tanımı (her sprint)
- [ ] Değişen modülün spec'leri ve tüm backend paketi yeşil; typecheck 0/0; değişen dosyalarda ESLint 0 hata
- [ ] İzole PostgreSQL'de migration'lar sıfırdan koşuyor; kullanılan her tablo var
- [ ] Tarayıcı kabul betiği (`scripts/acceptance/*`) 375/768/1280 ve iki kiracıyla yeşil; sahte değer yok veya "Önizleme" rozetli
- [ ] Kabul matrisinde modül satırı ve kanıt kaydı güncel; DEV_HANDOFF bölümü yazıldı
- [ ] Commit, pre-commit hook atlanmadan; push/deploy yok

## İlerleme kaydı

| Tarih | Sprint / iş | Commit | Kanıt |
|---|---|---|---|
| 2026-10-15 | S1 P0 — test kimliği organizasyon üyeliği taşıyor (`withMembership`), 16 HTTP spec'i | `0706180` | 16 spec, 213 test, her biri tek worker'la yeşil |
| 2026-10-15 | S1 P0 — 8 eksik tablo migration'ı (`MissingModuleTables1791453600000`), `data-source` entity listesi, kalıcı entity ↔ migration kapsam spec'i; sosyal etkileşim penceresi parametre hatası | `731c522` | İzole DB'de migration koştu, 8 tablo + 8 FK var; `bcc-honesty` 8/8, backend logunda kaynak hatası 0 |
| 2026-10-15 | S1 P1 — certificates ve email-marketing spec sürüklenmesi (1. parti): group, segment, gdpr, email-validation, mjml-renderer, file-processing; bulunan 4 servis hatası düzeltildi | `7dc5a0b` | 7 suite / 53 test yeşil; tickets'in 5 "kırık" suite'i yalnız bellek kesintisiydi (tek worker'la yeşil) |
| 2026-10-15 | S1 P1 — email-marketing 2. parti: servis/controller DI, automation, trigger-evaluator; SQL enjeksiyonu ve kırık cron'lar düzeltildi | `fbeabf5` | 4 suite / 36 test yeşil; yeni SQL izole DB'de çalıştırıldı |
| 2026-10-15 | S1 P1 — email-marketing 3. parti: workflow-executor, send-time-optimization, predictive-analytics; gecikme adımı döngüsü ve uydurma metrikler düzeltildi | `d54c0d4` | 4 suite / 38 test yeşil (tek worker) |
| 2026-10-15 | S1 P1 — email-marketing 4. parti: ab-test, ip-reputation; varyant kiracı kimliği, sahte "gönderim başladı" ve DNSBL yanlış-temiz sonucu düzeltildi | bu commit | 2 suite / 18 test yeşil |

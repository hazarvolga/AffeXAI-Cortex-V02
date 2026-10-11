# AffeXAI Cortex UX Contract

Bu sözleşme portal pilotu ile başlayan ortak ürün davranışını tanımlar. Görsel değerlerin sahibi [DESIGN.md](DESIGN.md), runtime tokenlarının sahibi `apps/frontend/src/app/globals.css` dosyasıdır.

## Ürün bağlamı

- **Kullanıcılar:** portal son kullanıcıları, tenant ekipleri ve platform yöneticileri.
- **Ana işler:** durumu anlamak, önerilen sonraki eylemi seçmek, iş kaydını güvenle oluşturmak/güncellemek ve sonucunu görmek.
- **Aktif dil:** Türkçe; teknik kimlikler ve kod İngilizce olabilir.
- **Saat/takvim:** kullanıcıya gösterilen tarih/saat aktif locale ve açık timezone bilgisiyle formatlanır; ham UTC son kullanıcı metni değildir.
- **Erişilebilirlik hedefi:** WCAG 2.2 AA.

## İş bağlamı kaynakları

| Kapsam | Kaynak | Tür | Son inceleme |
|---|---|---|---|
| Ürün amacı ve sınırlar | `docs/active/AffeXAI-Cortex_Bagimsiz_Teknik_Durum_ve_Tamamlanma_Plani_2026-10-07.md` | Ürün/teknik durum | 2026-10-11 |
| UX yönü | `docs/active/UX_PRINCIPLES.md` | Ürün tasarım ilkeleri | 2026-10-11 |
| Modül kabulü | `docs/active/AffeXAI-Cortex_Modul_Kabul_Matrisi.md` | Kabul sözleşmesi | 2026-10-11 |
| Yetki ve tenant izolasyonu | backend guard/policy ve G3 kabul belgeleri | Uygulama + kabul kanıtı | 2026-10-11 |
| Veri yaşam döngüsü | ilgili backend API/domain modülü | Uygulama sözleşmesi | Akış bazında |

Silme, retention, billing, legal copy ve harici yan etki gibi yüksek riskli davranışlar bu belgede varsayılmaz. İlgili domain/API sözleşmesi doğrulanmadan UI kararı verilmez.

## Görsel sözleşme

- **Tasarım bağlamı:** `DESIGN.md`
- **Sahiplik:** portal renk değerlerinde runtime kanonik, belgeler ayna. Mode/context state'inin `next-themes` ve `DesignTokensProvider` arasında tekilleştirilmesi migration borcudur.
- **Token kaynağı:** `apps/frontend/src/app/globals.css`
- **Adapter:** `apps/frontend/tailwind.config.ts`
- **Primitive:** `apps/frontend/src/components/ui`
- **Temalar:** portal light/dark; forced-colors ve reduced-motion sistem tercihleri.
- **Drift kapısı:** semantik token değişikliği runtime + `DESIGN.md` aynı changeset; sayfa içi hardcoded renk yeni kabul edilmez.

## Kanonik UI haritası

| Yetkinlik | Kanonik sahip | Kaynak | İzinli varyant | Doğrulama |
|---|---|---|---|---|
| Table Selection | `components/ui/checkbox` + `components/ui/table` kompozisyonu | Bu sözleşme | `page`; `all-results` yalnız API desteği varsa | keyboard + E2E |
| Select/Listbox | `components/ui/select` | Radix primitive | authored | keyboard + popup |
| Date | `components/ui/calendar` ve `date-range-picker` | Bu sözleşme | typed/native yalnız akış kararıyla | locale + keyboard |
| Form | `components/ui/form` + schema adapter | API/schema | create/edit | validation E2E |
| Scrollbar | `app/globals.css` `.theme-portal` | `DESIGN.md` | yalnız geometri istisnası | computed style + browser |
| Toast | `components/ui/toast` + `hooks/use-toast` | Bu sözleşme | default/destructive/roleChange; semantik genişletilebilir | live region + browser |
| Dialog | `components/ui/dialog` / `alert-dialog` | Radix primitive | dialog/alert-dialog | keyboard + focus restore |
| CRUD | route + domain service + ortak form/table primitive | API/domain | return/stay, aşağıdaki ledger | full-flow E2E |

`sonner` kullanan mevcut akışlar migration borcudur; yeni portal kodu ikinci bir toast sistemi eklemez.

## Bileşen davranışı

| Bileşen | Default/Hover | Focus | Disabled/Busy | Error |
|---|---|---|---|---|
| Button | intent + emphasis görünür; enabled hedef pointer | 2 px görünür ring/outline | ölçü sabit, handler kapalı, progress adı | ilgili görünümde açıklama |
| Icon button | tooltip/erişilebilir ad; 44×44 px hedef tercih | aynı | ikon ve hedef pasif | yalnız toast değil |
| Input | kalıcı label, hover border | label ve help bağlantısı korunur | disabled/read-only ayrışır | `aria-invalid` + inline metin |
| Search | clear; 300 ms IME-safe debounce | klavyeyle clear erişilir | pending eski isteği iptal eder | sorgu korunur, retry görünür |
| Textarea | kullanıcı resize edebilir | input ile aynı | değer korunur | inline açıklama |
| Table/list | satır hover sadece destek; eylem semantic control | sıra mantıklı, header button | footprint korunur | partial/full error ayrışır |

## Veri kümesi navigasyonu

- Admin tabloları varsayılan olarak server pagination kullanır. Portal keşif listeleri açık “Daha fazla yükle” kullanabilir.
- Committed search, filtre, sort, page ve page size varsayılan olarak URL query parametrelerinde tutulur. Hassas veya paylaşılmaması gereken filtre bu kuralın açık varyantıdır.
- Filtre veya silme sonrası sayfa 1'e döner ya da geçerli son sayfaya clamp edilir.
- Loading, empty, no-results ve error farklı durumdur. Empty ilk oluşturma eylemini; no-results filtreyi temizleme eylemini gösterir.
- Seçim varsayılan olarak görünür sayfa kapsamındadır. “Tüm sonuçlar” ancak backend toplam küme semantiği ve bulk idempotency sağlıyorsa kullanılabilir.

## Akış ledger'ı

| İşlem | Tetik | Pending | Başarı | Geri bildirim | Hata/kurtarma | Focus sonucu |
|---|---|---|---|---|---|---|
| Create | “Yeni …” | submit aynı kontrolde busy | owning liste | “… oluşturuldu” | değerleri koru, inline + retry | liste başlığı/yeni kayıt |
| Edit | “Değişiklikleri kaydet” | çift submit kapalı | sibling akış; yoksa liste | “Değişiklikler kaydedildi” | değerleri koru | güncellenen kayıt/başlık |
| Delete | nesne adlı alert-dialog | destructive action busy | geçerli liste sayfası | “… silindi” | dialog/veri korunur, retry | tetikleyici veya liste başlığı |
| Search | input/debounce | stabil progress | aynı rota + URL state | sonuç sayısı görünür | sorgu korunur, retry | input korunur |
| Bulk action | seçili sayı + açık fiil | toolbar busy | seçim temizlenir | etkilenen sayı | başarısız kayıtlar kalır | sonuç özeti |
| Upload/job | açık başlatma eylemi | progress/status | sonuç/detay yolu | tamamlandı durumu | yeniden dene/iş kimliği | durum başlığı |
| Cancel/back | “İptal”/“Geri” | yok | owning liste/önceki güvenli rota | toast yok | kaydedilmemiş değişiklikte app dialog | geri dönülen başlık |

Hard delete, permission değişimi, privacy-sensitive ve ücretli eylemler ilgili domain kaynağından sonuç/onay metni gelmeden uygulanmaz.

## Navigasyon ve responsive davranış

- Her rota ayırt edici document title üretir: `[Sayfa] · AffeXAI Cortex`.
- 403 kullanıcıya yetki eksikliğini ve güvenli dönüş yolunu gösterir; 404 veri varlığını veya başka tenant bilgisini sızdırmaz.
- Desktop sidebar dar görünümde drawer olur. Drawer açan kontrole kapanışta focus geri döner.
- Ana içeriğin başlığı scroll sonrası erişilebilir kalır; sticky yüzey focus edilen öğeyi örtmez.
- Tablo dar görünümde önem derecesine göre kolon azaltır veya tanımlı kayıt görünümüne geçer. Kırpılan değer title'a güvenmez; aç/kopyala yolu sunar.

## Overlay ve geri bildirim

- Browser `alert`, `confirm`, `prompt` yasaktır.
- Destructive, permission-changing, privacy-sensitive, bulk ve geri döndürülemez eylemler app-owned alert-dialog kullanır.
- Dialog başlık/açıklama taşır; ciddi sonuçta başlangıç focus'u güvenli eylemdedir; Escape ve trigger'a focus restoration çalışır.
- Mevcut toast küçük ekranda üstte, `sm` ve üzerinde sağ altta görünür; queue limiti birdir ve yeni toast öncekini değiştirir. Tek bir canonical bildirim sistemi ve gerçek deduplication portal migration hedefidir. Kritik bilgi yalnız toast'ta bulunmaz.
- Katman sırası: dialog/alert-dialog > drawer > popover/select > toast. Overlay document flow'u değiştirmez.
- Kaydedilmemiş değişiklik uyarısı sadece gerçek dirty state için gösterilir.

## Async ve dayanıklılık

- Mutation varsayılanı pessimistic'tir. Optimistic yalnız geri alma ve conflict davranışı kanıtlıysa kullanılır.
- Submit kontrolü pending boyunca kapanır. Harici yan etki veya create isteği idempotency anahtarı/API garantisi olmadan otomatik retry edilmez.
- Read başarısızlığında son güvenilir veri varsa stale olarak etiketlenebilir; write başarısızlığı başarı gibi gösterilmez.
- Session expiry oturum açmaya güvenli redirect ve dönüş rotası sağlar; hassas form verisi URL'ye yazılmaz.
- Query değişince stale istek iptal edilir veya sonucu görmezden gelinir. Mutation hatasında dialog/form kapanmaz.

## Validation

- Client schema hızlı rehberlik sağlar; backend nihai otoritedir.
- Alan hatası blur veya submit ile görünür; yazarken hata, değer geçerli olunca kaldırılabilir.
- Submit hatası inline özet + alan bağlantısı verir; ilk hatalı alana focus gider.
- Sunucu hata kodları kullanıcı diline çevrilir, ham stack/SQL/provider ayrıntısı gösterilmez.
- Secret değer toast, URL, log veya clipboard önizlemesinde yer almaz.

## Yetki ve clipboard

- Navigasyonda kullanıcının hiçbir şekilde erişemeyeceği eylem gizlenir. Görmesi anlamlı fakat yapması yasak eylem disabled + sebep ile gösterilir.
- Backend 403/404 her zaman otoritedir; client rol kontrolü güvenlik sınırı değildir.
- Tenantlar arası varlık için 404 tercih edilir; UI başka tenant varlığını doğrulamaz.
- Clipboard, kısaltılmış değerin yanında açık “Kopyala” kontrolü kullanır. Secret toast içinde tekrar edilmez.

## Migration durumu

- **Pilot:** `/portal/dashboard` ve portal shell.
- **Sonraki dilimler:** portal route'ları; tenant CRUD; email/support/automation; özel CMS/builder workbench.
- Eski portal kartları, debug yüzeyleri, görünmez scrollbar ve BCC telemetry dekoru yeni bileşene taşınmaz.
- `DesignTokensProvider` portal/public token alias'ı ile ikinci dark-mode state'i kaldırılmalı veya tek mode sahibine bağlanmalıdır; CSS selector özgüllüğü geçiş sırasında portal paletini korur.
- `sonner` ve `use-toast` kullanımı tek accessible bildirim sahibine indirgenene kadar yeni toast altyapısı eklenmez.
- Migration sırasında eski rota çalışmaya devam eder; route bazlı geri alma mümkün kalır. Ortak shell doğrulandıktan sonra legacy importlar kaldırılır.

## Doğrulama

- **Static:** frontend typecheck ve build; ilgili component testleri.
- **Browser:** Chromium tabanlı gerçek browser; 375 px, 768 px, 1280 px ve geniş desktop; light/dark.
- **Keyboard:** skip/landmark, sidebar/drawer, primary action, dialog, select, form error ve toast close akışları.
- **Accessibility:** axe veya eşdeğer otomasyon + manuel focus sırası, zoom %200, forced-colors ve reduced-motion.
- **Görsel:** portal dashboard loading/empty/populated/error ile light/dark ekran görüntüsü.
- **CRUD:** create/edit/delete, duplicate submit, API error, session expiry ve 403/404 yolları.
- Static audit runtime doğrulamasının yerine geçmez.

---
version: 1.0.0
name: "AffeXAI Cortex Editorial"
description: "Marka zekâsını sakin, yönlendirici ve denetlenebilir bir ürün arayüzü olarak sunan ortak tasarım sistemi."
colors:
  primary: "hsl(39 100% 48%)"
  background: "hsl(42 24% 96%)"
  surface: "hsl(42 20% 99%)"
typography:
  sans:
    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
rounded:
  DEFAULT: "0.25rem"
  sm: "0.125rem"
  md: "0.25rem"
  lg: "0.375rem"
spacing:
  control: "0.5rem"
  group: "1rem"
  section: "1.5rem"
  page: "clamp(1rem, 2.5vw, 3rem)"
components:
  button:
    backgroundColor: "hsl(39 100% 48%)"
    textColor: "hsl(220 15% 12%)"
    rounded: "0.25rem"
    height: "2.5rem"
  card:
    backgroundColor: "hsl(42 20% 99%)"
    textColor: "hsl(220 15% 12%)"
    rounded: "0.25rem"
    padding: "1.5rem"
  dialog:
    backgroundColor: "hsl(42 20% 99%)"
    textColor: "hsl(220 15% 12%)"
    rounded: "0.375rem"
    padding: "1.5rem"
  table:
    backgroundColor: "hsl(42 20% 99%)"
    textColor: "hsl(220 15% 12%)"
    rounded: "0.25rem"
  input:
    backgroundColor: "hsl(42 24% 96%)"
    textColor: "hsl(220 15% 12%)"
    rounded: "0.25rem"
    height: "2.5rem"
---

# AffeXAI Cortex Editorial Design System

## Genel bakış

### Yaratıcı kuzey yıldızı

AffeXAI Cortex bir “analitik dashboard” değil, kullanıcının bir sonraki doğru marka kararını görmesini sağlayan **editoryal karar masasıdır**. Görsel referans; moda dergisi dekorasyonu ya da yoğun bir kontrol odası değil, iyi düzenlenmiş bir strateji dosyasının açıklığıdır: güçlü başlık hiyerarşisi, anlam taşıyan ince kurallar, sakin yüzeyler ve yalnızca karar anında görünen amber sinyal.

Bu sistem [UX ilkelerini](docs/active/UX_PRINCIPLES.md) uygular: sakin, premium, minimal ve aksiyon odaklı. `BccEditorialWrapper` mevcut görsel yönün önemli kanıtıdır; ancak bütün ürünün sözleşmesi veya her role birebir uygulanacak bir sayfa şablonu değildir.

### Ürün bağlamı ve register

- **Ürün:** AffeXAI Cortex, Aluplan'dan bağımsız, çok kiracılı marka zekâsı ve iş operasyonları platformudur.
- **Kullanıcılar:** tenant sahibi/yöneticisi, operasyon ekipleri, portal son kullanıcıları ve platform yöneticileri.
- **Ana iş:** öneriyi, dayanağını, durumunu ve yapılacak sonraki eylemi güvenle anlamak.
- **Aktif dil:** mevcut uygulama ve kök belge dili Türkçedir. Teknik kimlikler İngilizce kalabilir; aynı akış içinde eylem adı dil değiştirmez.
- **Kullanım sahnesi:** sık kullanılan masaüstü ürün; portal akışları telefon ve tablet boyutlarında da tamamlanabilir olmalıdır.
- **Register:** hibrit. Ürün/admin/portal yüzeylerinde görev açıklığı öndedir; public marka sayfalarında ifade alanı daha geniştir.
- **İmza:** karar hiyerarşisini taşıyan editoryal başlık + ince kural + tek amber “sinyal” ilişkisi.
- **Kısıtlama:** görev ekranında atmosfer, telemetry, büyük dekoratif tipografi veya hareket içerik ve eylemden daha baskın olamaz.
- **Anti referanslar:** jenerik kart ızgarası, anlamsız KPI duvarı, neon “AI kontrol odası”, her öğeyi amber yapan arayüz, görünmez scrollbar ve sadece hover ile açığa çıkan eylemler.

### Tasarım sistemi katmanları

1. **Primitives:** Radix tabanlı `apps/frontend/src/components/ui` bileşenleri erişilebilir davranışın sahibidir.
2. **Cortex tokens:** renk, tipografi, boşluk, kural, focus ve motion rolleri.
3. **Patterns:** sayfa başlığı, karar özeti, filtre çubuğu, form bölümü, veri tablosu ve empty/error/loading durumları.
4. **Shells:** tenant admin, portal, platform admin ve workbench aynı DNA'yı farklı bilgi yoğunluğunda uygular.

Yeni bir genel amaçlı UI kütüphanesi eklenmez. Radix/shadcn altyapısı Cortex Editorial görünümüyle devam eder.

### Token sahipliği ve eşleme

Runtime kaynak **kanoniktir**:

- Portal semantik renkleri ve erişilebilirlik davranışları: `apps/frontend/src/app/globals.css` içindeki `.theme-portal`.
- Tailwind eşlemesi: `apps/frontend/tailwind.config.ts` (`bg-background`, `text-foreground`, `border-border`, `ring-ring` vb.).
- Ortak primitive'ler: `apps/frontend/src/components/ui`.
- Font yükleme: `apps/frontend/src/app/layout.tsx` (`--font-inter`).

Bu belgedeki değerler runtime'ın okunabilir aynasıdır. Değer değişikliği aynı changeset içinde önce runtime tokenında, sonra bu belgede yapılır. Portal selector'ü, mevcut `DesignTokensProvider` enjeksiyonundan daha yüksek özgüllükle `--editorial-*` kaynaklarını ve shadcn alias'larını korur. Provider'ın `portal` setini `public` tokenlarına alias etmesi ve `next-themes` yanında ikinci bir mode/context state'i tutması çözülmesi gereken geçiş borcudur. Bu nedenle **renk değerlerinin sahibi** `globals.css`; aktif light/dark modunu seçen state'in tekilleştirilmesi ise migration kapsamındadır.

Component'ler HSL parçalarını doğrudan tüketmez. `.theme-portal`, semantik kaynaklardan tam CSS renkleri üreten `--cortex-*` rol adaptörlerini sağlar:

| Component rolü | Semantik kaynak |
|---|---|
| `--cortex-canvas`, `--cortex-canvas-translucent` | `--editorial-canvas` |
| `--cortex-surface`, `--cortex-surface-raised` | `--editorial-surface`, `--editorial-surface-raised` |
| `--cortex-surface-quiet` | düşük opaklıklı `--editorial-rule` |
| `--cortex-line`, `--cortex-line-strong` | `--editorial-rule`, `--editorial-rule-strong` |
| `--cortex-text`, `--cortex-text-muted`, `--cortex-text-faint` | `--editorial-ink`, `--editorial-ink-muted` |
| `--cortex-accent`, `--cortex-accent-soft` | `--editorial-signal` |
| `--cortex-accent-ink` | `--editorial-signal-ink` |
| `--cortex-danger-text` | `--editorial-danger-text` |
| `--cortex-focus`, `--cortex-success` | `--editorial-focus`, `--success` |
| `--cortex-header-height` | portal shell geometrisi (`4.5rem`) |

Bu adapter değerleri `hsl(...)` biçiminde tam renk olduğundan arbitrary Tailwind kullanımı `bg-[var(--cortex-surface)]` şeklindedir. Light blokta tanımlanan adapterlar CSS variable çözümlemesi sayesinde dark blokta yeniden tanımlanan semantik kaynakları otomatik olarak izler.

## Renk

Portal token tablosu (`globals.css` kanoniktir):

Frontmatter eşlemesi: `colors.primary` amber sinyali, `colors.background`/`colors.surface` light zeminleri, `colors.foreground` light metni, `colors.dark-background`/`colors.dark-foreground` dark zemin ve metni aynalar. Component kayıtları da aynı frontmatter içindeki `components.button`, `components.card`, `components.dialog`, `components.table` ve `components.input` sahiplerine bağlanır.

| Rol | Light | Dark | Kullanım |
|---|---|---|---|
| `--editorial-canvas` | `42 24% 96%` | `225 8% 8%` | Sayfa zemini |
| `--editorial-surface` | `42 20% 99%` | `225 7% 11%` | Ana içerik yüzeyi |
| `--editorial-surface-raised` | `40 18% 100%` | `225 7% 14%` | Popover/dialog gibi yükseltilmiş yüzey |
| `--editorial-ink` | `220 15% 12%` | `42 15% 91%` | Ana metin |
| `--editorial-ink-muted` | `220 8% 40%` | `42 7% 64%` | İkincil metin |
| `--editorial-rule` | `40 12% 80%` | `40 6% 24%` | Bölüm ve kart kuralları |
| `--editorial-rule-strong` | `40 10% 53%` | `40 7% 40%` | Input ve kuvvetli ayraç |
| `--editorial-signal` | `39 100% 48%` | `39 100% 54%` | Birincil eylem ve aktif sinyal |
| `--editorial-signal-ink` | `31 100% 27%` | `42 100% 70%` | Sinyal yüzeyinde WCAG AA metin |
| `--editorial-danger-text` | `2 72% 38%` | `2 90% 76%` | Destructive metin ve ikon |
| `--editorial-focus` | `39 100% 38%` | `42 100% 66%` | Klavye focus halkası |

Amber dekorasyon değildir. Bir görünümde yalnızca en önemli eylem, aktif navigasyon veya karar sinyali yüksek amber vurgu alır. Başarı, uyarı, bilgi ve tehlike kendi semantik renkleriyle ve metin/ikon desteğiyle gösterilir. Renk tek başına durum iletmez.

Grafikler ancak bir öneri veya karşılaştırmayı açıklıyorsa kullanılır. Her grafik başlık, kısa yorum ve erişilebilir metin/tablo alternatifi taşır.

## Tipografi

- Inter mevcut ve kanonik ürün yazı tipidir. Başlık karakteri boyut, ölçü, ağırlık ve boşlukla kurulur; yeni webfont eklenmez.
- Sayfa başlığı sentence case kullanır. Uzun tümü büyük harf başlıklar görev ekranlarında kullanılmaz.
- Utility etiketleri, kısa durum kodları ve teknik kimlikler mono olabilir. Gövde metni mono olmaz.
- Ana gövde metni en az `1rem`, yardımcı metin en az `0.875rem` hedefler. Satır ölçüsü uzun açıklamalarda yaklaşık `65–75ch` ile sınırlanır.
- Sayı kolonlarında `tabular-nums`; insan dilindeki metinlerde doğal Türkçe büyük/küçük harf kullanılır.
- Bir eylem akış boyunca aynı fiili taşır: “Yayınla” butonu “Yayınlandı” geri bildirimi üretir.

## Yerleşim

- Portal sakin ürün yoğunluğu kullanır: okunabilir bölüm araları, az sayıda ana panel ve her ekran için açık sonraki eylem.
- Sayfa dış boşluğu `clamp(1rem, 2.5vw, 3rem)`; içerik grupları 16 px, ana bölümler en az 24 px ritmi izler.
- Desktop shell kalıcı sidebar kullanabilir; dar görünümde erişilebilir drawer'a dönüşür. İçerik tek ana scroll sahibine sahip olmalıdır.
- Kart ızgarası varsayılan değildir. İçerik ilişkisi liste, karar özeti veya iki kolonlu karşılaştırma gerektirmedikçe tam genişlikte akış tercih edilir.
- Tablo overflow'u tablo paneline aittir; sayfa veya ortak shell `overflow: hidden` ile kilitlenmez.
- Loading, error ve empty durumları ana kontrolleri yerinden oynatmayacak yaklaşık geometriyi korur.

## Derinlik ve şekil

Hiyerarşi öncelikle yüzey tonu, boşluk ve 1 px kuralla kurulur. Gölgeler sadece dialog, popover ve gerçekten üst katmana çıkan yüzeyler içindir. Ana içerik kartlarında ağır gölge ve blur kullanılmaz.

Portal varsayılan radius'u `0.375rem`dir. Kontroller ve içerik yüzeyleri aynı küçük radius ailesini kullanır. Pill şekli yalnızca kısa durum/etiket ve avatar gibi semantik olarak kapsül öğelere aittir.

## Bileşenler

### Temel durumlar

Her etkileşimli bileşen default, hover, `focus-visible`, pressed/selected, disabled, busy ve error durumlarını taşır. Enabled pointer hedefi pointer cursor ve görünür hover alır. Disabled kontrol handler çalıştırmaz; sebep açık değilse metin veya tooltip ile açıklanır.

Focus fallback'i portal genelinde `--editorial-focus` ile 2 px outline ve 3 px offset kullanır. Kural düşük öncelikli base layer'dadır; bileşen kendi eşdeğer Radix/Tailwind ring'ini sağlıyorsa utility stili fallback'in yerini alır. Focus hiçbir koşulda yalnız renk tonu değişimi olmaz.

### Eylemler

- Bir ekranda tek yüksek vurgulu primary eylem.
- Secondary güvenli alternatifler outline/neutral; tertiary işlemler ghost/link.
- Danger eylem güvenli primary eylemden ayrılır ve son onayda açık fiil kullanır.
- Busy durumda buton ölçüsü değişmez; aynı kontrol disabled + progress durumu verir.
- İkon tek başına kullanılıyorsa erişilebilir adı zorunludur.

### Navigasyon ve veri

Aktif rota yalnız renkle değil, metin ağırlığı ve yüzey/kural değişimiyle de görünür. Breadcrumb gerçek hiyerarşiyi gösterir. Tablo native `<table>` kullanır; spreadsheet davranışı yoksa ARIA grid kullanılmaz. Mobilde veri önceliğine göre kolon azaltma veya kayıt listesi uygulanır, yatay scroll son çaredir ve görünür scrollbar taşır.

### Form ve overlay

Label kalıcıdır; placeholder label yerine geçmez. Yardım ve hata alanı için geometri ayrılır. Hata, nasıl düzeltileceğini söyler ve ilgili alana programatik bağlanır. Dialog/alert-dialog Radix primitive'lerinden gelir; browser `alert`, `confirm`, `prompt` kullanılmaz.

Toast kısa onay içindir; düzeltme gerektiren tek hata kaynağı olamaz. Kritik durum görünüm içinde kalıcı bilgi taşır.

### İkonografi

Lucide React ortak ikon ailesidir. Varsayılan stroke yaklaşımı korunur. 16 px kontrol içi, 20 px navigasyon/özet ölçüsü önerilir. Yeni anlamı yalnız ikonla öğretmek yerine kısa metin etiketi kullanılır.

### Hareket

Hareket durum değişimini açıklar: hover/focus 120–180 ms, panel/overlay 180–250 ms. Dekoratif sürekli animasyon portalda kullanılmaz. `prefers-reduced-motion: reduce` altında animasyon ve smooth scroll kaldırılır; içerik ve eylem kaybolmaz.

### Scrollbar

Portalın sahip olduğu bütün scroll yüzeyleri görünür, ince ve yüksek kontrastlı scrollbar alır. `.scrollbar-hide` portal içinde scrollbar gizleyemez. Uzun panelde `scrollbar-gutter: stable` gibi geometri istisnaları bileşen seviyesinde eklenebilir; renk sistemi tekrar tanımlanmaz.

## Yap / Yapma

- **Yap:** Her ekranı öneri/özet, kanıt ve bir sonraki eylem sırasıyla kurgula.
- **Yap:** Ortak Radix primitive ve semantik tokenları kullan; tekrarlanan davranışı pattern'e çıkar.
- **Yap:** Light, dark, keyboard, reduced-motion ve dar viewport durumlarını birlikte doğrula.
- **Yapma:** Eski portal kart stilini, `BccEditorialWrapper` telemetry dekorunu veya admin yoğunluğunu yeni ekrana kopyalama.
- **Yapma:** Hex/rgb renkleri sayfa içinde sabitleme; `--editorial-*` veya shadcn semantik alias kullan.
- **Yapma:** Scrollbar, focus, hata veya yetki durumunu estetik gerekçeyle gizleme.

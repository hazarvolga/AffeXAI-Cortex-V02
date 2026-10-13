import type { PublicLocale } from "@/lib/i18n/public-copy";
import type { MarketedModule } from "./module-status";

export type ModuleGroupKey = "channels" | "memory" | "people" | "platform";

type Localized = Readonly<Record<PublicLocale, string>>;

export interface ModuleEntry {
  key: MarketedModule;
  name: Localized;
  summary: Localized;
}

export interface ModuleGroup {
  key: ModuleGroupKey;
  title: Localized;
  intro: Localized;
  modules: readonly ModuleEntry[];
}

/**
 * Public description of every module, grouped by the job it does. Summaries
 * describe the intended capability; availability always comes from
 * module-status.ts, never from this copy.
 */
export const MODULE_GROUPS: readonly ModuleGroup[] = [
  {
    key: "channels",
    title: { tr: "Kanallar", en: "Channels" },
    intro: {
      tr: "Markanın müşteriyle konuştuğu ve sinyal topladığı yüzeyler.",
      en: "Where the brand talks to customers and collects signals.",
    },
    modules: [
      {
        key: "forms",
        name: { tr: "Formlar", en: "Forms" },
        summary: {
          tr: "Yayımlanan formlardan gelen başvuruları CRM'e aktarır.",
          en: "Turns submissions from published forms into CRM leads.",
        },
      },
      {
        key: "tickets",
        name: { tr: "Destek talepleri", en: "Support tickets" },
        summary: {
          tr: "Talepleri SLA takibiyle ekibe yönlendirir.",
          en: "Routes customer requests to the team with SLA tracking.",
        },
      },
      {
        key: "chat",
        name: { tr: "Canlı sohbet", en: "Live chat" },
        summary: {
          tr: "Müşteriyle anlık yazışma ve gerektiğinde ekibe devir.",
          en: "Real-time conversations with hand-over to the team.",
        },
      },
      {
        key: "email-marketing",
        name: { tr: "E-posta pazarlama", en: "Email marketing" },
        summary: {
          tr: "İzinli listelere kampanya hazırlama ve sonuçlarını görme.",
          en: "Campaigns to opted-in lists, with their real results.",
        },
      },
      {
        key: "social-media",
        name: { tr: "Sosyal medya", en: "Social media" },
        summary: {
          tr: "İçerik planlama, yayımlama ve yorumları izleme.",
          en: "Plan and publish content and follow the replies.",
        },
      },
      {
        key: "events",
        name: { tr: "Etkinlikler", en: "Events" },
        summary: {
          tr: "Etkinlik açma, kayıt ve katılım takibi.",
          en: "Event set-up, registration and attendance.",
        },
      },
      {
        key: "certificates",
        name: { tr: "Sertifikalar", en: "Certificates" },
        summary: {
          tr: "Etkinlik ve eğitim katılımcılarına doğrulanabilir sertifika.",
          en: "Verifiable certificates for event and training attendees.",
        },
      },
      {
        key: "cms",
        name: { tr: "İçerik yönetimi", en: "Content management" },
        summary: {
          tr: "Sayfa düzenleme, yayımlama ve sürüm geri alma.",
          en: "Edit, publish and roll back pages.",
        },
      },
      {
        key: "commerce",
        name: { tr: "Ticaret", en: "Commerce" },
        summary: {
          tr: "Ürün, abonelik ve ödeme akışları.",
          en: "Products, subscriptions and checkout.",
        },
      },
      {
        key: "media",
        name: { tr: "Medya", en: "Media" },
        summary: {
          tr: "Dosya yükleme, erişim kontrolü ve saklama süresi.",
          en: "File uploads with access control and retention.",
        },
      },
      {
        key: "mail",
        name: { tr: "İşlem e-postaları", en: "Transactional email" },
        summary: {
          tr: "Sistem e-postalarını şablonla gönderir, teslimi kaydeder.",
          en: "Sends templated system email and records delivery.",
        },
      },
      {
        key: "notifications",
        name: { tr: "Bildirimler", en: "Notifications" },
        summary: {
          tr: "İş olaylarını ilgili kişiye bildirir ve geçmişini tutar.",
          en: "Notifies the right person about events and keeps history.",
        },
      },
    ],
  },
  {
    key: "memory",
    title: { tr: "Ortak hafıza ve öneri", en: "Shared memory and guidance" },
    intro: {
      tr: "Sinyalleri bir araya getirip kaynağı belli önerilere dönüştüren katman.",
      en: "The layer that joins signals and turns them into sourced recommendations.",
    },
    modules: [
      {
        key: "neural-grid",
        name: { tr: "Olay akışı", en: "Event backbone" },
        summary: {
          tr: "İş olaylarını kesinti olsa bile ortak hafızaya bir kez teslim eder.",
          en: "Delivers business events to shared memory exactly once, even after outages.",
        },
      },
      {
        key: "knowledge-sources",
        name: { tr: "Bilgi kaynakları", en: "Knowledge sources" },
        summary: {
          tr: "Belge ve bağlantıları içeri alıp aranabilir hale getirir.",
          en: "Imports documents and links and makes them searchable.",
        },
      },
      {
        key: "ai",
        name: { tr: "Yapay zekâ hizmeti", en: "AI service" },
        summary: {
          tr: "Model çağrılarını tenant kotası ve maliyet kaydıyla yürütür.",
          en: "Runs model calls with per-tenant quota and cost records.",
        },
      },
      {
        key: "faq-learning",
        name: { tr: "SSS öğrenme", en: "FAQ learning" },
        summary: {
          tr: "Sık sorulan sorulara öneri üretir; uzman onayı olmadan yayımlamaz.",
          en: "Suggests FAQ answers; nothing is published without expert approval.",
        },
      },
      {
        key: "neural-crawler",
        name: { tr: "Web tarayıcı", en: "Web crawler" },
        summary: {
          tr: "İzin verilen adreslerden içerik toplar.",
          en: "Collects content from approved URLs.",
        },
      },
      {
        key: "insight-engine",
        name: { tr: "İçgörü motoru", en: "Insight engine" },
        summary: {
          tr: "Tenant olaylarından dönemsel analiz üretir.",
          en: "Produces periodic analysis from a tenant's events.",
        },
      },
      {
        key: "strategy",
        name: { tr: "Strateji önerileri", en: "Strategy recommendations" },
        summary: {
          tr: "Geçmiş sonuçlara dayanan, kaynağı gösterilen öneriler.",
          en: "Recommendations grounded in past outcomes, with sources shown.",
        },
      },
      {
        key: "brand",
        name: { tr: "Marka görünümü", en: "Brand view" },
        summary: {
          tr: "Kanallardan gelen verilerle marka algısının değişimi.",
          en: "How brand perception changes, from real channel data.",
        },
      },
      {
        key: "trust-dynamics",
        name: { tr: "Güven göstergesi", en: "Trust indicator" },
        summary: {
          tr: "Güven metriğini kaynağı ve belirsizliğiyle birlikte gösterir.",
          en: "Shows a trust metric with its source and uncertainty.",
        },
      },
      {
        key: "bcc",
        name: { tr: "Karar masası", en: "Decision desk" },
        summary: {
          tr: "Önerileri kanıtı ve sonraki eylemiyle tek ekranda toplar.",
          en: "Puts each recommendation, its evidence and next step on one screen.",
        },
      },
      {
        key: "analytics",
        name: { tr: "Raporlama", en: "Reporting" },
        summary: {
          tr: "Gerçek olaylardan, kaynak kayıtlarla uzlaşan raporlar.",
          en: "Reports from real events that reconcile with source records.",
        },
      },
    ],
  },
  {
    key: "people",
    title: { tr: "Müşteriler ve ekipler", en: "Customers and teams" },
    intro: {
      tr: "Kimin kim olduğu ve neye erişebileceği.",
      en: "Who is who, and who may do what.",
    },
    modules: [
      {
        key: "crm",
        name: { tr: "CRM", en: "CRM" },
        summary: {
          tr: "Müşteri ve aday kayıtları; formdan gelen adayları eşleştirir.",
          en: "Customer and lead records; links leads coming from forms.",
        },
      },
      {
        key: "users",
        name: { tr: "Kullanıcılar", en: "Users" },
        summary: {
          tr: "Davet, giriş, oturum iptali ve üyelik.",
          en: "Invitations, sign-in, session revocation and membership.",
        },
      },
      {
        key: "organizations",
        name: { tr: "Kuruluşlar", en: "Organisations" },
        summary: {
          tr: "Her kuruluşun verisini ayrı tutan çalışma alanları.",
          en: "Workspaces that keep each organisation's data apart.",
        },
      },
      {
        key: "roles",
        name: { tr: "Roller ve yetkiler", en: "Roles and permissions" },
        summary: {
          tr: "Tek izin kataloğu; arayüz ve sunucu aynı kararı verir.",
          en: "One permission catalogue; UI and server decide the same way.",
        },
      },
    ],
  },
  {
    key: "platform",
    title: { tr: "Platform temeli", en: "Platform foundation" },
    intro: {
      tr: "Ayarlar, otomasyon, yedek ve kayıtlar.",
      en: "Settings, automation, backups and logs.",
    },
    modules: [
      {
        key: "settings",
        name: { tr: "Ayarlar", en: "Settings" },
        summary: {
          tr: "Site, e-posta, depolama ve yapay zekâ ayarları.",
          en: "Site, email, storage and AI configuration.",
        },
      },
      {
        key: "platform-integration",
        name: { tr: "Otomasyon", en: "Automation" },
        summary: {
          tr: "Olaydan aksiyona kurallar; aksiyonlar insan onayıyla çalışır.",
          en: "Event-to-action rules; actions run only after human approval.",
        },
      },
      {
        key: "backup",
        name: { tr: "Yedekleme", en: "Backup" },
        summary: {
          tr: "Yedek alma ve izole ortama geri yükleme.",
          en: "Backups and restores into an isolated environment.",
        },
      },
      {
        key: "database-import",
        name: { tr: "Veri aktarımı", en: "Data import" },
        summary: {
          tr: "Doğrulanmış toplu veri aktarımı için bakım aracı.",
          en: "A maintenance tool for validated bulk imports.",
        },
      },
      {
        key: "system-logs",
        name: { tr: "Sistem kayıtları", en: "System logs" },
        summary: {
          tr: "Hataları iz kimliğiyle incelemek için redakte edilmiş kayıtlar.",
          en: "Redacted logs to trace errors by correlation ID.",
        },
      },
      {
        key: "shared",
        name: { tr: "Ortak hizmetler", en: "Shared services" },
        summary: {
          tr: "Modüllerin kullandığı ortak hata ve veri sözleşmeleri.",
          en: "Common error and data contracts used by every module.",
        },
      },
    ],
  },
];

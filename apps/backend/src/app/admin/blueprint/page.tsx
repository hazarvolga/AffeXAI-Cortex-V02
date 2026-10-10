
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Code, FileCode, Layers, Database, Bot, Share2, Palette, ShieldCheck, Send, Settings, AlertCircle, Award, LayoutDashboard, Mail, FileText } from "lucide-react";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-muted p-4 rounded-lg text-sm text-foreground overflow-x-auto">
        <code>
            {children}
        </code>
    </pre>
);

export default function BlueprintPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Proje Mimarisi (Blueprint)</h1>
            <p className="text-muted-foreground mt-1">
                Aşağıda, projenin ayrıntılı mimari planı yer almaktadır.
            </p>
            <Card className="mt-6">
                 <CardHeader>
                    <CardTitle>Proje Yapısı JSON</CardTitle>
                    <CardDescription>Projenin tüm sayfaları, bileşenleri, rolleri ve veri kaynaklarını içeren makine tarafından okunabilir JSON çıktısı.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeBlock>
{`
{
  "pages": [
    {
      "path": "/admin",
      "purpose": "Yönetim paneli ana sayfası, tüm sistem metriklerine üst düzey bir genel bakış sunar.",
      "tabs": [],
      "visualElements": [
        { "type": "card", "id": "kpiCards", "dataDisplayed": "Toplam Gelir, Yeni Kullanıcılar, AI İçerik Üretimi, Email Performansı, Sosyal Etkileşim, Açık Destek Talebi." },
        { "type": "card", "id": "quickAccessCards", "dataDisplayed": "Yaklaşan Etkinlikler, Email Kampanyaları ve Sosyal Medya hesaplarına hızlı özet ve linkler." },
        { "type": "chart", "id": "weeklyTrendsChart", "dataDisplayed": "Yeni kullanıcı, AI içerik ve gelir metriklerinin haftalık trendi (LineChart)." }
      ],
      "interactiveElements": [
        { "id": "viewAllEvents", "type": "button", "action": "/admin/events sayfasına yönlendirir." },
        { "id": "viewAllCampaigns", "type": "button", "action": "/admin/newsletter sayfasına yönlendirir." },
        { "id": "viewAllSocial", "type": "button", "action": "/admin/social-media sayfasına yönlendirir." }
      ],
      "dataSource": "lib/events-data.ts, lib/newsletter-data.ts, lib/social-media-data.ts",
      "roleVisibility": ["Admin", "Editor", "Support Team", "Marketing Team", "Viewer"]
    },
    {
      "path": "/admin/certificates",
      "purpose": "Sertifikaları listeleme, yönetme ve yeni sertifika oluşturma işlemlerini merkezileştirir.",
      "tabs": [
        { "name": "Tümü", "purpose": "Tüm sertifikaları listeler.", "components": ["CertificateTable"] },
        { "name": "Geçerli", "purpose": "Sadece 'Generated' durumundaki sertifikaları listeler.", "components": ["CertificateTable"] },
        { "name": "Beklemede", "purpose": "Sadece 'Pending' durumundaki sertifikaları listeler.", "components": ["CertificateTable"] },
        { "name": "İptal Edilmiş", "purpose": "Sadece 'Revoked' durumundaki sertifikaları listeler.", "components": ["CertificateTable"] }
      ],
      "visualElements": [
        { "type": "card", "id": "statsCards", "dataDisplayed": "Toplam, Geçerli, İptal Edilen ve Beklemedeki sertifika sayıları." },
        { "type": "table", "id": "certificatesTable", "dataDisplayed": "Sertifika adı, alıcı, durum, veriliş ve geçerlilik tarihi." }
      ],
      "interactiveElements": [
        { "id": "newCertificate", "type": "button", "action": "/admin/certificates/new sayfasına yönlendirir." },
        { "id": "bulkImport", "type": "button", "action": "Toplu sertifika içe aktarma modal'ını açar (INFERRED)." },
        { "id": "search", "type": "input", "action": "Sertifikaları filtreler." },
        { "id": "actionsDropdown", "type": "dropdown", "action": "Sertifikayı düzenleme, kopyalama, indirme veya iptal etme seçenekleri sunar." }
      ],
      "dataSource": "lib/certificate-data.ts",
      "roleVisibility": ["Admin", "Editor"]
    },
    {
      "path": "/admin/cms/pages",
      "purpose": "Web sitesindeki tüm statik ve dinamik sayfaları yönetmek için kullanılır.",
      "tabs": [],
      "visualElements": [
        { "type": "card", "id": "statsCards", "dataDisplayed": "Toplam sayfa, yayınlanan sayfa, en çok ziyaret edilen ve son düzenleme sayıları." },
        { "type": "table", "id": "pagesTable", "dataDisplayed": "Sayfa adı, URL, durum ve son güncelleme tarihi." }
      ],
      "interactiveElements": [
        { "id": "newPage", "type": "button", "action": "/admin/cms/pages/new sayfasına yönlendirir." },
        { "id": "manageMenus", "type": "button", "action": "/admin/cms/menus sayfasına yönlendirir." },
        { "id": "editPage", "type": "button", "action": "/admin/cms/pages/[pageId] sayfasına yönlendirir." }
      ],
      "dataSource": "lib/cms-data.ts",
      "roleVisibility": ["Admin", "Editor"]
    },
    {
      "path": "/admin/events",
      "purpose": "Tüm etkinlikleri (webinar, workshop vb.) yönetmek, oluşturmak ve takip etmek için kullanılır.",
      "tabs": [
        { "name": "Tüm Etkinlikler", "purpose": "Tüm etkinlikleri listeler.", "components": ["EventTable"] },
        { "name": "Yaklaşan", "purpose": "Gelecekteki etkinlikleri listeler.", "components": ["EventTable"] },
        { "name": "Geçmiş", "purpose": "Tamamlanmış etkinlikleri listeler.", "components": ["EventTable"] },
        { "name": "Taslaklar", "purpose": "Henüz yayınlanmamış etkinlikleri listeler.", "components": ["EventTable"] }
      ],
      "visualElements": [
        { "type": "card", "id": "statsCards", "dataDisplayed": "Yaklaşan etkinlik, toplam bilet satışı, toplam katılımcı ve bu ayki gelir." },
        { "type": "table", "id": "eventsTable", "dataDisplayed": "Etkinlik adı, durumu, tarihi, mekanı ve bilet satış durumu (Progress Bar)." }
      ],
      "interactiveElements": [
        { "id": "newEvent", "type": "button", "action": "/admin/events/new sayfasına yönlendirir." }
      ],
      "dataSource": "lib/events-data.ts",
      "roleVisibility": ["Admin", "Editor", "Viewer"]
    },
    {
      "path": "/admin/newsletter",
      "purpose": "E-posta pazarlama otomasyonunu yönetmek için merkezi bir panel sunar.",
      "tabs": [],
      "visualElements": [
        { "type": "chart", "id": "subscriberGrowthChart", "dataDisplayed": "Son 6 aydaki yeni abone büyümesi." },
        { "type": "chart", "id": "campaignPerformanceChart", "dataDisplayed": "Son kampanyaların açılma ve tıklanma oranları." },
        { "type": "card", "id": "statCards", "dataDisplayed": "Aboneler, kampanyalar, gruplar, segmentler ve şablonların toplam sayıları." }
      ],
      "interactiveElements": [
        { "id": "sectionToggles", "type": "collapsible", "action": "Aboneler, Kampanyalar, Gruplar, Segmentler ve Şablonlar bölümlerini açar/kapatır." },
        { "id": "newCampaign", "type": "button", "action": "/admin/newsletter/campaigns/new sayfasına yönlendirir." }
      ],
      "dataSource": "lib/newsletter-data.ts",
      "roleVisibility": ["Admin", "Marketing Team"]
    },
    {
      "path": "/admin/settings/site",
      "purpose": "Site genelindeki temel ayarları (kurumsal kimlik, iletişim, SEO, API anahtarları) yönetir.",
      "tabs": [
        { "name": "Company", "purpose": "Şirket adı, logo, iletişim bilgileri ve genel SEO ayarları.", "components": [] },
        { "name": "AI", "purpose": "Genel ve modül bazlı AI modelleri ve API anahtarları.", "components": [] },
        { "name": "Email Settings", "purpose": "E-posta gönderim servisi, API anahtarları ve şablon testleri.", "components": [] },
        { "name": "Social Media", "purpose": "Sosyal medya hesap linkleri ve gönderi ayarları.", "components": [] },
        { "name": "Analytics", "purpose": "Analitik servis entegrasyonları ve takip kodları.", "components": [] }
      ],
      "visualElements": [],
      "interactiveElements": [
        { "id": "saveSettingsForm", "type": "form", "action": "Tüm sekmelerdeki ayarları 'saveSiteSettings' Server Action'ı ile lib/site-settings-data.ts dosyasına kaydeder." }
      ],
      "dataSource": "lib/site-settings-data.ts",
      "roleVisibility": ["Admin"]
    },
    {
      "path": "/admin/social-media",
      "purpose": "Sosyal medya içerik takvimini görüntülemek ve gönderi oluşturmak için bir panel sunar.",
      "tabs": [],
      "visualElements": [
        { "type": "card", "id": "statsCards", "dataDisplayed": "Bağlı hesaplar, planlanmış, yayınlanmış ve hatalı gönderi sayıları." },
        { "type": "calendar", "id": "contentCalendar", "dataDisplayed": "Planlanmış gönderilerin aylık, haftalık, günlük takvimi." },
        { "type": "table", "id": "recentPostsTable", "dataDisplayed": "Son gönderilerin platformu, içeriği, durumu ve tarihi." }
      ],
      "interactiveElements": [
        { "id": "newPost", "type": "button", "action": "/admin/social-media/composer sayfasına yönlendirir." }
      ],
      "dataSource": "lib/social-media-data.ts",
      "roleVisibility": ["Admin", "Marketing Team"]
    },
    {
      "path": "/admin/support",
      "purpose": "Destek taleplerini görüntülemek, yönetmek ve yeni talepler oluşturmak için kullanılır.",
      "tabs": [],
      "visualElements": [
        { "type": "card", "id": "statsCards", "dataDisplayed": "Açık, işlemde, çözülmüş ve kapanmış talep sayıları." },
        { "type": "table", "id": "ticketsTable", "dataDisplayed": "Son destek taleplerinin ID, konu, kullanıcı, durum ve önceliği." }
      ],
      "interactiveElements": [
        { "id": "newTicket", "type": "button", "action": "/admin/support/new sayfasına yönlendirir." },
        { "id": "manageCategories", "type": "button", "action": "/admin/support/categories sayfasına yönlendirir." }
      ],
      "dataSource": "lib/support-data.ts",
      "roleVisibility": ["Admin", "Support Team"]
    },
    {
      "path": "/admin/users",
      "purpose": "Sistemdeki tüm kullanıcıları ve rollerini yönetir.",
      "tabs": [],
      "visualElements": [
        { "type": "card", "id": "statsCards", "dataDisplayed": "Toplam, aktif, pasif kullanıcı ve toplam rol sayıları." },
        { "type": "table", "id": "usersTable", "dataDisplayed": "Kullanıcı adı, rolü ve durumu." },
        { "type": "table", "id": "rolesTable", "dataDisplayed": "Rol adı ve o role sahip kullanıcı sayısı." }
      ],
      "interactiveElements": [
        { "id": "newUser", "type": "button", "action": "/admin/users/new sayfasına yönlendirir." },
        { "id": "manageRoles", "type": "button", "action": "/admin/users/roles sayfasına yönlendirir." }
      ],
      "dataSource": "lib/roles-data.ts",
      "roleVisibility": ["Admin", "Viewer"]
    },
    {
      "path": "/portal/dashboard/[role]",
      "purpose": "Kullanıcı portalının ana giriş sayfası. Rol'e göre farklı bir bileşen gösterir.",
      "tabs": [],
      "visualElements": [
        { "type": "component", "id": "roleBasedDashboard", "dataDisplayed": "Admin, Customer, Editor, Marketing Team, Support Team veya Viewer rollerinden birine ait özel dashboard'ı render eder." }
      ],
      "interactiveElements": [
        { "id": "adminTopBar", "type": "select", "action": "Admin rolündeki kullanıcıların portalı farklı rollerin gözünden görmesini sağlar." }
      ],
      "dataSource": "lib/*-data.ts (her dashboard kendi veri kaynağını kullanır)",
      "roleVisibility": ["Admin", "Editor", "Support Team", "Marketing Team", "Viewer", "Customer"]
    },
    {
      "path": "/portal/events",
      "purpose": "Kullanıcının kayıtlı olduğu veya favorilerine eklediği etkinlikleri listeler.",
      "tabs": [
        { "name": "Yaklaşan Etkinlikler", "purpose": "Gelecekteki etkinlikleri gösterir.", "components": ["EventCard"] },
        { "name": "Geçmiş Etkinlikler", "purpose": "Tamamlanmış etkinlikleri gösterir.", "components": ["EventCard"] },
        { "name": "Favoriler", "purpose": "Favoriye eklenen etkinlikleri gösterir.", "components": ["EventCard"] }
      ],
      "visualElements": [
        { "type": "card", "id": "eventCard", "dataDisplayed": "Etkinlik görseli, başlığı, tarihi, lokasyonu ve kategorisi." }
      ],
      "interactiveElements": [
        { "id": "discoverEvents", "type": "button", "action": "/portal/events/discover sayfasına yönlendirir." }
      ],
      "dataSource": "lib/events-data.ts",
      "roleVisibility": ["Customer", "Editor", "Admin"]
    },
    {
      "path": "/portal/support/new",
      "purpose": "Kullanıcıların yeni destek talebi oluşturmasını sağlar. İki adımlı bir süreçtir.",
      "tabs": [],
      "visualElements": [
        { "type": "alert", "id": "aiSuggestion", "dataDisplayed": "Kullanıcının sorununa yönelik AI tarafından üretilen çözüm önerisi." },
        { "type": "card", "id": "aiSummary", "dataDisplayed": "Destek ekibi için AI tarafından oluşturulan problem özeti ve öncelik." }
      ],
      "interactiveElements": [
        { "id": "supportForm", "type": "form", "action": "'analyzeSupportTicket' Server Action'ını tetikler, AI analizi yapar ve ikinci adıma geçirir." },
        { "id": "createTicketAnyway", "type": "button", "action": "AI önerisine rağmen yeni talep oluşturur." }
      ],
      "dataSource": "lib/support-data.ts, ai/flows/support-ticket-analysis.ts",
      "roleVisibility": ["Customer", "Editor", "Admin", "Support Team"]
    }
  ],
  "components": [
    { "name": "DashboardSidebar", "likelyLocation": "components/admin", "description": "Admin panelinin sol menüsünü oluşturur, linkleri ve akordeon menüleri içerir.", "roleSpecific": false, "dataSource": "N/A" },
    { "name": "DashboardHeader", "likelyLocation": "components/admin", "description": "Admin panelinin üst barını oluşturur; breadcrumb, arama çubuğu ve kullanıcı menüsünü içerir.", "roleSpecific": false, "dataSource": "N/A" },
    { "name": "PortalSidebar", "likelyLocation": "components/portal", "description": "Kullanıcı portalının sol menüsünü oluşturur. Görüntülenen role göre menü öğelerini dinamik olarak gizler.", "roleSpecific": true, "dataSource": "N/A" },
    { "name": "AdminTopBar", "likelyLocation": "components/portal", "description": "Adminlerin portalı farklı rollerin gözünden görüntülemesini sağlayan seçiciyi içeren üst bar.", "roleSpecific": true, "dataSource": "lib/roles-data.ts" },
    { "name": "CustomerDashboard", "likelyLocation": "components/portal/dashboards", "description": "Customer rolü için portal ana sayfasını gösterir; hızlı linkler, yaklaşan etkinlikler ve son aktiviteler.", "roleSpecific": true, "dataSource": "lib/events-data.ts" },
    { "name": "EditorDashboard", "likelyLocation": "components/portal/dashboards", "description": "Editor rolü için portal ana sayfasını gösterir; yeni içerik oluşturma butonları ve onay bekleyen taslaklar.", "roleSpecific": true, "dataSource": "lib/cms-data.ts, lib/events-data.ts" },
    { "name": "INFERRED_CertificateForm", "likelyLocation": "components/admin", "description": "Yeni sertifika oluşturmak veya mevcut olanı düzenlemek için kullanılan form.", "roleSpecific": true, "dataSource": "lib/certificate-data.ts", "inference_reason": "/admin/certificates/new ve /admin/certificates/[certificateId] sayfaları bu bileşeni kullanır." },
    { "name": "INFERRED_EventForm", "likelyLocation": "components/admin", "description": "Yeni etkinlik oluşturmak veya mevcut olanı düzenlemek için kullanılan form.", "roleSpecific": true, "dataSource": "lib/events-data.ts", "inference_reason": "/admin/events/new ve /admin/events/[eventId] sayfaları bu bileşeni kullanır." }
  ],
  "roleBehavior": {
    "matrix": [
      { "role": "Admin", "access": "Tüm /admin ve /portal sayfalarına tam erişim. Portalda diğer rolleri taklit edebilir." },
      { "role": "Editor", "access": "/admin/events, /admin/certificates, /admin/cms sayfalarına ve ilgili alt sayfalarına tam erişim. Portalda kendi dashboard'unu görür." },
      { "role": "Support Team", "access": "/admin/support ve alt sayfalarına erişim. Portalda kendi dashboard'unu görür." },
      { "role": "Marketing Team", "access": "/admin/newsletter, /admin/social-media ve alt sayfalarına erişim. Portalda kendi dashboard'unu görür." },
      { "role": "Viewer", "access": "/admin sayfalarına salt okunur erişim. Portalda kendi kısıtlı dashboard'unu görür." },
      { "role": "Customer", "access": "Sadece /portal sayfalarına erişim, kendi verilerini görür (destek talepleri, sertifikalar vb.)." }
    ],
    "isPartial": false,
    "missingInfo": ""
  },
  "uiElements": [
    { "name": "Card", "description": "Bilgi gruplarını sarmak için kullanılan temel UI elemanı. Başlık, içerik ve altbilgi bölümlerinden oluşur.", "usedIn": "Tüm paneller" },
    { "name": "Table", "description": "Verileri satır ve sütunlar halinde göstermek için kullanılır. Kullanıcı, etkinlik, sertifika listeleri vb.", "usedIn": "/admin/users, /admin/events, /admin/certificates, vb." },
    { "name": "Chart", "description": "Sayısal verileri görselleştirmek için kullanılır. (LineChart, BarChart)", "usedIn": "/admin (Haftalık Trendler), /admin/newsletter (Abone Büyüme)" },
    { "name": "Badge", "description": "Durum (örn: Aktif, Planlandı), kategori veya rol bilgilerini belirtmek için kullanılan etiketler.", "usedIn": "Tablolar, Kartlar" },
    { "name": "Progress Bar", "description": "Bir sürecin tamamlanma yüzdesini göstermek için kullanılır (örn: Bilet Satışı).", "usedIn": "/admin/events" }
  ],
  "interactiveElements": [
    { "name": "Button", "description": "Form gönderme, sayfa yönlendirme veya eylem tetikleme için kullanılır.", "usedIn": "Tüm proje" },
    { "name": "DropdownMenu", "description": "Bir tablo satırı veya öğe için ek eylemler (düzenle, sil vb.) sunar.", "usedIn": "Tablolar" },
    { "name": "Select", "description": "Önceden tanımlanmış seçenekler arasından seçim yapmak için kullanılır (örn: rol, kategori).", "usedIn": "Formlar, Filtreler" },
    { "name": "Input", "description": "Metin, e-posta, şifre gibi kullanıcı girdileri almak için kullanılır.", "usedIn": "Formlar, Arama çubukları" },
    { "name": "Textarea", "description": "Çok satırlı metin girdileri almak için kullanılır.", "usedIn": "Formlar" },
    { "name": "Tabs", "description": "İçeriği farklı sekmeler altında gruplandırmak için kullanılır.", "usedIn": "/admin/events, /admin/certificates, /portal/events" },
    { "name": "Collapsible", "description": "Genişletilebilir ve daraltılabilir içerik alanları oluşturur.", "usedIn": "/admin/newsletter" }
  ],
  "dataSources": [
    { "origin": "lib/site-settings-data.ts", "description": "Merkezi ve kalıcı site ayarlarını sağlar. Sadece /admin/settings/site sayfasından yazılabilir.", "consumers": ["Header", "Footer", "/admin/settings/site"] },
    { "origin": "lib/*-data.ts", "description": "Veritabanı olmadan dinamik içerik sağlamak için kullanılan statik mock veri dosyaları.", "consumers": ["/admin/*", "/portal/* sayfalarının çoğu"] },
    { "origin": "ai/flows/*.ts", "description": "Google Genkit kullanılarak tanımlanan ve Server Action'lar aracılığıyla çağrılan AI mantığı.", "consumers": ["/portal/support/new/actions.ts"] },
    { "origin": "Future API", "description": "Mevcut mock veri dosyalarının yerini alacak olan gelecekteki backend API'si.", "consumers": ["Tüm dinamik sayfalar"] }
  ],
  "assumptions": [
    "Kullanıcı rolleri ve izinleri 'lib/roles-data.ts' dosyasında tanımlananlarla sınırlıdır.",
    "Tüm veri 'yazma' işlemleri (yeni kullanıcı ekleme, etkinlik silme vb.) şu anda simüle edilmektedir ve kalıcı değildir (site ayarları hariç).",
    "Portal sayfalarındaki kullanıcı kimliği, sabit kodlanmış bir mock kullanıcı nesnesi üzerinden yönetilmektedir."
  ],
  "validationSteps": [
    "Rol bazlı portal görünümünü test etmek için 'src/app/portal/layout.tsx' içindeki 'mockAdmin' nesnesinin 'role' değerini değiştirin.",
    "Site ayarlarının kalıcılığını doğrulamak için '/admin/settings/site' sayfasında bir değişiklik yapıp kaydedin ve 'src/lib/site-settings-data.ts' dosyasının güncellendiğini kontrol edin.",
    "AI destek talebi analizini test etmek için '/portal/support/new' sayfasında 50 karakterden uzun bir problem açıklaması ile form gönderin."
  ]
}
`
}
                    </CodeBlock>
                </CardContent>
            </Card>
        </div>
    );
}

    
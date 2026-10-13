import type { PublicCopy } from "../public-copy";

export const tr: PublicCopy = {
  brand: "AffeXAI Cortex",
  language: {
    name: "Türkçe",
    switchTo: "English",
    switchLabel: "Bu sayfayı İngilizce görüntüle",
  },
  nav: {
    label: "Ana menü",
    modules: "Modüller",
    howItWorks: "Nasıl çalışır",
    earlyAccess: "Erken erişim",
    contact: "İletişim",
    login: "Giriş yap",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    menuTitle: "Menü",
    skipToContent: "İçeriğe geç",
  },
  requestAccess: "Erken erişim talep et",
  productPhase: "Erken erişim · davetle",
  moduleStatus: {
    "early-access": "Erken erişim",
    "in-development": "Geliştiriliyor",
    roadmap: "Yol haritasında",
  },
  moduleStatusNote:
    "Durumlar modül kabul matrisinden gelir; bir modül yalnız kabul testlerini geçince ilerler.",
  footer: {
    tagline: "Marka iletişimini tek bir karar masasında toplayan platform.",
    siteLabel: "Site",
    legalLabel: "Yasal",
    privacy: "Gizlilik",
    terms: "Kullanım koşulları",
    rights: "Tüm hakları saklıdır.",
  },
  meta: {
    home: {
      title: "AffeXAI Cortex · Marka iletişim merkezi",
      description:
        "Destek, form, kampanya ve konuşma sinyallerini ortak bir marka hafızasında toplayan, öneriyi dayanağıyla sunan platform. Erken erişim aşamasında.",
    },
    modules: {
      title: "Modüller · AffeXAI Cortex",
      description:
        "AffeXAI Cortex modülleri ve her birinin kabul matrisine göre güncel durumu.",
    },
    howItWorks: {
      title: "Nasıl çalışır · AffeXAI Cortex",
      description:
        "Kanallar, ortak hafıza ve karar masası: AffeXAI Cortex'in öğrenme döngüsü ve güvenlik sınırları.",
    },
    earlyAccess: {
      title: "Erken erişim · AffeXAI Cortex",
      description:
        "AffeXAI Cortex erken erişim programına başvurun; süreç ve beklentiler.",
    },
    contact: {
      title: "İletişim · AffeXAI Cortex",
      description: "AffeXAI ekibine ulaşmanın yolları.",
    },
  },
  cmsMeta: {
    about: {
      title: "Hakkımızda · AffeXAI Cortex",
      description: "AffeXAI ve AffeXAI Cortex hakkında.",
    },
    support: {
      title: "Destek · AffeXAI Cortex",
      description: "AffeXAI Cortex destek kaynakları ve yardım yolları.",
    },
    contact: {
      title: "İletişim · AffeXAI Cortex",
      description: "AffeXAI ekibine ulaşmanın yolları.",
    },
    products: {
      title: "Ürünler · AffeXAI Cortex",
      description: "AffeXAI Cortex ürün ve modül özeti.",
    },
  },
  home: {
    title: "Markanız için bir sonraki doğru karar, tek bir masada.",
    lead: "AffeXAI Cortex; destek taleplerinden, formlardan, kampanyalardan ve müşteri konuşmalarından gelen sinyalleri ortak bir marka hafızasında toplar. Amacımız yeni bir rapor ekranı değil: her öneriyi dayanağıyla göstermek ve onayınızla eyleme dönüştürmek.",
    secondaryCta: "Nasıl çalıştığını görün",
    problem: {
      title: "Sinyaller dağınık, kararlar sezgiye kalıyor",
      items: [
        {
          title: "Her kanal ayrı bir ekranda",
          body: "Destek, pazarlama ve satış aynı müşteriyi farklı araçlarda görüyor.",
        },
        {
          title: "Raporlar ne yapılacağını söylemiyor",
          body: "Grafikler durumu anlatıyor; sonraki adımı seçmek yine size kalıyor.",
        },
        {
          title: "Sonuçlar bir sonraki karara taşınmıyor",
          body: "Bir kampanyanın ya da yanıtın işe yarayıp yaramadığı çoğu zaman kayda geçmiyor.",
        },
      ],
    },
    loop: {
      title: "Kapalı öğrenme döngüsü",
      intro:
        "Cortex'in vaadi, aşağıdaki döngünün her adımının izlenebilir olması.",
      steps: [
        {
          title: "Dinle",
          body: "Kanallardan gelen olaylar tek bir akışta toplanır.",
        },
        {
          title: "Hatırla",
          body: "Olaylar kaynağıyla birlikte ortak marka hafızasına yazılır.",
        },
        {
          title: "Öner",
          body: "Öneri, hangi kayıtlara dayandığını gösterir.",
        },
        {
          title: "Onayla",
          body: "Yetkili kişi onaylamadan hiçbir aksiyon çalışmaz.",
        },
        {
          title: "Ölç ve öğren",
          body: "Sonuç kaydedilir ve bir sonraki önerinin girdisi olur.",
        },
      ],
      link: "Döngünün ayrıntıları",
    },
    status: {
      title: "Bugün neredeyiz",
      body: "Platform {count} modülden oluşuyor. Bir modülü ancak gerçek kullanım senaryosu, yetki sınırları ve kalıcı sonucu test edildiğinde ilerlemiş sayıyoruz.",
      link: "Tüm modüller ve durumları",
    },
    principles: {
      title: "İlkelerimiz",
      items: [
        {
          title: "Kaynağı belli öneriler",
          body: "Her öneri, dayandığı kayıtlara bağlantı verir.",
        },
        {
          title: "Önce insan onayı",
          body: "Otomasyon aksiyonları yetkili kişinin onayıyla çalışır; talep eden kendi talebini onaylayamaz.",
        },
        {
          title: "Kuruluş verisi ayrı",
          body: "Her kayıt kendi kuruluşuna bağlıdır; bu ayrım iki kuruluşla yapılan kabul testleriyle denetlenir.",
        },
      ],
    },
    finalCta: {
      title: "Erken erişime katılın",
      body: "Platformu birlikte şekillendirmek isteyen kuruluşlarla çalışıyoruz.",
    },
  },
  modules: {
    title: "Modüller",
    lead: "AffeXAI Cortex {count} modülden oluşur. Her modülün durumu kabul matrisinden gelir; bir modül yalnız kabul testlerini geçince ilerler.",
    legendTitle: "Durumlar ne anlama geliyor",
    legend: {
      "early-access":
        "Yerel ortamda kabul testlerinden geçti; yayın kabulü henüz tamamlanmadı.",
      "in-development": "Geliştirme ve doğrulama sürüyor.",
      roadmap: "Planlandı; henüz geliştirme aşamasına geçmedi.",
    },
    summary:
      "{early} erken erişimde · {development} geliştiriliyor · {roadmap} yol haritasında",
    cta: {
      title: "Hangi modüller sizin için öncelikli?",
      body: "Başvurunuzda belirtin; geliştirme sırasını gerçek ihtiyaçlarla belirliyoruz.",
    },
  },
  howItWorks: {
    title: "Nasıl çalışır",
    lead: "Cortex üç katmandan oluşur: sinyal toplayan kanallar, bu sinyalleri birleştiren ortak hafıza ve önerileri eyleme dönüştüren karar masası.",
    layersTitle: "Üç katman",
    layers: [
      {
        title: "Kanallar",
        body: "Formlar, destek talepleri, kampanyalar, etkinlikler ve sohbet gibi modüller iş olayları üretir. Her olay hangi kuruluşa ait olduğunu taşır.",
      },
      {
        title: "Ortak hafıza",
        body: "Olaylar bir olay akışı üzerinden ortak hafızaya teslim edilir. Akış, kesinti sonrasında olay kaybetmeyecek ve aynı olayı iki kez işlemeyecek şekilde tasarlandı. Hafıza, ilgili geçmiş kayıtları vektör aramasıyla bulur.",
      },
      {
        title: "Karar masası",
        body: "Öneri, kanıtı ve önerilen eylem tek ekranda görünür. Aksiyon yetkili onayından sonra çalışır ve sonucu kaydedilir.",
      },
    ],
    loopTitle: "Öğrenme döngüsü",
    safeguards: {
      title: "Güvenlik ve sınırlar",
      items: [
        "Her kayıt kuruluş kimliği taşır; okuma ve yazma, isteği yapanın kuruluşuyla sınırlıdır.",
        "Otomasyon aksiyonları ayrı bir onay yetkisi ister; talep eden kendi talebini onaylayamaz.",
        "Dış adreslere yapılan çağrılar yalnız HTTPS ve izin verilen hedeflerle sınırlıdır.",
        "Oturum ve yetki kararları sunucuda verilir; arayüz yalnızca bu kararı yansıtır.",
      ],
    },
    notYet: {
      title: "Henüz hazır olmayanlar",
      body: "Öneriden ölçülen sonuca kadar uçtan uca öğrenme döngüsü henüz kabul testinden geçmedi. Strateji önerileri, marka ve güven göstergeleri yol haritasında.",
      link: "Modüllerin güncel durumu",
    },
    cta: {
      title: "Döngüyü sizin verinizle deneyelim",
      body: "Erken erişimde, önceliklerinizi birlikte belirliyoruz.",
    },
  },
  earlyAccess: {
    eyebrow: "Erken erişim",
    title: "AffeXAI Cortex şu an davetle açılıyor",
    lead: "Platform erken erişim aşamasında. Modüller kabul testlerinden geçtikçe kuruluşlara kademeli olarak açılıyor.",
    pricingNote:
      "Herkese açık bir fiyat listesi henüz yok. Kapsamı ve koşulları ihtiyacınıza göre birlikte belirliyoruz.",
    stepsTitle: "Süreç nasıl işliyor",
    steps: [
      "Başvurunuzu gönderin; kuruluşunuzu ve öncelikli ihtiyacınızı kısaca yazın.",
      "Kapsamı birlikte netleştirmek için sizinle iletişime geçelim.",
      "Uygun olduğunda çalışma alanınızı kurup ekibinizi davet edelim.",
    ],
    cta: "E-postayla başvur",
    ctaHint: "Formu kullanmak istemezseniz bize doğrudan yazabilirsiniz:",
    form: {
      title: "Başvuru formu",
      intro: "Mesaj dışındaki alanlar zorunludur.",
      name: "Ad soyad",
      email: "İş e-postası",
      company: "Kuruluş",
      message: "Öncelikli ihtiyacınız",
      messageHint:
        "Örneğin: destek talepleriyle CRM'i birlikte görmek istiyoruz.",
      optional: "isteğe bağlı",
      honeypot: "Bu alanı boş bırakın",
      privacyNote:
        "Gönderdiğiniz bilgiler başvurunuzu değerlendirmek için kaydedilir.",
      privacyLink: "Gizlilik",
      submit: "Başvuruyu gönder",
      submitting: "Gönderiliyor…",
      successTitle: "Başvurunuz alındı",
      successBody:
        "Teşekkürler. Talebinizi inceleyip e-postayla dönüş yapacağız.",
      errorTitle: "Başvuru gönderilemedi",
      errorBody:
        "Bir sorun oluştu, girdiğiniz bilgiler korunuyor. Yeniden deneyin ya da bize e-postayla yazın.",
      rateLimited:
        "Kısa sürede çok fazla deneme yapıldı. Birkaç dakika sonra yeniden deneyin.",
      unavailable:
        "Başvuru formu şu an kullanılamıyor. Talebinizi e-postayla iletebilirsiniz.",
      errorSummary: "Formda {count} alan düzeltilmeli.",
      errors: {
        nameRequired: "Adınızı ve soyadınızı yazın.",
        emailRequired: "E-posta adresinizi yazın.",
        emailInvalid: "Geçerli bir e-posta adresi yazın (ör. ad@kurulus.com).",
        companyRequired: "Kuruluşunuzun adını yazın.",
        tooLong: "Bu alan en fazla {max} karakter olabilir.",
      },
    },
  },
  contact: {
    title: "İletişim",
    lead: "Sorularınız, iş birliği önerileriniz ya da erken erişim için bize yazın.",
    emailLabel: "E-posta",
    earlyAccess: {
      title: "Erken erişim mi istiyorsunuz?",
      body: "Başvuru formu, talebinizi doğrudan ekibimize iletir.",
      link: "Başvuru formuna git",
    },
    existing: {
      title: "Mevcut bir çalışma alanınız mı var?",
      body: "Yardım merkezine göz atabilir ya da çalışma alanınıza giriş yapabilirsiniz.",
      help: "Yardım merkezi",
      login: "Giriş yap",
    },
  },
  cmsPage: {
    pendingTitle: "Bu sayfa hazırlanıyor",
    pendingBody:
      "İçerik henüz yayımlanmadı. Kısa süre sonra tekrar bakabilirsiniz.",
    errorTitle: "Sayfa şu an açılamıyor",
    errorBody:
      "İçeriği yüklerken bir sorun oluştu. Lütfen biraz sonra yeniden deneyin.",
    backHome: "Ana sayfaya dön",
    editorLink: "İçerik yönetiminde aç",
  },
  legalDraft: {
    title: "Taslak metin",
    body: "Bu sayfa örnek bir taslaktır ve AffeXAI için bağlayıcı değildir. Geçerli metin yayımlanana kadar arama motorlarına kapalıdır.",
  },
  notFound: {
    code: "404",
    title: "Aradığınız sayfa bulunamadı",
    body: "Bağlantı değişmiş ya da sayfa kaldırılmış olabilir.",
    backHome: "Ana sayfaya dön",
    contact: "Bize yazın",
  },
  help: {
    emptyTitle: "Henüz makale yok",
    emptyBody:
      "Yardım merkezi hazırlanıyor. Bu arada sorunuzu destek ekibine iletebilirsiniz.",
    errorTitle: "Yardım merkezi şu an yüklenemedi",
    errorBody: "Bağlantıda bir sorun oluştu. Lütfen yeniden deneyin.",
    retry: "Yeniden dene",
    noResultsTitle: "Sonuç bulunamadı",
    noResultsBody: "Farklı bir kelimeyle arayın ya da filtreyi temizleyin.",
    clearSearch: "Aramayı temizle",
    contactSupport: "Destek ekibine yazın",
  },
};

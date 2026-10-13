/**
 * Copy for the public surface (marketing, legal, CMS fallbacks, 404).
 *
 * Turkish is the active locale. English is kept in lockstep so the bilingual
 * rollout (decision D1) only needs a locale selector, not a copy hunt. Locale
 * routing is decided in F1 because a `/en` prefix collides with `[tenant]`.
 */

export type PublicLocale = "tr" | "en";

export const DEFAULT_PUBLIC_LOCALE: PublicLocale = "tr";

export type PublicModuleStatus = "early-access" | "in-development" | "roadmap";

export type MarketingPageKey =
  "home" | "modules" | "architecture" | "features" | "pricing" | "manifesto";

export type CmsPageKey = "about" | "support" | "contact" | "products";

interface PageMeta {
  title: string;
  description: string;
}

export interface PublicCopy {
  brand: string;
  nav: {
    label: string;
    modules: string;
    architecture: string;
    features: string;
    earlyAccess: string;
    login: string;
    openMenu: string;
    closeMenu: string;
    menuTitle: string;
  };
  requestAccess: string;
  productPhase: string;
  moduleStatus: Record<PublicModuleStatus, string>;
  moduleStatusNote: string;
  footer: {
    tagline: string;
    legalLabel: string;
    privacy: string;
    terms: string;
    rights: string;
  };
  meta: Record<MarketingPageKey, PageMeta>;
  cmsMeta: Record<CmsPageKey, PageMeta>;
  earlyAccess: {
    eyebrow: string;
    title: string;
    lead: string;
    pricingNote: string;
    stepsTitle: string;
    steps: readonly string[];
    cta: string;
    ctaHint: string;
  };
  cmsPage: {
    pendingTitle: string;
    pendingBody: string;
    errorTitle: string;
    errorBody: string;
    backHome: string;
    editorLink: string;
  };
  legalDraft: {
    title: string;
    body: string;
  };
  notFound: {
    code: string;
    title: string;
    body: string;
    backHome: string;
    contact: string;
  };
}

const tr: PublicCopy = {
  brand: "AffeXAI Cortex",
  nav: {
    label: "Ana menü",
    modules: "Modüller",
    architecture: "Mimari",
    features: "Özellikler",
    earlyAccess: "Erken erişim",
    login: "Giriş yap",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    menuTitle: "Menü",
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
    legalLabel: "Yasal",
    privacy: "Gizlilik",
    terms: "Kullanım koşulları",
    rights: "Tüm hakları saklıdır.",
  },
  meta: {
    home: {
      title: "AffeXAI Cortex · Marka iletişim merkezi",
      description:
        "Destek, form, kampanya ve konuşma sinyallerini ortak bir marka hafızasında toplayan platform. Erken erişim aşamasında.",
    },
    modules: {
      title: "Modüller · AffeXAI Cortex",
      description:
        "AffeXAI Cortex modülleri ve her birinin güncel geliştirme durumu.",
    },
    architecture: {
      title: "Mimari · AffeXAI Cortex",
      description:
        "AffeXAI Cortex katmanları: altyapı, ortak hafıza ve karar yüzeyi.",
    },
    features: {
      title: "Özellikler · AffeXAI Cortex",
      description:
        "AffeXAI Cortex ile marka sinyallerini nasıl okuyup eyleme dönüştürdüğünüz.",
    },
    pricing: {
      title: "Erken erişim · AffeXAI Cortex",
      description: "AffeXAI Cortex erken erişim programı ve başvuru yolu.",
    },
    manifesto: {
      title: "Modül haritası · AffeXAI Cortex",
      description: "AffeXAI Cortex modüllerinin katmanlara göre haritası.",
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
  earlyAccess: {
    eyebrow: "Erken erişim",
    title: "AffeXAI Cortex şu an davetle açılıyor",
    lead: "Platform erken erişim aşamasında. Modüller kabul testlerinden geçtikçe kuruluşlara kademeli olarak açılıyor.",
    pricingNote:
      "Herkese açık bir fiyat listesi henüz yok. Kapsam ve koşulları ihtiyacınıza göre birlikte belirliyoruz.",
    stepsTitle: "Süreç nasıl işliyor",
    steps: [
      "Talebinizi e-postayla iletin; kuruluşunuzu ve öncelikli ihtiyacınızı kısaca yazın.",
      "Kapsamı birlikte netleştirmek için sizinle iletişime geçelim.",
      "Uygun olduğunda çalışma alanınızı kurup ekibinizi davet edelim.",
    ],
    cta: "Erken erişim talep et",
    ctaHint:
      "E-posta uygulamanız açılır. Doğrudan yazmak isterseniz adresimiz:",
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
};

const en: PublicCopy = {
  brand: "AffeXAI Cortex",
  nav: {
    label: "Main menu",
    modules: "Modules",
    architecture: "Architecture",
    features: "Features",
    earlyAccess: "Early access",
    login: "Log in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuTitle: "Menu",
  },
  requestAccess: "Request early access",
  productPhase: "Early access · by invitation",
  moduleStatus: {
    "early-access": "Early access",
    "in-development": "In development",
    roadmap: "On the roadmap",
  },
  moduleStatusNote:
    "Statuses come from the module acceptance matrix; a module only advances after passing its acceptance tests.",
  footer: {
    tagline: "One decision desk for all of your brand communication.",
    legalLabel: "Legal",
    privacy: "Privacy",
    terms: "Terms of use",
    rights: "All rights reserved.",
  },
  meta: {
    home: {
      title: "AffeXAI Cortex · Brand communication center",
      description:
        "A platform that brings support, form, campaign and conversation signals into a shared brand memory. In early access.",
    },
    modules: {
      title: "Modules · AffeXAI Cortex",
      description:
        "AffeXAI Cortex modules and the current development status of each.",
    },
    architecture: {
      title: "Architecture · AffeXAI Cortex",
      description:
        "AffeXAI Cortex layers: infrastructure, shared memory and the decision surface.",
    },
    features: {
      title: "Features · AffeXAI Cortex",
      description:
        "How AffeXAI Cortex turns brand signals into the next action.",
    },
    pricing: {
      title: "Early access · AffeXAI Cortex",
      description:
        "The AffeXAI Cortex early access programme and how to apply.",
    },
    manifesto: {
      title: "Module map · AffeXAI Cortex",
      description: "A layer-by-layer map of the AffeXAI Cortex modules.",
    },
  },
  cmsMeta: {
    about: {
      title: "About · AffeXAI Cortex",
      description: "About AffeXAI and AffeXAI Cortex.",
    },
    support: {
      title: "Support · AffeXAI Cortex",
      description: "AffeXAI Cortex support resources and ways to get help.",
    },
    contact: {
      title: "Contact · AffeXAI Cortex",
      description: "Ways to reach the AffeXAI team.",
    },
    products: {
      title: "Products · AffeXAI Cortex",
      description: "An overview of AffeXAI Cortex products and modules.",
    },
  },
  earlyAccess: {
    eyebrow: "Early access",
    title: "AffeXAI Cortex is currently opening by invitation",
    lead: "The platform is in early access. Modules open to organisations step by step as they pass acceptance testing.",
    pricingNote:
      "There is no public price list yet. We agree scope and terms together, based on your needs.",
    stepsTitle: "How it works",
    steps: [
      "Send your request by email with a short note on your organisation and main need.",
      "We get in touch to clarify the scope together.",
      "When the fit is right, we set up your workspace and invite your team.",
    ],
    cta: "Request early access",
    ctaHint: "Your email app opens. To write directly, our address is:",
  },
  cmsPage: {
    pendingTitle: "This page is being prepared",
    pendingBody:
      "The content has not been published yet. Please check back soon.",
    errorTitle: "This page cannot be opened right now",
    errorBody:
      "Something went wrong while loading the content. Please try again shortly.",
    backHome: "Back to home",
    editorLink: "Open in content management",
  },
  legalDraft: {
    title: "Draft text",
    body: "This page is a sample draft and is not binding for AffeXAI. It is hidden from search engines until the final text is published.",
  },
  notFound: {
    code: "404",
    title: "We could not find that page",
    body: "The link may have changed or the page may have been removed.",
    backHome: "Back to home",
    contact: "Write to us",
  },
};

const PUBLIC_COPY: Readonly<Record<PublicLocale, PublicCopy>> = { tr, en };

export function getPublicCopy(
  locale: PublicLocale = DEFAULT_PUBLIC_LOCALE,
): PublicCopy {
  return PUBLIC_COPY[locale];
}

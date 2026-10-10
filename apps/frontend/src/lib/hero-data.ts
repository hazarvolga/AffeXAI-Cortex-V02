
import placeholderImages from '@/lib/placeholder-images.json';

export type HeroSlide = {
  image: string;
  imageHint: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
};

type HeroData = {
  solutions: HeroSlide[];
  products: HeroSlide[];
  successStories: HeroSlide[];
};

const findImage = (id: string) => {
    const img = placeholderImages.placeholderImages.find(p => p.id === id);
    // Ensure that even if the image is not found, we return a valid structure
    // to prevent crashes in Server Components trying to access undefined properties.
    return {
        image: img?.imageUrl || `https://picsum.photos/seed/${id}/1920/600`,
        imageHint: img?.imageHint || 'abstract background'
    }
}

export const heroData: HeroData = {
  solutions: [
    {
      ...findImage('hero-solutions'),
      image: 'https://picsum.photos/seed/hero-solutions-new/1920/800',
      headline: "Entegre AEC Çözümleriyle Projelerinizi Dönüştürün",
      subheadline: "Mimari, mühendislik ve inşaat için Allplan tabanlı yenilikçi yazılım çözümlerimizle verimliliği artırın.",
      ctaText: "Çözümleri Keşfet",
      ctaLink: "/solutions",
    },
    {
      ...findImage('hero-bim'),
      headline: "BIM ile İşbirliğini Güçlendirin",
      subheadline: "Tüm proje paydaşlarını tek bir platformda bir araya getiren bulut tabanlı Bimplus ile tanışın.",
      ctaText: "Bimplus'ı Keşfet",
      ctaLink: "/products/collaboration/bimplus",
    },
    {
      ...findImage('hero-precast'),
      headline: "Prefabrikasyonun Geleceği",
      subheadline: "Tasarım ve üretimi otomatikleştiren Allplan Precast ile prefabrik projelerinizde devrim yaratın.",
      ctaText: "Daha Fazla Bilgi",
      ctaLink: "/solutions/construction-planning/precast-production",
    }
  ],
  products: [
    {
      ...findImage('hero-products'),
      headline: "Güçlü Allplan Ürün Ailesi",
      subheadline: "Tasarım, modelleme ve işbirliği için ihtiyacınız olan her şey. Allplan'ın farklı sürümlerini ve eklentilerini keşfedin.",
      ctaText: "Ürünleri Gör",
      ctaLink: "/products",
    },
    {
      ...findImage('hero-civil'),
      headline: "Altyapı Projeleri için Allplan Civil",
      subheadline: "Yol, köprü ve altyapı tasarımlarınız için özel olarak geliştirilmiş güçlü mühendislik araçları.",
      ctaText: "Allplan Civil'i İncele",
      ctaLink: "/products/allplan/civil",
    }
  ],
  successStories: [
    {
      ...findImage('hero-success'),
      headline: "Müşteri Başarı Hikayeleri",
      subheadline: "Allplan çözümlerinin Türkiye'deki ve dünyadaki prestijli projelerde nasıl fark yarattığını görün.",
      ctaText: "Hikayeleri Oku",
      ctaLink: "/case-studies",
    },
    {
      ...findImage('hero-bridge-success'),
      headline: "İkonik Köprü Projeleri",
      subheadline: "Dünyanın dört bir yanındaki mühendislerin karmaşık köprü tasarımlarını Allplan ile nasıl hayata geçirdiğini öğrenin.",
      ctaText: "Köprü Projelerini Gör",
      ctaLink: "/case-studies?filter=bridge",
    }
  ],
};

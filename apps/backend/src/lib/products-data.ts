
import type { LucideIcon } from 'lucide-react';
import { Layers, Building, Network, Construction, Settings, Users } from 'lucide-react';

export type ProductSlide = {
  id: string;
  category: string;
  title: string;
  description: string;
  items: { title: string; href: string; }[];
  imageUrl: string;
  imageHint: string;
  Icon: LucideIcon;
};

export const productsData: ProductSlide[] = [
  {
    id: 'allplan',
    category: 'Ürün Ailesi',
    title: 'ALLPLAN',
    description: 'Tasarım, mühendislik ve inşaat için kapsamlı ve entegre BIM çözümleri sunan Allplan ürün ailesini keşfedin.',
    items: [
        { title: 'Allplan Basic', href: '/products/allplan/basic' },
        { title: 'Allplan Concept', href: '/products/allplan/concept' },
        { title: 'Allplan Professional', href: '/products/allplan/professional' },
        { title: 'Allplan Ultimate', href: '/products/allplan/ultimate' },
        { title: 'Allplan Civil', href: '/products/allplan/civil' },
        { title: 'Allplan Precast', href: '/products/allplan/precast' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1633442118043-57b686a51aa3?q=80&w=800&auto=format&fit=crop',
    imageHint: '3d architectural model software',
    Icon: Layers,
  },
  {
    id: 'building-infrastructure',
    category: 'Sektör Çözümleri',
    title: 'BİNA VE ALTYAPI YAZILIMLARI',
    description: 'Bina ve altyapı projelerinizin her aşaması için özel olarak geliştirilmiş güçlü yazılım çözümleri.',
    items: [
        { title: 'Allplan - AEC Endüstrisi için BIM', href: '/products/building-infrastructure/allplan-aec' },
        { title: 'Allplan Bridge - Köprü Tasarımı', href: '/products/building-infrastructure/allplan-bridge' },
        { title: 'AX3000 - Enerji Simülasyonu', href: '/products/building-infrastructure/ax3000' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6164a83639?q=80&w=800&auto=format&fit=crop',
    imageHint: 'building and infrastructure design',
    Icon: Building,
  },
  {
    id: 'construction-planning',
    category: 'Sektör Çözümleri',
    title: 'İNŞAAT PLANLAMA YAZILIMLARI',
    description: 'İnşaat süreçlerinizi optimize eden, detaylandırma ve imalat süreçlerini kolaylaştıran özel planlama yazılımları.',
    items: [
        { title: 'Allplan Precast - Prekast Detaylandırma', href: '/products/allplan/precast' },
        { title: 'Tim - Prekast İş Planlaması', href: '/products/construction-planning/tim' },
        { title: 'SDS/2 - Çelik Detaylandırma', href: '/products/construction-planning/sds2' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c9c4e57891b?q=80&w=800&auto=format&fit=crop',
    imageHint: 'construction planning software',
    Icon: Construction,
  },
  {
    id: 'collaboration',
    category: 'Platform',
    title: 'İŞBİRLİĞİ YAZILIMLARI',
    description: 'Proje paydaşlarınızı tek bir platformda bir araya getiren, disiplinlerarası işbirliğini ve veri yönetimini kolaylaştıran bulut tabanlı çözümler.',
    items: [
        { title: 'Bimplus - Disiplinlerarası İşbirliği', href: '/products/collaboration/bimplus' },
        { title: 'Bimplus Hesabı Oluşturun veya Giriş Yapın', href: 'https://www.bimplus.net/' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop',
    imageHint: 'team collaboration platform',
    Icon: Users,
  },
];

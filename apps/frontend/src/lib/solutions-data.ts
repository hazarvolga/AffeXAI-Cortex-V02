
import type { LucideIcon } from 'lucide-react';
import { Building, Network, Puzzle, Users, Construction, Blocks } from 'lucide-react';

export type SolutionSlide = {
  id: string;
  category: string;
  title: string;
  description: string;
  items: { title: string; href: string; }[];
  imageUrl: string;
  imageHint: string;
  Icon: LucideIcon;
};

export const solutionsData: SolutionSlide[] = [
  {
    id: 'building-design',
    category: 'Çözümler',
    title: 'BİNA TASARIMI',
    description: 'Mimari, strüktürel mühendislik ve MEP (mekanik, elektrik, sıhhi tesisat) için entegre çözümlerle bina projelerinizi en başından en sonuna kadar hassasiyetle yönetin.',
    items: [
        { title: 'Mimari', href: '/solutions/building-design/architecture' },
        { title: 'Yapısal Mühendislik', href: '/solutions/building-design/structural-engineering' },
        { title: 'MEP', href: '/solutions/building-design/mep' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=800&auto=format&fit=crop',
    imageHint: 'modern building architecture',
    Icon: Building,
  },
  {
    id: 'infrastructure-design',
    category: 'Çözümler',
    title: 'ALTYAPI TASARIMI',
    description: 'Yol, köprü ve genel altyapı projeleriniz için güçlü modelleme ve analiz araçlarıyla karmaşık mühendislik zorluklarının üstesinden gelin.',
    items: [
        { title: 'Altyapı Mühendisliği', href: '/solutions/infrastructure-design/infrastructure-engineering' },
        { title: 'Yol ve Demiryolu Tasarımı', href: '/solutions/infrastructure-design/road-railway-design' },
        { title: 'Köprü Tasarımı', href: '/solutions/infrastructure-design/bridge-design' }
    ],
    imageUrl: 'https://picsum.photos/seed/infra-design/800/600',
    imageHint: 'highway infrastructure',
    Icon: Network,
  },
  {
    id: 'add-on-modules',
    category: 'Çözümler',
    title: 'EK MODÜLLER',
    description: 'Allplan Exchange, Workgroup ve Share gibi ek modüllerle veri alışverişini, ekip çalışmasını ve proje paylaşımını sorunsuz hale getirin.',
    items: [
        { title: 'Allplan Exchange', href: '/solutions/add-on-modules' },
        { title: 'Allplan Workgroup', href: '/solutions/add-on-modules' },
        { title: 'Allplan Share', href: '/solutions/add-on-modules' },
        { title: 'Allplan Lisans Server', href: '/solutions/add-on-modules' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=800&auto=format&fit=crop',
    imageHint: 'software modules',
    Icon: Puzzle,
  },
  {
    id: 'collaboration',
    category: 'Çözümler',
    title: 'İŞ BİRLİĞİ',
    description: 'Proje ekiplerinizin verimli bir şekilde birlikte çalışmasını sağlayan, proje ve ekip yönetimi için tasarlanmış işbirliği araçları.',
    items: [
        { title: 'Proje & Ekipler', href: '/solutions/collaboration' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    imageHint: 'team collaboration',
    Icon: Users,
  },
   {
    id: 'construction-planning',
    category: 'Çözümler',
    title: 'İNŞAAT PLANLAMASI',
    description: 'Prefabrik üretimden çelik detaylandırmaya ve şantiye planlamasına kadar inşaatın her aşamasını optimize eden özel çözümler.',
    items: [
        { title: 'Prekast Üretimi', href: '/solutions/construction-planning/precast-production' },
        { title: 'Çelik Detaylandırma & İmalat', href: '/solutions/construction-planning/steel-detailing' },
        { title: 'Şantiye Planlaması', href: '/solutions/construction-planning/site-planning' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?q=80&w=800&auto=format&fit=crop',
    imageHint: 'construction planning blueprint',
    Icon: Construction,
  },
  {
    id: 'plugins',
    category: 'Çözümler',
    title: 'EKLENTİLER',
    description: 'CDS, Allto, AX3000 ve Scalypso gibi güçlü eklentilerle Allplan\'in yeteneklerini genişletin ve iş akışlarınızı özelleştirin.',
    items: [
        { title: 'CDS Add-On', href: '/solutions/plugins' },
        { title: 'Allto PytonPart Generator', href: '/solutions/plugins' },
        { title: 'Allto PytonPart', href: '/solutions/plugins' },
        { title: 'AX3000 MEP', href: '/solutions/plugins' },
        { title: 'Scalypso', href: '/solutions/plugins' },
        { title: 'Add On Kanal', href: '/solutions/plugins' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1504711331083-90519119d671?q=80&w=800&auto=format&fit=crop',
    imageHint: 'plugin extensions',
    Icon: Blocks,
  },
];

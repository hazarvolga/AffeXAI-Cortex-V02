
import type { LucideIcon } from 'lucide-react';
import { Building, Construction, Network, Factory } from 'lucide-react';

export type TimelineSlide = {
  id: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageHint: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  ctaLink: string;
  Icon: LucideIcon;
};

export const timelineData: TimelineSlide[] = [
  {
    id: 'case-study-1',
    category: 'Köprü Tasarımı',
    date: '24 Haziran 2024',
    title: 'Allplan Bridge ile Osmangazi Köprüsü Optimizasyonu',
    excerpt: 'Türkiye\'nin en büyük asma köprülerinden birinin tasarım ve analiz süreçlerinde Allplan\'ın nasıl kritik bir rol oynadığını keşfedin.',
    imageUrl: 'https://images.unsplash.com/photo-1586523903099-312a027c59de?q=80&w=800&auto=format&fit=crop',
    imageHint: 'suspension bridge sunset',
    author: {
      name: 'Ahmet Yılmaz',
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
    },
    ctaLink: '/case-studies/osmangazi-koprusu',
    Icon: Construction,
  },
  {
    id: 'case-study-2',
    category: 'Mimari Tasarım',
    date: '15 Mayıs 2024',
    title: 'İstanbul Finans Merkezi\'nde Yükselen Yenilikçi Yapılar',
    excerpt: 'Karmaşık geometrilere sahip ikonik bir kulenin mimari modellemesinde Allplan\'ın sunduğu esneklik ve gücü inceleyin.',
    imageUrl: 'https://images.unsplash.com/photo-1600950346333-875d2de85633?q=80&w=800&auto=format&fit=crop',
    imageHint: 'modern skyscraper facade',
    author: {
      name: 'Zeynep Kaya',
      avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
    },
    ctaLink: '/case-studies/istanbul-finans-merkezi',
    Icon: Building,
  },
  {
    id: 'case-study-3',
    category: 'Prefabrikasyon',
    date: '02 Nisan 2024',
    title: 'Endüstriyel Tesislerde Prefabrik Çözümlerle Hız ve Verimlilik',
    excerpt: 'Bir üretim tesisinin prefabrik elemanlarla rekor sürede tamamlanmasını sağlayan Allplan Precast otomasyonu.',
    imageUrl: 'https://images.unsplash.com/photo-1618224321689-53dd7a3a863f?q=80&w=800&auto=format&fit=crop',
    imageHint: 'precast concrete factory',
    author: {
      name: 'Mehmet Öztürk',
      avatarUrl: 'https://i.pravatar.cc/150?u=mehmet-ozturk',
    },
    ctaLink: '/case-studies/prefabrike-tesis',
    Icon: Factory,
  },
  {
    id: 'case-study-4',
    category: 'Altyapı',
    date: '19 Mart 2024',
    title: 'Ankara-İzmir Yüksek Hızlı Tren Hattı Projesi',
    excerpt: 'Zorlu arazi koşullarında Allplan Civil ile gerçekleştirilen hassas arazi modelleme ve güzergah optimizasyonu başarı hikayesi.',
    imageUrl: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=800&auto=format&fit=crop',
    imageHint: 'high speed train',
    author: {
      name: 'Elif Demir',
      avatarUrl: 'https://i.pravatar.cc/150?u=elif-demir',
    },
    ctaLink: '/case-studies/yht-projesi',
    Icon: Network,
  },
   {
    id: 'case-study-5',
    category: 'Yapısal Mühendislik',
    date: '28 Şubat 2024',
    title: 'Depreme Dayanıklı Konut Projelerinde Yapısal Analiz',
    excerpt: 'Allplan\'ın gelişmiş yapısal analiz araçlarının, sismik bölgelerdeki konut projelerinin güvenliğini nasıl artırdığını görün.',
    imageUrl: 'https://images.unsplash.com/photo-1599493356649-507443ce4619?q=80&w=800&auto=format&fit=crop',
    imageHint: 'earthquake resilient building',
    author: {
      name: 'Can Ersoy',
      avatarUrl: 'https://i.pravatar.cc/150?u=can-ersoy',
    },
    ctaLink: '/case-studies/deprem-dayanikli-konut',
    Icon: Construction,
  },
];

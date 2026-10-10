import type { LucideIcon } from 'lucide-react';
import { BookOpen, FileText, GanttChart, Rss, Video } from 'lucide-react';

type ResourceItem = {
    title: string;
    description?: string;
    ctaText: string;
    ctaLink: string;
    icon?: LucideIcon;
};

type ResourcesData = {
  tabs: {
    id: string;
    title: string;
    icon: LucideIcon;
  }[];
  content: {
    [key: string]: ResourceItem[];
  };
};

export const resourcesData: ResourcesData = {
  tabs: [
    { id: 'blog', title: 'Blog & Haberler', icon: Rss },
    { id: 'events', title: 'Etkinlikler & Videolar', icon: Video },
    { id: 'guides', title: 'Rehberler & Standartlar', icon: BookOpen },
    { id: 'references', title: 'Referanslar', icon: GanttChart },
    { id: 'technical', title: 'Teknik Bilgi', icon: FileText },
  ],
  content: {
    blog: [
      {
        title: 'Blog Global',
        description: 'Uluslararası trendler ve Allplan dünyasından en son haberler.',
        ctaText: 'Oku',
        ctaLink: '#',
      },
      {
        title: 'Blog Türkiye',
        description: 'Türkiye\'deki projeler, yerel etkinlikler ve sektör analizleri.',
        ctaText: 'Oku',
        ctaLink: '#',
      },
    ],
    events: [
      {
        title: 'Canlı Webinarlar',
        description: 'Uzmanlarımızdan Allplan\'ın inceliklerini öğrenin, sorularınızı sorun.',
        ctaText: 'Takvimi Gör',
        ctaLink: '#',
      },
      {
        title: 'Hello Allplan! 2024 (Eğitim Videoları)',
        description: 'Allplan 2024\'e hızlı bir başlangıç yapmak için hazırlanan video serisi.',
        ctaText: 'İzle',
        ctaLink: '#',
      },
    ],
    guides: [
      {
        title: 'BIM Rehberi',
        description: 'BIM süreçlerinizi optimize etmek için kapsamlı rehberimiz.',
        ctaText: 'İndir',
        ctaLink: '#',
      },
      {
        title: 'OPENBIM',
        description: 'Açık standartlar ve disiplinler arası işbirliğinin önemi.',
        ctaText: 'Daha Fazla Bilgi',
        ctaLink: '#',
      },
    ],
    references: [
      {
        title: 'Referanslar Global',
        description: 'Dünya çapında Allplan ile hayata geçirilen ilham verici projeler.',
        ctaText: 'İncele',
        ctaLink: '#',
      },
      {
        title: 'Referanslar Türkiye',
        description: 'Türkiye\'nin dört bir yanından başarılı Allplan proje örnekleri.',
        ctaText: 'İncele',
        ctaLink: '#',
      },
    ],
    technical: [
      {
        title: 'Allplan 2024 Özellikler',
        description: 'En son sürümle gelen yenilikleri ve geliştirmeleri keşfedin.',
        ctaText: 'Detayları Gör',
        ctaLink: '#',
      },
      {
        title: 'Allplan Bridge 2024 Özellikler',
        description: 'Köprü mühendisliği için özel olarak geliştirilen yeni araçlar.',
        ctaText: 'Detayları Gör',
        ctaLink: '#',
      },
       {
        title: 'Sistem Gereksinimleri',
        description: 'Allplan\'ı verimli bir şekilde çalıştırmak için gereken donanım ve yazılım.',
        ctaText: 'Görüntüle',
        ctaLink: '#',
      },
      {
        title: 'Sürüm Notları',
        description: 'Tüm güncellemeler ve düzeltmeler hakkında ayrıntılı bilgi.',
        ctaText: 'Oku',
        ctaLink: '#',
      },
    ],
  },
};

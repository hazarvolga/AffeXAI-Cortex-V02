
import type { Event } from './types';
import { assessments } from './assessment-data';

export const events: Event[] = [
  {
    id: 'evt-001',
    title: 'Allplan 2025 Lansmanı ve Yenilikler',
    description: `Allplan'ın en yeni sürümü olan 2025'in getirdiği çığır açan özellikleri ve performans iyileştirmelerini ilk öğrenen siz olun. Uzmanlarımızdan canlı demolar izleyin, sorularınızı sorun ve sektör liderleriyle tanışın. 
    
Bu etkinlikte ele alınacak konular:
- Gelişmiş yapay zeka destekli modelleme araçları
- Disiplinler arası işbirliği için yeni Bimplus özellikleri
- Sürdürülebilirlik analizleri ve yeşil bina tasarımı entegrasyonları
- Prekast ve çelik detaylandırmada otomasyon yenilikleri`,
    category: 'Lansman',
    date: '2024-09-15T10:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/event1/800/450',
    isOnline: false,
    location: {
      venue: 'Swissôtel The Bosphorus',
      address: 'Vişnezade, Acısu Sokağı No:19',
      city: 'İstanbul',
      country: 'Türkiye',
    },
    organizer: {
      id: 'org-01',
      name: 'Aluplan Digital',
      avatarUrl: 'https://i.pravatar.cc/150?u=aluplan',
    },
    isFavorite: true,
    grantsCertificate: true,
    certificateTitle: 'Allplan 2025 Lansman Katılım Sertifikası',
    attendees: [
        { id: 'att-001', name: 'Ayşe Vural', email: 'ayse.vural@example.com', ticketId: 'tkt-e1-001', certificateId: 'ALP-TR-2024-00123' },
        { id: 'att-002', name: 'Burak Çelik', email: 'burak.celik@example.com', ticketId: 'tkt-e1-002' },
    ],
    assessments: assessments.filter(a => a.eventId === 'evt-001')
  },
  {
    id: 'evt-002',
    title: 'Webinar: Allplan Bridge ile Parametrik Köprü Tasarımı',
    description: 'Bu ücretsiz webinarda, Allplan Bridge kullanarak karmaşık köprü projelerinin nasıl kolayca modelleneceğini ve analiz edileceğini keşfedin. Parametrik tasarımın gücünden yararlanarak projelerinizi nasıl hızlandırabileceğinizi öğrenin.',
    category: 'Webinar',
    date: '2024-08-22T14:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/event2/800/450',
    isOnline: true,
    location: {
      venue: 'Zoom',
      address: 'Online',
      city: 'Online',
      country: 'Online',
    },
    organizer: {
      id: 'org-01',
      name: 'Aluplan Digital',
      avatarUrl: 'https://i.pravatar.cc/150?u=aluplan',
    },
    isFavorite: false,
    grantsCertificate: true,
    certificateTitle: 'Allplan Bridge Webinar Katılım Sertifikası',
     attendees: [
        { id: 'att-003', name: 'Can Ersoy', email: 'can.ersoy@example.com', ticketId: 'tkt-e2-001' },
    ],
    assessments: assessments.filter(a => a.eventId === 'evt-002')
  },
  {
    id: 'evt-003',
    title: 'Workshop: İleri Düzey Donatı Modelleme Teknikleri',
    description: 'İnşaat mühendislerine yönelik bu uygulamalı atölye çalışmasında, karmaşık geometrilerde donatı detaylandırmanın inceliklerini öğrenin. PythonParts ve otomasyon araçları ile verimliliğinizi artırın.',
    category: 'Workshop',
    date: '2024-10-05T09:30:00.000Z',
    imageUrl: 'https://picsum.photos/seed/event3/800/450',
    isOnline: false,
    location: {
      venue: 'ODTÜ Teknokent',
      address: 'Üniversiteler, 1596. Cadde',
      city: 'Ankara',
      country: 'Türkiye',
    },
    organizer: {
      id: 'org-02',
      name: 'BIM Akademisi',
      avatarUrl: 'https://i.pravatar.cc/150?u=bimakademi',
    },
    isFavorite: true,
    grantsCertificate: false,
    attendees: []
  },
  {
    id: 'evt-004',
    title: 'Geçmiş Etkinlik: BIM ve Dijitalleşme Zirvesi 2023',
    description: 'Geçen yılın en büyük BIM etkinliğinin özetini ve önemli oturum kayıtlarını buradan izleyebilirsiniz.',
    category: 'Zirve',
    date: '2023-11-20T10:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/event4/800/450',
    isOnline: true,
    location: {
      venue: 'Kayıt',
      address: 'Online',
      city: 'Online',
      country: 'Online',
    },
    organizer: {
      id: 'org-03',
      name: 'İnşaat Zirveleri',
      avatarUrl: 'https://i.pravatar.cc/150?u=insaat-zirve',
    },
    isFavorite: false,
    grantsCertificate: true,
    certificateTitle: 'BIM Zirvesi 2023 Katılım Belgesi',
    attendees: []
  },
];

export * from './types';


import type { Assessment } from './types';

export const assessments: Assessment[] = [
  {
    id: 'asmt-001',
    eventId: 'evt-001',
    title: 'Allplan 2025 Temel Bilgi Testi',
    type: 'quiz',
    questions: [
      {
        id: 'q-001',
        text: 'Allplan 2025\'teki en önemli yeni özellik nedir?',
        type: 'multiple-choice',
        options: [
          { id: 'opt-001', text: 'Yapay Zeka Destekli Modelleme' },
          { id: 'opt-002', text: 'Gelişmiş VR Entegrasyonu' },
          { id: 'opt-003', text: 'Yeni Çizim Araçları' },
        ],
        correctOptionId: 'opt-001',
      },
      {
        id: 'q-002',
        text: 'Bimplus platformunun temel amacı nedir?',
        type: 'multiple-choice',
        options: [
          { id: 'opt-004', text: 'Sadece 2B Çizim' },
          { id: 'opt-005', text: 'Disiplinlerarası İşbirliği' },
          { id: 'opt-006', text: 'Faturalama' },
        ],
        correctOptionId: 'opt-005',
      },
       {
        id: 'q-003',
        text: 'Lansmanda en çok ilginizi çeken konuyu kısaca yazınız.',
        type: 'text',
      }
    ],
  },
   {
    id: 'asmt-002',
    eventId: 'evt-002',
    title: 'Webinar Geri Bildirim Anketi',
    type: 'survey',
    questions: [
        {
            id: 'q-004',
            text: 'Webinarın genel içeriğini nasıl buldunuz?',
            type: 'multiple-choice',
            options: [
              { id: 'opt-007', text: 'Çok Faydalı' },
              { id: 'opt-008', text: 'Faydalı' },
              { id: 'opt-009', text: 'Orta' },
              { id: 'opt-010', text: 'Yetersiz' },
            ],
        },
        {
            id: 'q-005',
            text: 'Gelecekte hangi konularda webinar görmek istersiniz?',
            type: 'text',
        }
    ]
  }
];

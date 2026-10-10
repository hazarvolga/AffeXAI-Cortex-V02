
import type { SupportTicket, SupportCategory } from './types';

export const supportCategories: SupportCategory[] = [
  { id: 'cat-01', name: 'Teknik', description: 'Yazılım, donanım ve ağ sorunları.', ticketCount: 28, parentId: null },
  { id: 'cat-01-01', name: 'Yazılım', description: 'Uygulama kurulumu, lisanslama ve kullanım sorunları.', ticketCount: 15, parentId: 'cat-01' },
  { id: 'cat-01-02', name: 'Donanım', description: 'Cihaz uyumluluğu ve sürücü sorunları.', ticketCount: 5, parentId: 'cat-01' },
  { id: 'cat-01-03', name: 'Lisanslama', description: 'Lisans anahtarı aktivasyonu ve yönetimi.', ticketCount: 8, parentId: 'cat-01' },
  { id: 'cat-02', name: 'Faturalama', description: 'Ödeme, fatura ve abonelikle ilgili sorular.', ticketCount: 12, parentId: null },
  { id: 'cat-03', name: 'Genel', description: 'Eğitim, danışmanlık ve diğer genel sorular.', ticketCount: 45, parentId: null },
  { id: 'cat-04', name: 'Özellik Talebi', description: 'Yazılım için yeni özellik ve geliştirme talepleri.', ticketCount: 8, parentId: null },
];


export const supportTickets: SupportTicket[] = [
  {
    id: 'tkt-001',
    subject: 'Lisans anahtarım çalışmıyor',
    category: 'Teknik',
    priority: 'High',
    status: 'Open',
    createdAt: '2024-07-28T10:00:00.000Z',
    lastUpdated: '2024-07-28T10:00:00.000Z',
    user: {
      id: 'usr-portal-01',
      name: 'Ayşe Vural',
      email: 'ayse.vural@example.com',
      company: 'Vural Mimarlık',
    },
    assignee: {
      id: 'usr-002',
      name: 'Zeynep Kaya',
      avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
    },
    messages: [
      {
        author: {
          id: 'usr-portal-01',
          name: 'Ayşe Vural',
          avatarUrl: 'https://i.pravatar.cc/150?u=ayse-vural',
        },
        content: 'Merhaba, yeni satın aldığım Allplan 2024 lisans anahtarını girdiğimde "geçersiz anahtar" hatası alıyorum. Yardımcı olabilir misiniz?',
        timestamp: '2024-07-28T10:00:00.000Z',
      },
      {
        author: {
          id: 'usr-002',
          name: 'Zeynep Kaya',
          avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
        },
        content: 'Lisans anahtarı sorununu incelemek için lisans numarasını kontrol ediyorum.',
        timestamp: '2024-07-28T10:15:00.000Z',
        isInternal: true,
      },
    ],
  },
  {
    id: 'tkt-002',
    subject: 'Faturamı nasıl indirebilirim?',
    category: 'Faturalama',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2024-07-27T14:30:00.000Z',
    lastUpdated: '2024-07-27T16:00:00.000Z',
    user: {
      id: 'usr-portal-02',
      name: 'Burak Çelik',
      email: 'burak.celik@example.com',
      company: 'Çelik İnşaat',
    },
    assignee: {
      id: 'usr-002',
      name: 'Zeynep Kaya',
      avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
    },
    messages: [
       {
        author: {
          id: 'usr-portal-02',
          name: 'Burak Çelik',
          avatarUrl: 'https://i.pravatar.cc/150?u=burak-celik',
        },
        content: 'Geçen haftaki danışmanlık hizmeti için faturama ihtiyacım var ama portalda bulamadım.',
        timestamp: '2024-07-27T14:30:00.000Z',
      },
       {
        author: {
          id: 'usr-002',
          name: 'Zeynep Kaya',
          avatarUrl: 'https://i.pravatar.cc/150?u=zeynep-kaya',
        },
        content: 'Merhaba Burak Bey, faturanız e-posta adresinize yeniden gönderilmiştir. Ayrıca portaldeki "Faturalarım" bölümünden de erişebilirsiniz. İyi çalışmalar.',
        htmlContent: '<p>Merhaba <strong>Burak Bey</strong>,</p><p>Faturanız e-posta adresinize yeniden gönderilmiştir. Ayrıca portaldeki <em>"Faturalarım"</em> bölümünden de erişebilirsiniz.</p><p>İyi çalışmalar.</p>',
        timestamp: '2024-07-27T16:00:00.000Z',
      },
    ],
  },
   {
    id: 'tkt-003',
    subject: 'PythonPart oluşturma hakkında soru',
    category: 'Genel',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2024-07-29T09:00:00.000Z',
    lastUpdated: '2024-07-29T11:00:00.000Z',
    user: {
      id: 'usr-portal-03',
      name: 'Deniz Arslan',
      email: 'deniz.arslan@example.com',
      company: 'Arslan Proje',
    },
    assignee: {
      id: 'usr-001',
      name: 'Ahmet Yılmaz',
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
    },
    messages: [
       {
        author: {
          id: 'usr-portal-03',
          name: 'Deniz Arslan',
          avatarUrl: 'https://i.pravatar.cc/150?u=deniz-arslan',
        },
        content: 'Kendi özel PythonPart\'larımı oluşturmak için nereden başlayabilirim? Bununla ilgili bir döküman var mı?',
        timestamp: '2024-07-29T09:00:00.000Z',
      },
       {
        author: {
          id: 'usr-001',
          name: 'Ahmet Yılmaz',
          avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
        },
        content: 'Merhaba Deniz Hanım, talebiniz ilgili teknik ekibe yönlendirilmiştir. Size en kısa sürede konuyla ilgili kaynakları ve başlangıç adımlarını içeren bir e-posta gönderecekler.',
        timestamp: '2024-07-29T11:00:00.000Z',
      },
      {
        author: {
          id: 'usr-001',
          name: 'Ahmet Yılmaz',
          avatarUrl: 'https://i.pravatar.cc/150?u=ahmet-yilmaz',
        },
        content: 'Talep teknik ekibe yönlendirildi. PythonPart geliştirme dökümantasyonu ekteki bağlantıdan erişilebilir.',
        timestamp: '2024-07-29T11:05:00.000Z',
        isInternal: true,
      },
    ],
  },
];

export * from './types';

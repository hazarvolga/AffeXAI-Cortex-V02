
import type { Certificate } from './types';

export const certificates: Certificate[] = [
  {
    certificateNumber: 'ALP-TR-2024-00123',
    recipientName: 'Ahmet Yılmaz',
    recipientEmail: 'ahmet.yilmaz@example.com',
    certificateName: 'Allplan Temel Eğitimi (Mimari)',
    issuedAt: '2024-03-15T00:00:00.000Z',
    validUntil: '2026-03-15T00:00:00.000Z',
    templateId: 'temp-basic-arch-01',
    verificationUrl: '/education/certification?id=ALP-TR-2024-00123',
    status: 'Generated',
    generationMethod: 'Manual (Single)',
    eventId: 'evt-001',
  },
  {
    certificateNumber: 'ALP-TR-2023-00456',
    recipientName: 'Zeynep Kaya',
    recipientEmail: 'zeynep.kaya@example.com',
    certificateName: 'Allplan İleri Düzey (Yapısal)',
    issuedAt: '2023-11-20T00:00:00.000Z',
    templateId: 'temp-advanced-struc-01',
    verificationUrl: '/education/certification?id=ALP-TR-2023-00456',
    status: 'Generated',
    generationMethod: 'Manual (Single)',
  },
   {
    certificateNumber: 'ALP-TR-2024-00789',
    recipientName: 'Ahmet Yılmaz',
    recipientEmail: 'ahmet.yilmaz@example.com',
    certificateName: 'Allplan Bridge Temelleri',
    issuedAt: '2024-06-10T00:00:00.000Z',
    templateId: 'temp-bridge-basic-01',
    verificationUrl: '/education/certification?id=ALP-TR-2024-00789',
    status: 'Generated',
    generationMethod: 'Manual (Single)',
  },
  {
    certificateNumber: 'ALP-TR-2022-00101',
    recipientName: 'Mehmet Öztürk',
    recipientEmail: 'mehmet.ozturk@example.com',
    certificateName: 'Allplan Temel Eğitimi',
    issuedAt: '2022-05-25T00:00:00.000Z',
    validUntil: '2023-05-25T00:00:00.000Z', // Expired
    templateId: 'temp-basic-01',
    verificationUrl: '/education/certification?id=ALP-TR-2022-00101',
    status: 'Revoked',
    generationMethod: 'Manual (Single)',
  },
];


import { httpClient } from './http-client';
import { BaseApiService } from './base-service';

export interface Certificate {
  id: string;
  recipientName: string | null;
  recipientEmail: string | null;
  trainingTitle: string | null;
  description: string | null;
  templateId: string | null;
  logoUrl: string | null;
  logoMediaId: string | null; // Media ID for certificate product/subject logo
  signatureUrl: string | null;
  pdfUrl: string | null;
  status: 'draft' | 'issued' | 'sent' | 'revoked';
  issuedAt: string;
  validUntil: string | null;
  sentAt: string | null;
  // Legacy fields
  name: string;
  issueDate: string;
  expiryDate: string | null;
  fileUrl: string | null;
  userId: string | null;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificateDto {
  recipientName: string;
  recipientEmail: string;
  trainingTitle: string;
  description?: string;
  templateId?: string;
  logoUrl?: string;
  logoMediaId?: string; // Media ID for certificate product/subject logo
  signatureUrl?: string;
  userId?: string;
  issuedAt?: string;
  validUntil?: string | null;
  // Backward compatibility
  issueDate?: string;
}

export interface UpdateCertificateDto {
  recipientName?: string;
  recipientEmail?: string;
  trainingTitle?: string;
  description?: string;
  templateId?: string;
  logoUrl?: string;
  logoMediaId?: string; // Media ID for certificate product/subject logo
  signatureUrl?: string;
  status?: 'draft' | 'issued' | 'sent' | 'revoked';
  issuedAt?: string;
  validUntil?: string | null;
  userId?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  variables: string[];
  isActive: boolean;
  previewImageUrl: string | null;
  orientation: 'portrait' | 'landscape';
  pageFormat: 'A4' | 'Letter' | 'Legal';
  createdAt: string;
  updatedAt: string;
}

export interface CertificateStatistics {
  total: number;
  draft: number;
  issued: number;
  sent: number;
  revoked: number;
}

export interface BulkImportCertificateDto {
  recipientName: string;
  recipientEmail: string;
  trainingTitle: string;
  description?: string;
  issuedAt?: string;
  validUntil?: string | null;
  // Legacy compatibility for import
  userEmail?: string;
  certificateName?: string;
  issueDate?: string;
  expiryDate?: string | null;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: string[];
}

class CertificatesService extends BaseApiService<Certificate, CreateCertificateDto, UpdateCertificateDto> {
  constructor() {
    super({ endpoint: '/certificates/v2', useWrappedResponses: true });
  }

  async getAllCertificates(filters?: { status?: string; userId?: string }): Promise<Certificate[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId);

    const url = params.toString() ? `${this.endpoint}?${params}` : this.endpoint;
    return httpClient.getWrapped<Certificate[]>(url);
  }

  async getStatistics(): Promise<CertificateStatistics> {
    return httpClient.getWrapped<CertificateStatistics>(`${this.endpoint}/statistics`);
  }

  async getTemplates(): Promise<CertificateTemplate[]> {
    return httpClient.getWrapped<CertificateTemplate[]>('/certificates/templates');
  }

  async getTemplate(id: string): Promise<CertificateTemplate> {
    return httpClient.getWrapped<CertificateTemplate>(`/certificates/templates/${id}`);
  }

  async updateTemplate(id: string, data: { htmlContent: string; description?: string }): Promise<CertificateTemplate> {
    return httpClient.putWrapped<CertificateTemplate>(`/certificates/templates/${id}`, data);
  }

  async generatePdf(id: string): Promise<{ pdfUrl: string }> {
    return httpClient.postWrapped<{ pdfUrl: string }>(`${this.endpoint}/${id}/generate-pdf`);
  }

  async sendEmail(id: string): Promise<{ success: boolean; message: string }> {
    return httpClient.postWrapped<{ success: boolean; message: string }>(`${this.endpoint}/${id}/send-email`);
  }

  async generateAndSend(id: string): Promise<{ pdfUrl: string; emailSent: boolean }> {
    return httpClient.postWrapped<{ pdfUrl: string; emailSent: boolean }>(`${this.endpoint}/${id}/generate-and-send`);
  }

  /**
   * Parse CSV file and return certificate data
   * Client-side CSV parsing for bulk import
   */
  async parseCSVFile(file: File): Promise<BulkImportCertificateDto[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length < 2) {
            reject(new Error('CSV dosyası en az bir başlık satırı ve bir veri satırı içermelidir'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
          const certificates: BulkImportCertificateDto[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);

            if (values.length !== headers.length) {
              continue; // Skip malformed lines
            }

            const cert: BulkImportCertificateDto = {
              recipientName: '',
              recipientEmail: '',
              trainingTitle: '',
            };

            headers.forEach((header, index) => {
              const value = values[index]?.trim().replace(/^["']|["']$/g, '') || '';

              switch (header) {
                case 'user_email':
                case 'useremail':
                case 'email':
                  cert.recipientEmail = value;
                  cert.userEmail = value;
                  break;
                case 'certificate_name':
                case 'certificatename':
                case 'name':
                case 'training_title':
                  cert.trainingTitle = value;
                  cert.certificateName = value;
                  break;
                case 'issue_date':
                case 'issuedate':
                case 'issued_at':
                  cert.issuedAt = value;
                  cert.issueDate = value;
                  break;
                case 'expiry_date':
                case 'expirydate':
                case 'valid_until':
                  cert.validUntil = value || null;
                  cert.expiryDate = value || null;
                  break;
                case 'description':
                  cert.description = value;
                  break;
                case 'recipient_name':
                case 'recipientname':
                  cert.recipientName = value;
                  break;
              }
            });

            // Generate recipient name from email if not provided
            if (!cert.recipientName && cert.recipientEmail) {
              cert.recipientName = cert.recipientEmail.split('@')[0].replace(/[._]/g, ' ');
            }

            if (cert.recipientEmail && cert.trainingTitle) {
              certificates.push(cert);
            }
          }

          resolve(certificates);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Bulk import certificates
   */
  async bulkImportCertificates(certificates: BulkImportCertificateDto[]): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const cert of certificates) {
      try {
        await this.create({
          recipientName: cert.recipientName,
          recipientEmail: cert.recipientEmail || cert.userEmail || '',
          trainingTitle: cert.trainingTitle || cert.certificateName || '',
          description: cert.description,
          issuedAt: cert.issuedAt || cert.issueDate,
          validUntil: cert.validUntil || cert.expiryDate,
        });
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${cert.recipientEmail}: ${(error as Error).message}`);
      }
    }

    return result;
  }
}

export const certificatesService = new CertificatesService();
export default certificatesService;


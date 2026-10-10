import httpClient from './httpClient';

export interface Certificate {
  id: string;
  name: string;
  description: string;
  issueDate: string;
  expiryDate: string | null;
  fileUrl: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  templateId?: string; // Add templateId property
}

export interface CreateCertificateDto {
  name: string;
  description: string;
  issueDate: string;
  expiryDate?: string;
  userId: string;
  templateId?: string; // Add templateId property
}

export interface UpdateCertificateDto {
  name?: string;
  description?: string;
  issueDate?: string;
  expiryDate?: string;
  userId?: string;
  templateId?: string; // Add templateId property
}

export interface BulkImportCertificateDto {
  userEmail: string;
  certificateName: string;
  issueDate: string;
  expiryDate?: string;
  description?: string;
  filePath?: string;
}

class CertificatesService {
  async getAllCertificates(userId?: string): Promise<Certificate[]> {
    const url = userId ? `/certificates?userId=${userId}` : '/certificates';
    return httpClient.get<Certificate[]>(url);
  }

  async getCertificateById(id: string): Promise<Certificate> {
    return httpClient.get<Certificate>(`/certificates/${id}`);
  }

  async createCertificate(certificateData: CreateCertificateDto, file?: File): Promise<Certificate> {
    const formData = new FormData();
    
    // Append file if provided
    if (file) {
      formData.append('file', file);
    }
    
    // Append certificate data as JSON string
    formData.append('certificateData', JSON.stringify(certificateData));
    
    // For simplicity, we're sending data as form fields
    Object.keys(certificateData).forEach(key => {
      formData.append(key, (certificateData as any)[key]);
    });
    
    return httpClient.post<Certificate>('/certificates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async updateCertificate(id: string, certificateData: UpdateCertificateDto, file?: File): Promise<Certificate> {
    const formData = new FormData();
    
    // Append file if provided
    if (file) {
      formData.append('file', file);
    }
    
    // Append certificate data as JSON string
    Object.keys(certificateData).forEach(key => {
      formData.append(key, (certificateData as any)[key]);
    });
    
    return httpClient.put<Certificate>(`/certificates/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteCertificate(id: string): Promise<void> {
    return httpClient.delete<void>(`/certificates/${id}`);
  }

  async bulkImportCertificates(certificates: BulkImportCertificateDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    return httpClient.post<{ success: number; failed: number; errors: string[] }>('/certificates/bulk-import', certificates);
  }

  // PDF Generation method
  async generateCertificatePdf(id: string): Promise<string> {
    const response = await httpClient.get<{ fileUrl: string }>(`/certificates/${id}/pdf`);
    return response.fileUrl;
  }

  // CSV parsing utility
  parseCSVFile(file: File): Promise<BulkImportCertificateDto[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const certificates: BulkImportCertificateDto[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const cert: any = {};
            
            headers.forEach((header, index) => {
              const value = values[index] || '';
              switch (header) {
                case 'user_email':
                  cert.userEmail = value;
                  break;
                case 'certificate_name':
                  cert.certificateName = value;
                  break;
                case 'issue_date':
                  cert.issueDate = value;
                  break;
                case 'expiry_date':
                  cert.expiryDate = value || undefined;
                  break;
                case 'description':
                  cert.description = value || undefined;
                  break;
                case 'file_path':
                  cert.filePath = value || undefined;
                  break;
              }
            });
            
            if (cert.userEmail && cert.certificateName && cert.issueDate) {
              certificates.push(cert as BulkImportCertificateDto);
            }
          }
          
          resolve(certificates);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

export default new CertificatesService();
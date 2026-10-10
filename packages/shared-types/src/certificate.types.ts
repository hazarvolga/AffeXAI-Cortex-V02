/**
 * Certificate Types
 * 
 * Shared types for certificate system
 */

// ============================================================================
// Enums
// ============================================================================

export enum CertificateStatusEnum {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  REVOKED = 'revoked',
}

// ============================================================================
// Certificate Entity Types
// ============================================================================

export interface Certificate {
  id: string;
  recipientName: string | null;
  recipientEmail: string | null;
  trainingTitle: string | null;
  description: string | null;
  
  // Template & Media
  templateId: string | null;
  logoUrl: string | null;
  logoMediaId: string | null;
  signatureUrl: string | null;
  imageUrl: string | null;
  
  // PDF Storage
  pdfUrl: string | null;
  
  // Status & Dates
  status: CertificateStatusEnum;
  issuedAt: string;
  validUntil: string | null;
  sentAt: string | null;
  
  // Relations
  userId: string | null;
  eventId: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Computed properties (frontend only)
  certificateNumber?: string;
  verificationUrl?: string;
}

// ============================================================================
// Certificate Template Types
// ============================================================================

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateCertificateDto {
  recipientName: string;
  recipientEmail: string;
  trainingTitle: string;
  description?: string;
  
  // Template & Media
  templateId?: string;
  logoUrl?: string;
  logoMediaId?: string;
  signatureUrl?: string;
  imageUrl?: string;
  
  // Dates
  issuedAt?: string;
  validUntil?: string;
  
  // Status
  status?: CertificateStatusEnum;
  
  // Relations
  userId?: string;
  eventId?: string;
  
  // Backward compatibility
  name?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface UpdateCertificateDto {
  recipientName?: string;
  recipientEmail?: string;
  trainingTitle?: string;
  description?: string;
  
  // Template & Media
  templateId?: string;
  logoUrl?: string;
  logoMediaId?: string;
  signatureUrl?: string;
  imageUrl?: string;
  
  // Dates
  issuedAt?: string;
  validUntil?: string;
  
  // Status
  status?: CertificateStatusEnum;
  
  // Relations
  userId?: string;
  eventId?: string;
  
  // Backward compatibility
  name?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface CreateCertificateTemplateDto {
  name: string;
  description?: string;
  content: string;
  thumbnailUrl?: string;
  isActive?: boolean;
}

export interface UpdateCertificateTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
}

export interface GenerateCertificateDto {
  eventId: string;
  userId?: string; // If not provided, generate for all attendees
}

export interface BulkImportDto {
  eventId: string;
  csvData: string; // CSV content with recipient information
}

// ============================================================================
// Query/Filter Types
// ============================================================================

export interface CertificateQueryParams {
  page?: number;
  limit?: number;
  status?: CertificateStatusEnum;
  search?: string;
  eventId?: string;
  userId?: string;
  sortBy?: 'issuedAt' | 'createdAt' | 'recipientName';
  sortOrder?: 'ASC' | 'DESC';
}

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface CertificateDashboardStats {
  totalCertificates: number;
  issuedCertificates: number;
  pendingCertificates: number;
  revokedCertificates: number;
  monthlyIssued: number;
  issuanceRate: number;
}
/**
 * Event & Certificate Types
 * 
 * Shared types for event management and certificate system
 */

// ============================================================================
// Enums
// ============================================================================

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum EventCategory {
  WEBINAR = 'Webinar',
  WORKSHOP = 'Workshop',
  CONFERENCE = 'Conference',
  TRAINING = 'Training',
  MEETUP = 'Meetup',
  OTHER = 'Other',
}

// ============================================================================
// Certificate Configuration Types
// ============================================================================

export interface CertificateConfig {
  enabled: boolean;
  templateId: string | null;
  logoMediaId: string | null;
  description: string | null;
  validityDays: number | null;
  autoGenerate: boolean;
}

// ============================================================================
// Event Metadata Types
// ============================================================================

export interface TicketType {
  name: string;
  price: string;
  quantity: string;
}

export interface EventMetadata {
  category?: string;
  isOnline?: boolean;
  ticketTypes?: TicketType[];
  // Add other unstructured metadata here
  [key: string]: any;
}

// ============================================================================
// Base Event Entity
// ============================================================================

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  capacity: number;
  price: number;
  status: EventStatus;
  startDate: string;
  endDate: string;
  slug: string;
  templateId: string;
  registrationMetadata: Record<string, any> | null;

  // Certificate fields (dedicated columns, not in metadata)
  grantsCertificate: boolean;
  certificateTitle: string | null;
  certificateConfig: CertificateConfig | null;

  // Metadata for flexible unstructured data
  metadata: EventMetadata;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // Relations (populated when needed)
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
  attendees?: EventAttendee[];
}

// ============================================================================
// Event Attendee Types
// ============================================================================

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  certificateId: string | null;
  registeredAt: string;
  attendedAt: string | null;

  // Populated user data
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateEventDto {
  title: string;
  description: string;
  location: string;
  capacity: number;
  price: number;
  status: EventStatus;
  startDate: string;
  endDate: string;
  slug?: string;
  templateId?: string;
  registrationMetadata?: Record<string, any> | null;

  // Certificate fields
  grantsCertificate?: boolean;
  certificateTitle?: string | null;
  certificateConfig?: CertificateConfig | null;

  // Metadata
  metadata?: EventMetadata;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  location?: string;
  capacity?: number;
  price?: number;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  slug?: string;
  templateId?: string;
  registrationMetadata?: Record<string, any> | null;

  // Certificate fields
  grantsCertificate?: boolean;
  certificateTitle?: string | null;
  certificateConfig?: CertificateConfig | null;

  // Metadata
  metadata?: EventMetadata;
}

// ============================================================================
// Frontend-Specific Types (for UI components)
// ============================================================================

export interface EventWithUIData extends Event {
  // Additional frontend-only fields
  imageUrl?: string;
  isFavorite?: boolean;

  // Parsed metadata for easier access
  category?: string;
  isOnline?: boolean;
  ticketTypes?: TicketType[];

  // Location breakdown (if needed)
  city?: string;
  country?: string;
}

// ============================================================================
// Query/Filter Types
// ============================================================================

export interface EventQueryParams {
  page?: number;
  limit?: number;
  status?: EventStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  grantsCertificate?: boolean;
  sortBy?: 'startDate' | 'createdAt' | 'title';
  sortOrder?: 'ASC' | 'DESC'; // Match common.types SortOrder enum values
}

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface EventDashboardStats {
  upcomingEvents: number;
  totalTicketSales: number;
  totalParticipants: number;
  monthlyRevenue: number;
  revenueChange: number;
}

// ============================================================================
// Bulk Certificate Types
// ============================================================================

export interface BulkCertificateRequest {
  eventId: string;
  userIds?: string[]; // If not provided, create for all attendees
}

export interface BulkCertificateResponse {
  success: boolean;
  certificatesCreated: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

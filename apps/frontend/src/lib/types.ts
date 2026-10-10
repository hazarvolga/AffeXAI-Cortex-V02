import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
};

export type MegaMenuCategory = {
  title: string;
  href: string;
  items: NavItem[];
};

export type Solution = {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  image: string;
};

export type Product = {
  id: string;
  title: string;
  version: 'Basic' | 'Concept' | 'Professional' | 'Ultimate' | 'Civil' | 'Precast';
  description: string;
  relatedSolutions: string[];
  image: string;
};

export type Resource = {
  id: string;
  title: string;
  type: 'webinar' | 'certification' | 'event';
  description: string;
  link: string;
  date?: string;
  image: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  region: 'Global' | 'Türkiye';
  discipline: 'Structural' | 'Civil' | 'Bridge' | 'Precast';
  excerpt: string;
  imageUrl: string;
  imageHint: string;
  content: string; // Markdown or rich text
};

export type DownloadableResource = {
  id: string;
  title:string;
  description: string;
  link: string;
  type: 'FAQ' | 'Tutorial' | 'License' | 'Link';
};

// --- Assessment System Types ---
export type AssessmentQuestion = {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text';
  options?: { id: string; text: string }[];
  correctOptionId?: string;
};

export type Assessment = {
  id: string;
  eventId: string;
  title: string;
  type: 'quiz' | 'survey';
  questions: AssessmentQuestion[];
};

export type AssessmentSubmission = {
  id: string;
  assessmentId: string;
  userId: string;
  answers: { questionId: string; answer: string }[];
  score: number;
  submittedAt: string;
};
// --- End Assessment System Types ---


// Event Management System Types
export type Venue = {
  venue: string;
  address: string;
  city: string;
  country: string;
};

export type Organizer = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Attendee = {
    id: string;
    name: string;
    email: string;
    ticketId: string;
    certificateId?: string;
};

export type Ticket = {
  id: string;
  userId: string;
  eventId: string;
  type: string; // e.g., 'General', 'VIP'
  qrCode: string; // URL to the QR code image
  status: 'valid' | 'checked-in';
};

export type Event = {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string; // ISO 8601 format
  imageUrl: string;
  isOnline: boolean;
  location: Venue;
  organizer: Organizer;
  isFavorite?: boolean;
  attendees?: Attendee[];
  grantsCertificate?: boolean;
  certificateTitle?: string;
  assessments?: Assessment[];
};

// Support Management System Types
export type SupportAuthor = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type SupportUser = {
  id: string;
  name: string;
  email: string;
  company: string;
};

export type TicketMessage = {
  author: SupportAuthor;
  content: string;
  htmlContent?: string;
  timestamp: string; // ISO 8601 format
  isInternal?: boolean; // Whether this is an internal note (not visible to customer)
};

export type SupportCategory = {
  id: string;
  name: string;
  description: string;
  ticketCount: number;
  parentId?: string | null;
};

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string; // ISO 8601 format
  lastUpdated: string; // ISO 8601 format
  user: SupportUser;
  assignee: SupportAuthor;
  messages: TicketMessage[];
};

// Knowledge Base Types
export type KbCategory = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export type KbArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown or rich text
  categoryId: string;
  tags: string[];
  lastUpdated: string; // ISO 8601 format
  views: number;
  author: {
    name: string;
    avatarUrl: string;
  };
};

// Certificate Management Types
export type Certificate = {
  certificateNumber: string; // Unique certificate number
  recipientName: string;
  recipientEmail: string;
  certificateName: string;
  issuedAt: string; // ISO 8601 format
  validUntil?: string; // ISO 8601 format, optional
  templateId: string;
  verificationUrl: string;
  eventId?: string;
  status: 'Generated' | 'Pending' | 'Revoked';
  generationMethod: 'Auto' | 'Manual (Single)' | 'Manual (Bulk Import)';
};

// Role and Permission Management Types
export type Permission = {
  id: string; // e.g., 'users.create'
  name: string; // e.g., 'Create Users'
  category: string; // e.g., 'User Management'
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
  userCount: number;
};


// Content Management System (CMS) Types
export type CmsPageContent = {
  type: 'hero' | 'text' | 'image' | 'cta';
  content: any;
};

export type CmsPage = {
  id: string;
  title: string;
  slug: string; // e.g., '/about'
  status: 'published' | 'draft';
  content: CmsPageContent[];
  seo: {
    title: string;
    description: string;
  };
  authorId: string;
  lastUpdated: string; // ISO 8601
};

export type MenuItem = {
    id: string;
    title: string;
    href: string;
    behavior: 'link' | 'dropdown' | 'mega';
    parentId: string | null | undefined;
    children?: MenuItem[];
    megaMenuCategories?: MegaMenuCategory[]; // Re-use from existing types
}

export type Menu = {
    id: string;
    name: string;
    items: MenuItem[];
}

// Newsletter System Types
export type Subscriber = {
  id: string;
  email: string;
  subscribedAt: string; // ISO 8601 format
  status: 'aktif' | 'onay bekliyor' | 'iptal edilmiş';
  groups: string[]; // Array of group IDs
  segments: string[]; // Array of segment names (since they are dynamic)
};

export type Campaign = {
  id: string;
  title: string;
  subject: string;
  content: string; // HTML content
  status: 'taslak' | 'gönderildi' | 'planlandı';
  createdAt: string; // ISO 8601 format
  sentAt?: string; // ISO 8601 format
  scheduledFor?: string; // ISO 8601 format
  recipientCount?: number;
  openRate?: number; // Percentage
  clickRate?: number; // Percentage
};

export type Segment = {
  id: string;
  name: string;
  description: string;
  subscriberCount: number;
  criteria: string; // In a real app, this might be a structured object of rules
};

export type Group = {
  id: string;
  name: string;
  description: string;
  subscriberCount: number;
};

export type EmailTemplate = {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    createdAt: string; // ISO 8601 format
    content: string; // HTML/JSON structure for the template
};


// Social Media Management Types
export type SocialPlatform = 'Facebook' | 'Twitter' | 'LinkedIn' | 'YouTube' | 'Instagram' | 'Pinterest' | 'TikTok';

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  username: string;
  avatarUrl: string;
  isConnected: boolean;
};

export type SocialPostStatus = 'Yayınlandı' | 'Planlandı' | 'Taslak' | 'Hata';

export type SocialPost = {
    id: string;
    accountId: string;
    status: SocialPostStatus;
    content: string;
    scheduledAt?: string;
    publishedAt?: string;
    sourceContentId: string; // e.g., event ID, blog post ID
    sourceContentType: 'event' | 'blog' | 'page';
};

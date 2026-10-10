/**
 * Core types and interfaces for WordPress to CMS migration
 */

export interface MigrationOptions {
  sourceDir: string;          // extracted_pages/
  uploadsDir: string;         // extracted_pages/uploads/
  dryRun: boolean;
  verbose: boolean;
  batchSize: number;
  skipMedia: boolean;
  pageFilter?: string[];      // Specific pages to migrate
}

export interface MigrationResult {
  totalPages: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: MigrationError[];
  mediaReport: MediaReport;
  duration: number;
}

export interface ParsedContent {
  title: string;
  slug: string;
  sections: ContentSection[];
  images: ImageReference[];
  videos: VideoReference[];
  links: LinkReference[];
  metadata: PageMetadata;
}

export interface ContentSection {
  type: 'hero' | 'features' | 'stats' | 'cta' | 'text' | 'workflow';
  order: number;
  content: any;  // Type-specific content
}

export interface ImageReference {
  originalUrl: string;
  altText: string;
  context: string;  // Where it appears (hero, feature-1, etc.)
}

export interface VideoReference {
  url: string;
  platform: 'youtube' | 'vimeo' | 'other';
  embedCode?: string;
}

export interface LinkReference {
  url: string;
  text: string;
  isInternal: boolean;
}

export interface PageMetadata {
  filename: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface IndustrySolutionContent extends ParsedContent {
  hero: HeroSection;
  workflowTabs?: WorkflowTabsSection;
  features: FeaturesSection;
  stats?: StatsSection;
  cta: CTASection;
}

export interface HeroSection {
  title: string;
  subtitle: string;
  description: string;
  primaryButton?: ButtonConfig;
  secondaryButton?: ButtonConfig;
  backgroundImage?: string;
}

export interface ButtonConfig {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary';
}

export interface WorkflowTabsSection {
  title: string;
  subtitle: string;
  description: string;
  mainTabs: WorkflowTab[];
}

export interface WorkflowTab {
  id: string;
  label: string;
  icon: string;
  subTabs: WorkflowSubTab[];
}

export interface WorkflowSubTab {
  id: string;
  label: string;
  icon: string;
  title: string;
  description: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl?: string;
}

export interface FeaturesSection {
  title: string;
  subtitle: string;
  features: Feature[];
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface StatsSection {
  stats: Stat[];
}

export interface Stat {
  value: string;
  label: string;
  description: string;
}

export interface CTASection {
  title: string;
  description: string;
  primaryButton?: ButtonConfig;
  secondaryButton?: ButtonConfig;
}

export interface MediaMapping {
  [oldUrl: string]: string;  // old URL -> new CMS URL
}

export interface MediaUploadResult {
  success: boolean;
  originalPath: string;
  newUrl?: string;
  error?: string;
}

export interface MediaReport {
  totalImages: number;
  uploadedCount: number;
  failedCount: number;
  skippedCount: number;
  failures: MediaUploadResult[];
  mapping: MediaMapping;
}

export interface MigrationError {
  timestamp: Date;
  component: string;
  page: string;
  error: string;
  stack?: string;
}

export interface TemplateMapping {
  templateId: string;
  templateName: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PageCreationResult {
  success: boolean;
  pageId?: string;
  componentCount?: number;
  error?: string;
}

export interface BlockConfig {
  type: string;
  props: any;
  orderIndex: number;
}

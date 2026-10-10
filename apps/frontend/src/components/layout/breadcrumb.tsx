'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage?: boolean;
}

export interface BreadcrumbProps {
  /**
   * Custom breadcrumb items (overrides auto-generation)
   */
  items?: BreadcrumbItem[];
  
  /**
   * Show home icon instead of text
   */
  showHomeIcon?: boolean;
  
  /**
   * Custom separator (default: ChevronRight)
   */
  separator?: React.ReactNode;
  
  /**
   * Style variant
   */
  variant?: 'default' | 'minimal' | 'accent';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Hide breadcrumb on specific paths
   */
  hiddenPaths?: string[];
}

// ============================================================================
// LABEL MAPPINGS (URL Segment → Human Readable)
// ============================================================================

const LABEL_MAP: Record<string, string> = {
  // Main sections
  'solutions': 'Çözümler',
  'products': 'Ürünler',
  'services': 'Hizmetler',
  'about': 'Hakkımızda',
  'contact': 'İletişim',
  'blog': 'Blog',
  'downloads': 'İndirmeler',
  'education': 'Eğitim',
  'support': 'Destek',
  'pages': 'Sayfalar',
  
  // Solutions
  'infrastructure-design': 'Altyapı Tasarımı',
  'infrastructure-engineering': 'Altyapı Mühendisliği',
  'bridge-construction': 'Köprü İnşaatı',
  'building-design': 'Bina Tasarımı',
  
  // Products
  'allplan': 'ALLPLAN',
  'allplan-architecture': 'ALLPLAN Architecture',
  'allplan-engineering': 'ALLPLAN Engineering',
  'allplan-bim': 'ALLPLAN BIM',
  'basic': 'Basic',
  'professional': 'Professional',
  'ultimate': 'Ultimate',
  'civil': 'Civil',
  'concept': 'Concept',
  'precast': 'Precast',
  
  // Services
  'training': 'Eğitim',
  'consulting': 'Danışmanlık',
  'support-services': 'Destek Hizmetleri',
  
  // Other
  'admin': 'Yönetim',
  'cms': 'İçerik Yönetimi',
  'design': 'Tasarım',
  'dashboard': 'Kontrol Paneli',
};

/**
 * Convert URL segment to human-readable label
 */
function segmentToLabel(segment: string): string {
  // Check mapping first
  if (LABEL_MAP[segment]) {
    return LABEL_MAP[segment];
  }
  
  // Fallback: capitalize and replace dashes/underscores
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ============================================================================
// AUTO-GENERATION FROM URL PATH
// ============================================================================

/**
 * Generate breadcrumb items from current URL path
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  // Remove leading/trailing slashes and split
  const segments = pathname
    .replace(/^\/|\/$/g, '')
    .split('/')
    .filter(Boolean);
  
  // Always start with home
  const items: BreadcrumbItem[] = [
    { label: 'Anasayfa', href: '/', isCurrentPage: segments.length === 0 },
  ];
  
  // Build breadcrumb for each segment
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    items.push({
      label: segmentToLabel(segment),
      href: currentPath,
      isCurrentPage: index === segments.length - 1,
    });
  });
  
  return items;
}

// ============================================================================
// BREADCRUMB COMPONENT
// ============================================================================

export function Breadcrumb({
  items: customItems,
  showHomeIcon = true,
  separator,
  variant = 'default',
  className,
  hiddenPaths = ['/'],
}: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Check if breadcrumb should be hidden on this path
  if (hiddenPaths.includes(pathname)) {
    return null;
  }
  
  // Use custom items or auto-generate from URL
  const items = customItems || generateBreadcrumbsFromPath(pathname);
  
  // Don't render if only home
  if (items.length <= 1) {
    return null;
  }
  
  // Variant styles
  const variantStyles = {
    default: 'bg-background/50 border-b border-border',
    minimal: '',
    accent: 'bg-accent/5 border-b border-accent/20',
  };
  
  const linkStyles = {
    default: 'text-muted-foreground hover:text-foreground',
    minimal: 'text-muted-foreground/80 hover:text-foreground',
    accent: 'text-accent-foreground/70 hover:text-accent-foreground',
  };
  
  const currentPageStyles = {
    default: 'text-foreground font-medium',
    minimal: 'text-foreground/90 font-medium',
    accent: 'text-accent-foreground font-semibold',
  };
  
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'w-full py-3',
        variantStyles[variant],
        className
      )}
    >
      <div className="container mx-auto px-4">
        <ol className="flex items-center gap-2 text-sm">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = item.isCurrentPage;
            
            return (
              <li key={item.href} className="flex items-center gap-2">
                {/* Separator (except before first item) */}
                {!isFirst && (
                  <span className="text-muted-foreground/50" aria-hidden="true">
                    {separator || <ChevronRight className="h-4 w-4" />}
                  </span>
                )}
                
                {/* Breadcrumb Item */}
                {isLast ? (
                  <span
                    className={cn(currentPageStyles[variant])}
                    aria-current="page"
                  >
                    {isFirst && showHomeIcon ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      item.label
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'transition-colors duration-200',
                      linkStyles[variant]
                    )}
                  >
                    {isFirst && showHomeIcon ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      item.label
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default Breadcrumb;

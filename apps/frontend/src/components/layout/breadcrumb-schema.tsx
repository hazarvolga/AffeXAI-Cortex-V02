'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import type { BreadcrumbItem } from './breadcrumb';
import DOMPurify from 'dompurify';

// ============================================================================
// TYPES (Schema.org JSON-LD)
// ============================================================================

interface SchemaListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string; // URL (omitted for last item)
}

interface SchemaBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: SchemaListItem[];
}

export interface BreadcrumbSchemaProps {
  /**
   * Custom breadcrumb items
   */
  items?: BreadcrumbItem[];

  /**
   * Base URL for absolute URLs (e.g., 'https://xyz.example')
   */
  baseUrl?: string;
}

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

/**
 * Generate Schema.org BreadcrumbList JSON-LD
 */
function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  baseUrl: string
): SchemaBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1;

      // Build absolute URL
      const absoluteUrl = item.href.startsWith('http')
        ? item.href
        : `${baseUrl}${item.href}`;

      // Schema.org spec: omit "item" for last element
      const schemaItem: SchemaListItem = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
      };

      if (!isLast) {
        schemaItem.item = absoluteUrl;
      }

      return schemaItem;
    }),
  };
}

// ============================================================================
// BREADCRUMB SCHEMA COMPONENT (SEO)
// ============================================================================

/**
 * Renders Schema.org JSON-LD for breadcrumb navigation
 * Google reads this for Rich Results in search
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 * @see https://schema.org/BreadcrumbList
 */
export function BreadcrumbSchema({
  items,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL,
}: BreadcrumbSchemaProps) {
  const pathname = usePathname();

  // If no custom items, skip (Breadcrumb component will generate them)
  // This component is only for SEO markup
  if (!items || items.length <= 1 || !baseUrl) {
    return null;
  }

  const schema = generateBreadcrumbSchema(items, baseUrl);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(JSON.stringify(schema, null, 2)),
      }}
    />
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default BreadcrumbSchema;

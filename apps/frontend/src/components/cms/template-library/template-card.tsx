/**
 * TemplateCard Component
 *
 * Displays template preview with color scheme and metadata
 * Shows design token color scheme visually
 */

'use client';

import React from 'react';
import type { PageTemplate } from '@/types/cms-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useDesignTokens } from '@/providers/DesignTokensProvider';
import { resolveColorScheme } from '@/lib/cms/token-resolver';
import { Eye, Download, Star, Users } from 'lucide-react';

interface TemplateCardProps {
  template: PageTemplate;
  onPreview?: (template: PageTemplate) => void;
  onApply?: (template: PageTemplate) => void;
  onSelect?: (template: PageTemplate) => void;
  selected?: boolean;
}

/**
 * Color Scheme Preview Component
 * Shows the template's color palette with resolved token values
 */
function ColorSchemePreview({ template }: { template: PageTemplate }) {
  const { tokens } = useDesignTokens();

  // Resolve color scheme tokens to actual values
  const resolvedColors = resolveColorScheme(template.designSystem.colorScheme, tokens);

  const colorKeys: Array<keyof typeof template.designSystem.colorScheme> = [
    'primary',
    'accent',
    'background',
    'foreground',
  ];

  return (
    <div className="flex gap-1">
      {colorKeys.map((key) => {
        const color = resolvedColors[key];
        if (!color) return null;

        // Convert HSL format to CSS
        const cssColor = color.includes(' ') ? `hsl(${color})` : color;

        return (
          <div
            key={key}
            className="h-6 w-6 rounded-full border border-border shadow-sm"
            style={{ backgroundColor: cssColor }}
            title={`${key}: ${color}`}
          />
        );
      })}
    </div>
  );
}

/**
 * Template Category Badge
 */
function CategoryBadge({ category }: { category: PageTemplate['category'] }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    'Landing Page': { variant: 'default', label: 'Landing' },
    'Education': { variant: 'secondary', label: 'Education' },
    'Business': { variant: 'default', label: 'Business' },
    'Portfolio': { variant: 'secondary', label: 'Portfolio' },
    'Blog': { variant: 'outline', label: 'Blog' },
    'Product': { variant: 'default', label: 'Product' },
    'Solutions': { variant: 'secondary', label: 'Solutions' },
    'Event': { variant: 'outline', label: 'Event' },
    'Contact': { variant: 'default', label: 'Contact' },
    'Team': { variant: 'secondary', label: 'Team' },
    'FAQ': { variant: 'outline', label: 'FAQ' },
    'Legal': { variant: 'outline', label: 'Legal' },
    'Pricing': { variant: 'default', label: 'Pricing' },
    'News': { variant: 'secondary', label: 'News' },
    'Case Study': { variant: 'default', label: 'Case Study' },
    'Feature': { variant: 'outline', label: 'Feature' },
    'Error': { variant: 'secondary', label: 'Error' },
    'Verification': { variant: 'default', label: 'Verification' },
    'Campaign': { variant: 'outline', label: 'Campaign' },
    'E-Commerce': { variant: 'default', label: 'E-Commerce' },
  };

  const config = variants[category] || { variant: 'outline' as const, label: category };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

/**
 * Main TemplateCard Component
 */
export function TemplateCard({
  template,
  onPreview,
  onApply,
  onSelect,
  selected = false,
}: TemplateCardProps) {
  return (
    <Card
      className={`group hover:shadow-lg transition-shadow cursor-pointer ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(template)}
    >
      {/* Preview Image */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
        {template.preview?.thumbnail ? (
          <img
            src={template.preview.thumbnail}
            alt={template.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Eye className="h-12 w-12" />
          </div>
        )}

        {/* Featured Badge */}
        {template.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}

        {/* Block Count */}
        <Badge className="absolute top-2 left-2 bg-black/50 text-white">
          {template.blocks.length} blocks
        </Badge>
      </div>

      {/* Content */}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <CategoryBadge category={template.category} />
        </div>
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Color Scheme */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Color Scheme</div>
          <ColorSchemePreview template={template} />
        </div>

        {/* Supported Contexts */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium">Contexts</div>
          <div className="flex gap-1">
            {template.designSystem.supportedContexts.map((context) => (
              <Badge key={context} variant="outline" className="text-xs">
                {context}
              </Badge>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        {template.usageCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{template.usageCount} uses</span>
          </div>
        )}

        {/* Tags */}
        {template.metadata?.tags && template.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.metadata.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.metadata.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.metadata.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(template);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onApply?.(template);
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Apply
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Compact Template Card for sidebar
 */
export function CompactTemplateCard({
  template,
  onSelect,
  selected = false,
}: Pick<TemplateCardProps, 'template' | 'onSelect' | 'selected'>) {
  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(template)}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
          {template.preview?.thumbnail ? (
            <img
              src={template.preview.thumbnail}
              alt={template.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {template.blocks.length} blocks
          </div>
          <ColorSchemePreview template={template} />
        </div>
      </div>
    </div>
  );
}

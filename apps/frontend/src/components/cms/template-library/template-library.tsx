/**
 * TemplateLibrary Component
 *
 * Browse, filter, and apply page templates
 * Includes context filtering and search functionality
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { PageTemplate, TemplateCategory, TemplateFilters } from '@/types/cms-template';
import type { ThemeContext } from '@/types/design-tokens';
import { TemplateCard } from './template-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDesignTokens } from '@/providers/DesignTokensProvider';
import { validateTemplateContext } from '@/lib/cms/token-validator';
import { Search, Filter, Star, TrendingUp, Clock, SortAsc } from 'lucide-react';

interface TemplateLibraryProps {
  templates: PageTemplate[];
  onApplyTemplate?: (template: PageTemplate) => void;
  onPreviewTemplate?: (template: PageTemplate) => void;
  filterByContext?: boolean;
}

/**
 * Category filter chips
 */
const categoryOptions: { value: TemplateCategory; label: string }[] = [
  { value: 'Landing Page', label: 'Landing Pages' },
  { value: 'Education', label: 'Education' },
  { value: 'Business', label: 'Business' },
  { value: 'Portfolio', label: 'Portfolio' },
  { value: 'Blog', label: 'Blog' },
  { value: 'Product', label: 'Product' },
  { value: 'Solutions', label: 'Solutions' },
  { value: 'Event', label: 'Events' },
  { value: 'Contact', label: 'Contact' },
  { value: 'Team', label: 'Team' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Pricing', label: 'Pricing' },
  { value: 'News', label: 'News' },
  { value: 'Case Study', label: 'Case Studies' },
  { value: 'Feature', label: 'Features' },
  { value: 'Error', label: 'Error Pages' },
  { value: 'Verification', label: 'Verification' },
  { value: 'Campaign', label: 'Campaigns' },
  { value: 'E-Commerce', label: 'E-Commerce' },
];

/**
 * Sort options
 */
const sortOptions: { value: NonNullable<TemplateFilters['sortBy']>; label: string; icon: React.ReactNode }[] = [
  { value: 'popular', label: 'Most Popular', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'recent', label: 'Recently Added', icon: <Clock className="h-4 w-4" /> },
  { value: 'name', label: 'Name', icon: <SortAsc className="h-4 w-4" /> },
];

export function TemplateLibrary({
  templates,
  onApplyTemplate,
  onPreviewTemplate,
  filterByContext = true,
}: TemplateLibraryProps) {
  const { context: currentContext, tokens } = useDesignTokens();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<TemplateCategory[]>([]);
  const [selectedContext, setSelectedContext] = useState<ThemeContext | 'all'>(
    filterByContext ? currentContext : 'all'
  );
  const [sortBy, setSortBy] = useState<TemplateFilters['sortBy']>('popular');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.metadata?.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          template.metadata?.keywords?.some((keyword) => keyword.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategories.length > 0) {
      result = result.filter((template) => selectedCategories.includes(template.category));
    }

    // Filter by context compatibility
    if (selectedContext !== 'all') {
      result = result.filter((template) =>
        template.designSystem.supportedContexts.includes(selectedContext as ThemeContext)
      );
    }

    // Filter by featured
    if (showFeaturedOnly) {
      result = result.filter((template) => template.isFeatured);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result = [...result].sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'recent':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [templates, searchQuery, selectedCategories, selectedContext, sortBy, showFeaturedOnly]);

  // Validate template compatibility with current context
  const getTemplateCompatibility = (template: PageTemplate) => {
    if (selectedContext === 'all') return { isCompatible: true, warnings: [] };

    const validation = validateTemplateContext(
      template,
      selectedContext as ThemeContext,
      'light', // Default to light mode for validation
      tokens
    );

    return {
      isCompatible: validation.isValid,
      warnings: validation.warnings,
    };
  };

  // Toggle category filter
  const toggleCategory = (category: TemplateCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search and Sort */}
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as TemplateFilters['sortBy'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Featured Toggle */}
          <Button
            variant={showFeaturedOnly ? 'default' : 'outline'}
            onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
          >
            <Star className={`h-4 w-4 mr-2 ${showFeaturedOnly ? 'fill-current' : ''}`} />
            Featured
          </Button>
        </div>

        {/* Context Filter */}
        {filterByContext && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Context:</span>
            <div className="flex gap-2">
              {(['all', 'public', 'admin', 'portal'] as const).map((ctx) => (
                <Button
                  key={ctx}
                  variant={selectedContext === ctx ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedContext(ctx)}
                >
                  {ctx === 'all' ? 'All' : ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((option) => (
            <Badge
              key={option.value}
              variant={selectedCategories.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/90"
              onClick={() => toggleCategory(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const compatibility = getTemplateCompatibility(template);

            return (
              <div key={template.id} className="relative">
                <TemplateCard
                  template={template}
                  onApply={onApplyTemplate}
                  onPreview={onPreviewTemplate}
                />

                {/* Compatibility Warning */}
                {!compatibility.isCompatible && selectedContext !== 'all' && (
                  <Badge
                    variant="destructive"
                    className="absolute top-2 left-2 z-10"
                  >
                    Incompatible with {selectedContext}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Template Library Dialog/Modal Version
 */
export function TemplateLibraryModal({
  templates,
  open,
  onOpenChange,
  onApplyTemplate,
}: {
  templates: PageTemplate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate?: (template: PageTemplate) => void;
}) {
  const handleApply = (template: PageTemplate) => {
    onApplyTemplate?.(template);
    onOpenChange(false);
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-4 bg-background rounded-lg shadow-lg overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Choose a Template</h2>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              ✕
            </Button>
          </div>
          <TemplateLibrary
            templates={templates}
            onApplyTemplate={handleApply}
            filterByContext={true}
          />
        </div>
      </div>
    </div>
  );
}

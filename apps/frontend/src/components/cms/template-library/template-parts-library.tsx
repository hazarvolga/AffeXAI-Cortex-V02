/**
 * TemplatePartsLibrary Component
 *
 * Browse and manage reusable template parts (header, footer, sidebar, etc.)
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { TemplatePart } from '@/types/cms-template';
import {
  filterPartsByType,
  searchParts,
  sortPartsByPopularity,
  sortPartsByDate,
  getPartStatistics,
} from '@/lib/cms/template-parts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Layout,
  LayoutGrid,
  PanelTop,
  PanelBottom,
  SidebarIcon,
  Search,
  TrendingUp,
  Clock,
  Download,
  Eye,
  Plus,
} from 'lucide-react';

interface TemplatePartsLibraryProps {
  parts: TemplatePart[];
  onSelectPart?: (part: TemplatePart) => void;
  onApplyPart?: (part: TemplatePart) => void;
  onPreviewPart?: (part: TemplatePart) => void;
}

/**
 * Part type icons
 */
const partTypeIcons: Record<TemplatePart['type'], React.ReactNode> = {
  header: <PanelTop className="h-4 w-4" />,
  footer: <PanelBottom className="h-4 w-4" />,
  sidebar: <SidebarIcon className="h-4 w-4" />,
  section: <LayoutGrid className="h-4 w-4" />,
  custom: <Layout className="h-4 w-4" />,
};

/**
 * Part type labels
 */
const partTypeLabels: Record<TemplatePart['type'], string> = {
  header: 'Headers',
  footer: 'Footers',
  sidebar: 'Sidebars',
  section: 'Sections',
  custom: 'Custom',
};

/**
 * PartCard Component
 */
function PartCard({
  part,
  onSelect,
  onApply,
  onPreview,
  selected = false,
}: {
  part: TemplatePart;
  onSelect?: (part: TemplatePart) => void;
  onApply?: (part: TemplatePart) => void;
  onPreview?: (part: TemplatePart) => void;
  selected?: boolean;
}) {
  const stats = getPartStatistics(part);

  return (
    <Card
      className={`group hover:shadow-lg transition-shadow cursor-pointer ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(part)}
    >
      {/* Preview */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
        {part.preview?.thumbnail ? (
          <img
            src={part.preview.thumbnail}
            alt={part.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {partTypeIcons[part.type]}
          </div>
        )}

        {/* Block count badge */}
        <Badge className="absolute top-2 left-2 bg-black/50 text-white">
          {stats.blockCount} block{stats.blockCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Content */}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{part.name}</CardTitle>
          <div className="flex items-center gap-1">
            {partTypeIcons[part.type]}
          </div>
        </div>
        <CardDescription className="text-xs line-clamp-2">
          {part.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Statistics */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {stats.tokenReferences > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-mono">{stats.tokenReferences}</span>
              <span>tokens</span>
            </div>
          )}
          {part.usageCount > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{part.usageCount} uses</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(part);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onApply?.(part);
            }}
          >
            <Download className="h-3 w-3 mr-1" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main TemplatePartsLibrary Component
 */
export function TemplatePartsLibrary({
  parts,
  onSelectPart,
  onApplyPart,
  onPreviewPart,
}: TemplatePartsLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TemplatePart['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');

  // Filter and sort parts
  const filteredParts = useMemo(() => {
    let result = parts;

    // Search filter
    if (searchQuery) {
      result = searchParts(result, searchQuery);
    }

    // Type filter
    if (selectedType !== 'all') {
      result = filterPartsByType(result, selectedType);
    }

    // Sort
    if (sortBy === 'popular') {
      result = sortPartsByPopularity(result);
    } else {
      result = sortPartsByDate(result, 'desc');
    }

    return result;
  }, [parts, searchQuery, selectedType, sortBy]);

  // Count parts by type
  const partCounts = useMemo(() => {
    const counts: Record<TemplatePart['type'], number> = {
      header: 0,
      footer: 0,
      sidebar: 0,
      section: 0,
      custom: 0,
    };

    parts.forEach((part) => {
      counts[part.type]++;
    });

    return counts;
  }, [parts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Parts</h2>
          <p className="text-muted-foreground">
            Reusable sections for your templates
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Part
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search and Sort */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant={sortBy === 'popular' ? 'default' : 'outline'}
            onClick={() => setSortBy('popular')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular
          </Button>

          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            onClick={() => setSortBy('recent')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </Button>
        </div>

        {/* Type Tabs */}
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
          <TabsList>
            <TabsTrigger value="all">
              All ({parts.length})
            </TabsTrigger>
            <TabsTrigger value="header">
              <PanelTop className="h-4 w-4 mr-2" />
              Headers ({partCounts.header})
            </TabsTrigger>
            <TabsTrigger value="footer">
              <PanelBottom className="h-4 w-4 mr-2" />
              Footers ({partCounts.footer})
            </TabsTrigger>
            <TabsTrigger value="sidebar">
              <SidebarIcon className="h-4 w-4 mr-2" />
              Sidebars ({partCounts.sidebar})
            </TabsTrigger>
            <TabsTrigger value="section">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Sections ({partCounts.section})
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Layout className="h-4 w-4 mr-2" />
              Custom ({partCounts.custom})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Parts Grid */}
      {filteredParts.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No parts found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              onSelect={onSelectPart}
              onApply={onApplyPart}
              onPreview={onPreviewPart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Parts Sidebar
 */
export function CompactPartsLibrary({
  parts,
  onSelectPart,
  type,
}: {
  parts: TemplatePart[];
  onSelectPart?: (part: TemplatePart) => void;
  type?: TemplatePart['type'];
}) {
  const filteredParts = type ? filterPartsByType(parts, type) : parts;
  const sortedParts = sortPartsByPopularity(filteredParts);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">
          {type ? partTypeLabels[type] : 'All Parts'}
        </h3>
        <Badge variant="secondary">{sortedParts.length}</Badge>
      </div>

      <div className="space-y-2">
        {sortedParts.slice(0, 10).map((part) => {
          const stats = getPartStatistics(part);

          return (
            <div
              key={part.id}
              className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectPart?.(part)}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                  {partTypeIcons[part.type]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{part.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {stats.blockCount} block{stats.blockCount !== 1 ? 's' : ''}
                    {stats.tokenReferences > 0 && ` · ${stats.tokenReferences} tokens`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

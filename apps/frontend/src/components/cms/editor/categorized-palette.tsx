'use client';

/**
 * Categorized Palette
 * Simplified block palette organized by categories
 * Layer 3 component replacing overwhelming block list
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    blockCategories,
    getBlockCategory,
    getCoreCategories,
    getExtraCategories,
    isV2Block,
    type BlockCategoryConfig,
} from './block-categories';
import { blockRegistry, BlockType } from '../block-registry';
import {
    type LucideIcon,
    Search,
    ChevronDown,
    ChevronRight,
    Plus,
    Sparkles,
    MoreHorizontal,
    Layout,
    FileText,
    Grid3x3,
    Megaphone,
    Columns,
    Image,
    Menu,
    Quote,
    CreditCard,
    BarChart,
    Footprints,
    Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
    Layout,
    FileText,
    Grid3x3,
    Megaphone,
    Columns,
    Image,
    Menu,
    Quote,
    CreditCard,
    BarChart,
    Footprints,
    Archive,
};

interface CategorizedPaletteProps {
    onAddBlock: (blockType: string, defaultProps?: any) => void;
    className?: string;
}

export function CategorizedPalette({ onAddBlock, className }: CategorizedPaletteProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(['hero', 'content'])
    );
    const [showMoreCategories, setShowMoreCategories] = useState(false);

    // Organize blocks by category
    const blocksByCategory = useMemo(() => {
        const result: Record<string, { type: string; label: string; isV2: boolean }[]> = {};

        // Initialize all categories
        blockCategories.forEach((cat) => {
            result[cat.id] = [];
        });

        // Map registered blocks to categories
        Object.keys(blockRegistry).forEach((blockType) => {
            const category = getBlockCategory(blockType);
            const label = blockType
                .replace(/^v2-/, '')
                .replace(/^cms-/, '')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());

            result[category]?.push({
                type: blockType,
                label,
                isV2: isV2Block(blockType),
            });
        });

        return result;
    }, []);

    // Filter blocks by search
    const filteredBlocks = useMemo(() => {
        if (!searchQuery) return blocksByCategory;

        const query = searchQuery.toLowerCase();
        const filtered: typeof blocksByCategory = {};

        Object.entries(blocksByCategory).forEach(([category, blocks]) => {
            const matching = blocks.filter(
                (b) =>
                    b.type.toLowerCase().includes(query) ||
                    b.label.toLowerCase().includes(query)
            );
            if (matching.length > 0) {
                filtered[category] = matching;
            }
        });

        return filtered;
    }, [blocksByCategory, searchQuery]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const coreCategories = getCoreCategories();
    const extraCategories = getExtraCategories();

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Search */}
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search blocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
            </div>

            {/* Categories */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {/* Core Categories */}
                    {coreCategories.map((category) => (
                        <CategorySection
                            key={category.id}
                            category={category}
                            blocks={filteredBlocks[category.id] || []}
                            isExpanded={expandedCategories.has(category.id)}
                            onToggle={() => toggleCategory(category.id)}
                            onAddBlock={onAddBlock}
                        />
                    ))}

                    {/* More Categories Toggle */}
                    <div className="pt-2 border-t mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setShowMoreCategories(!showMoreCategories)}
                        >
                            <MoreHorizontal className="h-4 w-4 mr-2" />
                            {showMoreCategories ? 'Hide' : 'More'} Categories
                            <Badge variant="secondary" className="ml-auto">
                                {extraCategories.length}
                            </Badge>
                        </Button>

                        {showMoreCategories && (
                            <div className="mt-1 space-y-1">
                                {extraCategories.map((category) => (
                                    <CategorySection
                                        key={category.id}
                                        category={category}
                                        blocks={filteredBlocks[category.id] || []}
                                        isExpanded={expandedCategories.has(category.id)}
                                        onToggle={() => toggleCategory(category.id)}
                                        onAddBlock={onAddBlock}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

/**
 * Category Section Component
 */
interface CategorySectionProps {
    category: BlockCategoryConfig;
    blocks: { type: string; label: string; isV2: boolean }[];
    isExpanded: boolean;
    onToggle: () => void;
    onAddBlock: (blockType: string) => void;
}

function CategorySection({
    category,
    blocks,
    isExpanded,
    onToggle,
    onAddBlock,
}: CategorySectionProps) {
    const Icon = iconMap[category.icon] || Layout;

    if (blocks.length === 0) return null;

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start hover:bg-muted"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{category.label}</span>
                    <Badge variant="outline" className="text-xs">
                        {blocks.length}
                    </Badge>
                </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="ml-4 pl-4 border-l space-y-0.5 py-1">
                    {blocks.map((block) => (
                        <Button
                            key={block.type}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 text-sm font-normal"
                            onClick={() => onAddBlock(block.type)}
                        >
                            <Plus className="h-3 w-3 mr-2 opacity-50" />
                            <span className="flex-1 text-left truncate">{block.label}</span>
                            {block.isV2 && (
                                <Sparkles className="h-3 w-3 text-primary ml-1" />
                            )}
                        </Button>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export default CategorizedPalette;

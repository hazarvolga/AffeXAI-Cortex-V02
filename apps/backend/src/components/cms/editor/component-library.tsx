'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Component } from '@/lib/cms/cms-service';
import { ChevronDown, ChevronRight, Search, Layers, Type, Image as ImageIcon, ShoppingCart, Users, Rss, Share2, Grid3X3, Square, Circle } from 'lucide-react';
import { navigationBlocks } from '@/components/cms/blocks/navigation-blocks';
import { heroBlocks } from '@/components/cms/blocks/hero-blocks';
import { contentBlocks } from '@/components/cms/blocks/content-blocks';
import { footerBlocks } from '@/components/cms/blocks/footer-blocks';
import { elementBlocks } from '@/components/cms/blocks/element-blocks';
import { contentVariantBlocks } from '@/components/cms/blocks/content-variants-blocks';
import { specialBlocks } from '@/components/cms/blocks/special-blocks';
import { ecommerceBlocks } from '@/components/cms/blocks/ecommerce-blocks';
import { galleryBlocks } from '@/components/cms/blocks/gallery-blocks';
import { blogRssBlocks } from '@/components/cms/blocks/blog-rss-blocks';
import { socialSharingBlocks } from '@/components/cms/blocks/social-sharing-blocks';

interface ComponentItem {
  id: string;
  type: Component['type'];
  name: string;
  description: string;
  icon: string;
}

interface BlockItem {
  id: string;
  name: string;
  description: string;
  category: string;
  component: React.ComponentType;
}

interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  type: 'basic' | 'block';
  icon: React.ReactNode;
  components?: ComponentItem[];
  blocks?: BlockItem[];
}

interface ComponentLibraryProps {
  onComponentSelect: (componentType: Component['type']) => void;
  onBlockSelect?: (block: BlockItem) => void;
  displayMode?: 'components' | 'blocks' | 'all'; // New prop to control display mode
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ 
  onComponentSelect, 
  onBlockSelect,
  displayMode = 'all' // Default to showing all content
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'navigation': false,
    'hero': false,
    'content-sections': false,
    'footer': false,
    'elements': false,
    'content-variants': false,
    'special': false,
    'ecommerce': false,
    'gallery': false,
    'blog-rss': false,
    'social-sharing': false,
    'layout': false,
    'content': false,
    'media': false,
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Flatten all blocks and components for search
  const allItems = useMemo(() => {
    const items: { id: string; name: string; description: string; category: string; type: 'block' | 'component'; data: any }[] = [];
    
    // Add blocks
    [...navigationBlocks, ...heroBlocks, ...contentBlocks, ...footerBlocks, ...elementBlocks, 
     ...contentVariantBlocks, ...specialBlocks, ...ecommerceBlocks, ...galleryBlocks, 
     ...blogRssBlocks, ...socialSharingBlocks].forEach(block => {
      items.push({
        id: block.id,
        name: block.name,
        description: block.description,
        category: block.category,
        type: 'block',
        data: block
      });
    });
    
    // Add components only if displayMode is not 'blocks'
    if (displayMode !== 'blocks') {
      const componentCategories: ComponentCategory[] = [
        {
          id: 'layout',
          name: 'Page Layout Components',
          description: 'Structure and organize your page content',
          type: 'basic',
          icon: <Grid3X3 className="h-4 w-4" />,
          components: [
            {
              id: 'container',
              type: 'container',
              name: 'Container',
              description: 'Group components together with layout options',
              icon: 'C',
            },
            {
              id: 'grid',
              type: 'grid',
              name: 'Grid',
              description: 'Responsive grid layout for organizing content',
              icon: 'G',
            },
            {
              id: 'card',
              type: 'card',
              name: 'Card',
              description: 'Content card with consistent styling',
              icon: 'C',
            },
          ]
        },
        {
          id: 'content',
          name: 'Content Components',
          description: 'Text and interactive elements',
          type: 'basic',
          icon: <Type className="h-4 w-4" />,
          components: [
            {
              id: 'text',
              type: 'text',
              name: 'Text',
              description: 'Add headings, paragraphs, or other text content',
              icon: 'T',
            },
            {
              id: 'button',
              type: 'button',
              name: 'Button',
              description: 'Add a button for actions or navigation',
              icon: 'B',
            },
          ]
        },
        {
          id: 'media',
          name: 'Media Components',
          description: 'Images and multimedia elements',
          type: 'basic',
          icon: <ImageIcon className="h-4 w-4" />,
          components: [
            {
              id: 'image',
              type: 'image',
              name: 'Image',
              description: 'Add an image with optional caption',
              icon: 'I',
            },
          ]
        }
      ];
      
      componentCategories.forEach(category => {
        if (category.components) {
          category.components.forEach(component => {
            items.push({
              id: component.id,
              name: component.name,
              description: component.description,
              category: category.name,
              type: 'component',
              data: component
            });
          });
        }
      });
    }
    
    return items;
  }, [displayMode]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    return allItems.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [allItems, searchQuery]);

  const categories: ComponentCategory[] = [
    {
      id: 'navigation',
      name: 'Navigation Blocks',
      description: 'Pre-built navigation components',
      type: 'block',
      icon: <Layers className="h-4 w-4" />,
      blocks: navigationBlocks,
    },
    {
      id: 'hero',
      name: 'Hero Blocks',
      description: 'Eye-catching hero sections',
      type: 'block',
      icon: <Square className="h-4 w-4" />,
      blocks: heroBlocks,
    },
    {
      id: 'content-sections',
      name: 'Content Blocks',
      description: 'Various content section layouts',
      type: 'block',
      icon: <Type className="h-4 w-4" />,
      blocks: contentBlocks,
    },
    {
      id: 'footer',
      name: 'Footer Blocks',
      description: 'Pre-built footer components',
      type: 'block',
      icon: <Square className="h-4 w-4" />,
      blocks: footerBlocks,
    },
    {
      id: 'elements',
      name: 'Element Blocks',
      description: 'Individual UI elements',
      type: 'block',
      icon: <Circle className="h-4 w-4" />,
      blocks: elementBlocks,
    },
    {
      id: 'content-variants',
      name: 'Content Variant Blocks',
      description: 'Different content presentation styles',
      type: 'block',
      icon: <Type className="h-4 w-4" />,
      blocks: contentVariantBlocks,
    },
    {
      id: 'special',
      name: 'Special Blocks',
      description: 'Interactive and specialized components',
      type: 'block',
      icon: <Circle className="h-4 w-4" />,
      blocks: specialBlocks,
    },
    {
      id: 'ecommerce',
      name: 'E-commerce Blocks',
      description: 'Product and shopping components',
      type: 'block',
      icon: <ShoppingCart className="h-4 w-4" />,
      blocks: ecommerceBlocks,
    },
    {
      id: 'gallery',
      name: 'Gallery Blocks',
      description: 'Image and media展示 components',
      type: 'block',
      icon: <ImageIcon className="h-4 w-4" />,
      blocks: galleryBlocks,
    },
    {
      id: 'blog-rss',
      name: 'Blog & RSS Blocks',
      description: 'Content and news展示 components',
      type: 'block',
      icon: <Rss className="h-4 w-4" />,
      blocks: blogRssBlocks,
    },
    {
      id: 'social-sharing',
      name: 'Social Sharing Blocks',
      description: 'Social media integration components',
      type: 'block',
      icon: <Share2 className="h-4 w-4" />,
      blocks: socialSharingBlocks,
    }
  ];

  const componentCategories: ComponentCategory[] = [
    {
      id: 'layout',
      name: 'Page Layout Components',
      description: 'Structure and organize your page content',
      type: 'basic',
      icon: <Grid3X3 className="h-4 w-4" />,
      components: [
        {
          id: 'container',
          type: 'container',
          name: 'Container',
          description: 'Group components together with layout options',
          icon: 'C',
        },
        {
          id: 'grid',
          type: 'grid',
          name: 'Grid',
          description: 'Responsive grid layout for organizing content',
          icon: 'G',
        },
        {
          id: 'card',
          type: 'card',
          name: 'Card',
          description: 'Content card with consistent styling',
          icon: 'C',
        },
      ]
    },
    {
      id: 'content',
      name: 'Content Components',
      description: 'Text and interactive elements',
      type: 'basic',
      icon: <Type className="h-4 w-4" />,
      components: [
        {
          id: 'text',
          type: 'text',
          name: 'Text',
          description: 'Add headings, paragraphs, or other text content',
          icon: 'T',
        },
        {
          id: 'button',
          type: 'button',
          name: 'Button',
          description: 'Add a button for actions or navigation',
          icon: 'B',
        },
      ]
    },
    {
      id: 'media',
      name: 'Media Components',
      description: 'Images and multimedia elements',
      type: 'basic',
      icon: <ImageIcon className="h-4 w-4" />,
      components: [
        {
          id: 'image',
          type: 'image',
          name: 'Image',
          description: 'Add an image with optional caption',
          icon: 'I',
        },
      ]
    }
  ];

  // Filter categories based on display mode
  const filteredCategories = useMemo(() => {
    if (displayMode === 'components') {
      return []; // No block categories in components mode
    } else if (displayMode === 'blocks') {
      return categories; // Only block categories in blocks mode
    } else {
      return [...componentCategories, ...categories]; // All categories in all mode
    }
  }, [displayMode]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Component Library</CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Add components and blocks to your page
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {filteredItems && filteredItems.length > 0 ? (
            // Show search results
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Search Results</h3>
              {filteredItems.map((item: { type: string; id: string; data: any; name: string; description: string; category: string; }) => (
                <Button
                  key={`${item.type}-${item.id}`}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4 hover:bg-accent transition-colors"
                  onClick={() => {
                    if (item.type === 'block' && onBlockSelect) {
                      onBlockSelect(item.data);
                    } else if (item.type === 'component' && displayMode !== 'blocks') {
                      onComponentSelect(item.data.type);
                    }
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">{item.name}</div>
                    {/* Hidden search result description - can be restored later if needed */}
                    <div className="text-xs text-muted-foreground hidden">{item.description}</div>
                    {/* Hidden category info - can be restored later if needed */}
                    <div className="text-xs text-muted-foreground mt-1 hidden">Category: {item.category}</div>
                  </div>

                </Button>
              ))}
            </div>
          ) : filteredItems && filteredItems.length === 0 ? (
            // No search results
            <div className="text-center py-8 text-muted-foreground">
              <Search className="mx-auto h-8 w-8" />
              <p className="mt-2">No components or blocks found</p>
              {/* Hidden help text - can be restored later if needed */}
              <p className="text-xs mt-1 hidden">Try adjusting your search query</p>
            </div>
          ) : (
            // Show categories
            <div className="space-y-4">
              {filteredCategories.map((category: ComponentCategory) => (
                <div key={category.id} className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto hover:bg-transparent"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2 p-2">
                      {category.icon}
                      <div className="text-left">
                        <div className="font-medium">{category.name}</div>
                        {/* Hidden category description - can be restored later if needed */}
                        <div className="text-xs text-muted-foreground hidden">{category.description}</div>
                      </div>

                    </div>
                    {expandedCategories[category.id] ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                  </Button>
                  
                  {expandedCategories[category.id] && (
                    <div className="ml-6 space-y-2">
                      {category.blocks?.map((block: BlockItem) => (
                        <Button
                          key={block.id}
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4 hover:bg-accent transition-colors"
                          onClick={() => onBlockSelect && onBlockSelect(block)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{block.name}</div>
                            {/* Hidden block description - can be restored later if needed */}
                            <div className="text-xs text-muted-foreground hidden">{block.description}</div>
                          </div>

                        </Button>
                      ))}
                      {category.components?.map((component: ComponentItem) => (
                        <Button
                          key={component.id}
                          variant="outline"
                          className="w-full justify-start h-auto py-3 px-4 hover:bg-accent transition-colors"
                          onClick={() => onComponentSelect(component.type)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{component.name}</div>
                            {/* Hidden description - can be restored later if needed */}
                            <div className="text-xs text-muted-foreground hidden">{component.description}</div>
                          </div>

                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ComponentLibrary;
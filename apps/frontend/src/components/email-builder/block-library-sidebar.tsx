'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Search,
  Layout,
  Type,
  Image,
  Share2,
  ShoppingCart,
  Star,
  Code,
} from 'lucide-react';

const BLOCK_CATEGORIES = [
  {
    id: 'structure',
    label: 'Yapı',
    icon: Layout,
    blocks: [
      { id: 'one_column', label: '1 Sütun', icon: '▬' },
      { id: 'two_column', label: '2 Sütun', icon: '▬▬' },
      { id: 'three_column', label: '3 Sütun', icon: '▬▬▬' },
      { id: 'spacer', label: 'Boşluk', icon: '⎯' },
      { id: 'divider', label: 'Ayırıcı', icon: '━' },
    ],
  },
  {
    id: 'content',
    label: 'İçerik',
    icon: Type,
    blocks: [
      { id: 'heading', label: 'Başlık', icon: 'H1' },
      { id: 'text', label: 'Metin', icon: 'T' },
      { id: 'button', label: 'Buton', icon: '🔘' },
      { id: 'list', label: 'Liste', icon: '•' },
      { id: 'quote', label: 'Alıntı', icon: '❝' },
    ],
  },
  {
    id: 'media',
    label: 'Medya',
    icon: Image,
    blocks: [
      { id: 'image', label: 'Resim', icon: '🖼️' },
      { id: 'image_text', label: 'Resim+Metin', icon: '🖼️T' },
      { id: 'video', label: 'Video', icon: '▶️' },
      { id: 'icon', label: 'İkon', icon: '⭐' },
    ],
  },
  {
    id: 'social',
    label: 'Sosyal',
    icon: Share2,
    blocks: [
      { id: 'social_links', label: 'Sosyal Linkler', icon: '📱' },
      { id: 'social_share', label: 'Paylaş', icon: '↗️' },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-Ticaret',
    icon: ShoppingCart,
    blocks: [
      { id: 'product', label: 'Ürün Kartı', icon: '🛒' },
      { id: 'product_grid', label: 'Ürün Grid', icon: '⊞' },
      { id: 'pricing_table', label: 'Fiyat Tablosu', icon: '💰' },
      { id: 'coupon', label: 'Kupon', icon: '🎫' },
    ],
  },
  {
    id: 'interactive',
    label: 'Etkileşimli',
    icon: Star,
    blocks: [
      { id: 'countdown', label: 'Geri Sayım', icon: '⏱️' },
      { id: 'rating', label: 'Yıldız Puanı', icon: '⭐' },
      { id: 'progress_bar', label: 'İlerleme', icon: '▰' },
    ],
  },
  {
    id: 'special',
    label: 'Özel',
    icon: Code,
    blocks: [
      { id: 'header', label: 'Başlık Bölümü', icon: '▭' },
      { id: 'footer', label: 'Altbilgi', icon: '▁' },
      { id: 'html_code', label: 'HTML Kodu', icon: '<>' },
      { id: 'logo', label: 'Logo', icon: '🏢' },
    ],
  },
];

export function BlockLibrarySidebar({ onBlockSelect }: { onBlockSelect: (block: any) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredCategories = BLOCK_CATEGORIES.map((category) => ({
    ...category,
    blocks: category.blocks.filter((block) =>
      block.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.blocks.length > 0);

  return (
    <div className="w-80 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Blok Kütüphanesi</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Blok ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full justify-start px-4 py-2 h-auto flex-wrap gap-1">
            <TabsTrigger value="all" className="text-xs">Tümü</TabsTrigger>
            {BLOCK_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {category.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="p-4 space-y-6">
            {activeCategory === 'all' ? (
              filteredCategories.map((category) => (
                <div key={category.id}>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    {category.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {category.blocks.map((block) => (
                      <Card
                        key={block.id}
                        className="p-3 cursor-move hover:bg-accent transition-colors"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: block.id,
                            category: category.id,
                          }));
                        }}
                        onClick={() => onBlockSelect({ ...block, category: category.id })}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{block.icon}</div>
                          <p className="text-xs font-medium">{block.label}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <TabsContent value={activeCategory} className="m-0">
                {filteredCategories
                  .filter((cat) => cat.id === activeCategory)
                  .map((category) => (
                    <div key={category.id} className="grid grid-cols-2 gap-2">
                      {category.blocks.map((block) => (
                        <Card
                          key={block.id}
                          className="p-3 cursor-move hover:bg-accent transition-colors"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify({
                              type: block.id,
                              category: category.id,
                            }));
                          }}
                          onClick={() => onBlockSelect({ ...block, category: category.id })}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">{block.icon}</div>
                            <p className="text-xs font-medium">{block.label}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ))}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </ScrollArea>
    </div>
  );
}

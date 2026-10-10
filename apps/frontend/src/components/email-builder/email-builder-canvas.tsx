'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Block {
  id: string;
  type: string;
  properties: Record<string, any>;
  styles: Record<string, any>;
}

interface Column {
  id: string;
  width: string;
  blocks: Block[];
}

interface Row {
  id: string;
  type: string;
  columns: Column[];
  settings: Record<string, any>;
}

interface EmailStructure {
  rows: Row[];
  settings: {
    backgroundColor?: string;
    contentWidth?: string;
    fonts?: string[];
  };
}

export function EmailBuilderCanvas({
  structure,
  onStructureChange,
  selectedBlock,
  onBlockSelect,
  previewMode,
}: {
  structure: EmailStructure;
  onStructureChange: (structure: EmailStructure) => void;
  selectedBlock: any;
  onBlockSelect: (block: any) => void;
  previewMode: 'desktop' | 'mobile';
}) {
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleDrop = (e: React.DragEvent, rowIndex?: number) => {
    e.preventDefault();
    setDragOverRowIndex(null);

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const blockData = JSON.parse(data);

    // Create new row with block
    const newRow: Row = {
      id: generateId(),
      type: 'section',
      columns: [
        {
          id: generateId(),
          width: '100%',
          blocks: [
            {
              id: generateId(),
              type: blockData.type,
              properties: getDefaultProperties(blockData.type),
              styles: getDefaultStyles(blockData.type),
            },
          ],
        },
      ],
      settings: {},
    };

    const newRows = [...structure.rows];
    if (rowIndex !== undefined) {
      newRows.splice(rowIndex + 1, 0, newRow);
    } else {
      newRows.push(newRow);
    }

    onStructureChange({
      ...structure,
      rows: newRows,
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newRows = structure.rows.filter((_, i) => i !== rowIndex);
    onStructureChange({
      ...structure,
      rows: newRows,
    });
  };

  const handleDuplicateRow = (rowIndex: number) => {
    const rowToDuplicate = structure.rows[rowIndex];
    const duplicatedRow = JSON.parse(JSON.stringify(rowToDuplicate));
    duplicatedRow.id = generateId();
    duplicatedRow.columns = duplicatedRow.columns.map((col: Column) => ({
      ...col,
      id: generateId(),
      blocks: col.blocks.map((block: Block) => ({
        ...block,
        id: generateId(),
      })),
    }));

    const newRows = [...structure.rows];
    newRows.splice(rowIndex + 1, 0, duplicatedRow);
    onStructureChange({
      ...structure,
      rows: newRows,
    });
  };

  const canvasWidth = previewMode === 'mobile' ? '375px' : structure.settings.contentWidth || '600px';

  return (
    <div className="w-full h-full p-8 flex justify-center">
      <div
        className="transition-all duration-300"
        style={{ width: canvasWidth, maxWidth: '100%' }}
      >
        <Card className="bg-white shadow-lg">
          {/* Email Container */}
          <div
            style={{ backgroundColor: structure.settings.backgroundColor || '#f5f5f5' }}
            onDrop={(e) => handleDrop(e)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverRowIndex(null);
            }}
            className="min-h-[600px] p-4"
          >
            {structure.rows.length === 0 ? (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Email şablonunuzu oluşturmaya başlayın
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sol taraftaki blok kütüphanesinden bir blok sürükleyin
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {structure.rows.map((row, rowIndex) => (
                  <div key={row.id}>
                    {/* Drop Zone Before Row */}
                    <div
                      className={cn(
                        'h-8 flex items-center justify-center transition-all',
                        dragOverRowIndex === rowIndex && 'bg-primary/20 border-2 border-primary border-dashed'
                      )}
                      onDrop={(e) => handleDrop(e, rowIndex - 1)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverRowIndex(rowIndex);
                      }}
                      onDragLeave={() => setDragOverRowIndex(null)}
                    >
                      {dragOverRowIndex === rowIndex && (
                        <Plus className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    {/* Row */}
                    <Card className="group relative hover:ring-2 hover:ring-primary/50 transition-all">
                      {/* Row Controls */}
                      <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 cursor-move"
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleDuplicateRow(rowIndex)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => handleDeleteRow(rowIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Row Content */}
                      <div className="p-4">
                        {row.columns.map((column) => (
                          <div key={column.id} style={{ width: column.width }}>
                            {column.blocks.map((block) => (
                              <div
                                key={block.id}
                                className={cn(
                                  'p-2 rounded cursor-pointer transition-all',
                                  selectedBlock?.id === block.id && 'ring-2 ring-primary'
                                )}
                                onClick={() => onBlockSelect(block)}
                              >
                                <BlockRenderer block={block} />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                ))}

                {/* Drop Zone After Last Row */}
                <div
                  className="h-16 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded hover:bg-accent/50 transition-colors"
                  onDrop={(e) => handleDrop(e)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return (
        <h1
          style={{
            fontSize: block.styles.fontSize || '24px',
            fontWeight: block.styles.fontWeight || 'bold',
            color: block.styles.color || '#333333',
            textAlign: block.properties.align || 'left',
          }}
        >
          {block.properties.text || 'Başlık Metni'}
        </h1>
      );

    case 'text':
      return (
        <p
          style={{
            fontSize: block.styles.fontSize || '14px',
            color: block.styles.color || '#333333',
            textAlign: block.properties.align || 'left',
            lineHeight: block.styles.lineHeight || '1.6',
          }}
        >
          {block.properties.text || 'Paragraf metni buraya yazılacak'}
        </p>
      );

    case 'button':
      return (
        <div style={{ textAlign: block.properties.align || 'center' }}>
          <a
            href={block.properties.href || '#'}
            style={{
              display: 'inline-block',
              backgroundColor: block.styles.backgroundColor || '#0066cc',
              color: block.styles.color || '#ffffff',
              padding: block.styles.padding || '12px 24px',
              borderRadius: block.styles.borderRadius || '4px',
              fontSize: block.styles.fontSize || '14px',
              fontWeight: block.styles.fontWeight || 'bold',
              textDecoration: 'none',
            }}
          >
            {block.properties.text || 'Tıklayın'}
          </a>
        </div>
      );

    case 'image':
      return (
        <div style={{ textAlign: block.properties.align || 'center' }}>
          <img
            src={block.properties.src || 'https://via.placeholder.com/600x400'}
            alt={block.properties.alt || 'Resim'}
            style={{
              width: block.styles.width || '100%',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      );

    case 'divider':
      return (
        <hr
          style={{
            borderColor: block.styles.borderColor || '#dddddd',
            borderWidth: block.styles.borderWidth || '1px',
            borderStyle: 'solid',
            margin: '10px 0',
          }}
        />
      );

    case 'spacer':
      return <div style={{ height: block.styles.height || '20px' }} />;

    // NEW BLOCKS: Interactive
    case 'countdown':
      return (
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded text-center">
          <div className="text-sm font-semibold text-orange-700 mb-2">
            {block.properties.title || '⏱️ Geri Sayım'}
          </div>
          <div className="flex justify-center gap-4">
            {['7', '12', '35', '42'].map((num, i) => (
              <div key={i} className="bg-white rounded p-2 min-w-[50px]">
                <div className="text-2xl font-bold text-orange-600">{num}</div>
                <div className="text-xs text-gray-500">
                  {['Gün', 'Saat', 'Dak', 'San'][i]}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            {block.properties.endDate || 'Bitiş tarihi: Ayarlanmadı'}
          </div>
        </div>
      );

    case 'rating':
      return (
        <div className="p-4 text-center">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-2xl text-yellow-400">★</span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {block.properties.label || '5/5 Müşteri Memnuniyeti'}
          </p>
        </div>
      );

    case 'progress_bar':
      return (
        <div className="p-4">
          <div className="mb-2 text-sm text-gray-700">
            {block.properties.label || 'İlerleme'}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${block.properties.percentage || 70}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-600 text-right">
            {block.properties.percentage || 70}%
          </div>
        </div>
      );

    // NEW BLOCKS: Columns
    case 'one_column':
    case 'two_column':
    case 'three_column':
      const colCount = block.type === 'one_column' ? 1 : block.type === 'two_column' ? 2 : 3;
      return (
        <div className={`grid grid-cols-${colCount} gap-4 p-4 border-2 border-dashed border-gray-300 rounded`}>
          {Array.from({ length: colCount }).map((_, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded text-center text-sm text-gray-500">
              Sütun {i + 1}
            </div>
          ))}
        </div>
      );

    // NEW BLOCKS: Content
    case 'list':
      const items = block.properties.items || ['Liste öğesi 1', 'Liste öğesi 2', 'Liste öğesi 3'];
      return (
        <ul className="list-disc list-inside space-y-1" style={{ color: block.styles.color || '#333' }}>
          {items.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
          "{block.properties.text || 'Alıntı metni buraya gelecek'}"
          <footer className="text-sm text-gray-500 mt-2">
            — {block.properties.author || 'Yazar'}
          </footer>
        </blockquote>
      );

    // NEW BLOCKS: Media
    case 'image_text':
      return (
        <div className="grid grid-cols-2 gap-4">
          <img
            src={block.properties.src || 'https://via.placeholder.com/300x200'}
            alt={block.properties.alt || 'Resim'}
            className="w-full rounded"
          />
          <div>
            <h3 className="font-semibold mb-2">{block.properties.title || 'Başlık'}</h3>
            <p className="text-sm text-gray-600">{block.properties.text || 'Açıklama metni...'}</p>
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="p-4 bg-black rounded text-center">
          <div className="text-white text-4xl mb-2">▶</div>
          <div className="text-white text-sm">{block.properties.title || 'Video Oynatıcı'}</div>
        </div>
      );

    case 'icon':
      return (
        <div className="text-center p-4">
          <div className="text-4xl mb-2">{block.properties.icon || '⭐'}</div>
          <p className="text-sm">{block.properties.label || 'İkon'}</p>
        </div>
      );

    // NEW BLOCKS: Social
    case 'social_links':
      const socials = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn'];
      return (
        <div className="flex justify-center gap-3 p-4">
          {socials.map((social) => (
            <a
              key={social}
              href="#"
              className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold"
            >
              {social[0]}
            </a>
          ))}
        </div>
      );

    case 'social_share':
      return (
        <div className="p-4 bg-gray-50 rounded text-center">
          <p className="text-sm mb-3">Bu içeriği paylaş:</p>
          <div className="flex justify-center gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Paylaş</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded text-sm">WhatsApp</button>
          </div>
        </div>
      );

    // NEW BLOCKS: E-commerce
    case 'product':
      return (
        <div className="border rounded p-4">
          <img
            src={block.properties.image || 'https://via.placeholder.com/200'}
            alt={block.properties.name || 'Ürün'}
            className="w-full rounded mb-3"
          />
          <h4 className="font-semibold">{block.properties.name || 'Ürün Adı'}</h4>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {block.properties.price || '₺99.99'}
          </p>
          <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded">
            Sepete Ekle
          </button>
        </div>
      );

    case 'product_grid':
      return (
        <div className="grid grid-cols-2 gap-4 p-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded p-3">
              <div className="w-full h-24 bg-gray-200 rounded mb-2"></div>
              <div className="text-sm font-semibold">Ürün {i}</div>
              <div className="text-blue-600 font-bold">₺99</div>
            </div>
          ))}
        </div>
      );

    case 'pricing_table':
      return (
        <div className="border rounded p-4 text-center">
          <h3 className="text-xl font-bold mb-2">{block.properties.planName || 'Premium'}</h3>
          <div className="text-3xl font-bold text-blue-600 mb-4">
            {block.properties.price || '₺199'}
            <span className="text-sm text-gray-500">/ay</span>
          </div>
          <ul className="text-sm space-y-2 mb-4">
            <li>✓ Özellik 1</li>
            <li>✓ Özellik 2</li>
            <li>✓ Özellik 3</li>
          </ul>
          <button className="w-full bg-blue-600 text-white py-2 rounded font-semibold">
            Satın Al
          </button>
        </div>
      );

    case 'coupon':
      return (
        <div className="border-2 border-dashed border-orange-400 rounded p-4 text-center bg-orange-50">
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {block.properties.code || 'INDIRIM50'}
          </div>
          <p className="text-sm text-gray-700">{block.properties.description || '%50 İndirim Kodu'}</p>
        </div>
      );

    // NEW BLOCKS: Special
    case 'header':
      return (
        <div className="bg-blue-600 text-white p-6 rounded-t">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xl">{block.properties.logo || '🏢 Logo'}</div>
            <nav className="flex gap-4 text-sm">
              <a href="#">Anasayfa</a>
              <a href="#">Ürünler</a>
              <a href="#">İletişim</a>
            </nav>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="bg-gray-800 text-white p-6 rounded-b text-center text-sm">
          <p className="mb-2">{block.properties.text || '© 2025 Şirket Adı. Tüm hakları saklıdır.'}</p>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <a href="#">Gizlilik</a>
            <a href="#">Koşullar</a>
            <a href="#">İletişim</a>
          </div>
        </div>
      );

    case 'logo':
      return (
        <div className="text-center p-4">
          <div className="text-4xl mb-2">{block.properties.logo || '🏢'}</div>
          <div className="font-semibold">{block.properties.companyName || 'Şirket Adı'}</div>
        </div>
      );

    case 'html_code':
      return (
        <div className="p-4 bg-gray-100 rounded font-mono text-xs text-gray-700">
          &lt;!-- Özel HTML kodu buraya --&gt;
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-center">
          <div className="text-gray-500 text-sm mb-1">📦 {block.type}</div>
          <div className="text-xs text-gray-400">Blok henüz render edilmiyor</div>
        </div>
      );
  }
}

function getDefaultProperties(blockType: string): Record<string, any> {
  const defaults: Record<string, any> = {
    heading: { text: 'Başlık Metni', level: 'h1', align: 'left' },
    text: { text: 'Paragraf metni buraya yazılacak', align: 'left' },
    button: { text: 'Tıklayın', href: '#', align: 'center' },
    image: { src: 'https://via.placeholder.com/600x400', alt: 'Resim', align: 'center' },
    divider: {},
    spacer: { height: '20px' },
  };
  return defaults[blockType] || {};
}

function getDefaultStyles(blockType: string): Record<string, any> {
  const defaults: Record<string, any> = {
    heading: { fontSize: '24px', fontWeight: 'bold', color: '#333333' },
    text: { fontSize: '14px', color: '#333333', lineHeight: '1.6' },
    button: { backgroundColor: '#0066cc', color: '#ffffff', borderRadius: '4px', padding: '12px 24px' },
    image: { width: '100%' },
    divider: { borderColor: '#dddddd', borderWidth: '1px' },
    spacer: { height: '20px' },
  };
  return defaults[blockType] || {};
}

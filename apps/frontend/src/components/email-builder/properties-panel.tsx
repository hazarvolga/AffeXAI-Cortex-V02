'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PropertiesPanel({
  block,
  onBlockUpdate,
  onClose,
}: {
  block: any;
  onBlockUpdate: (block: any) => void;
  onClose?: () => void;
}) {
  const [properties, setProperties] = useState(block.properties || {});
  const [styles, setStyles] = useState(block.styles || {});

  useEffect(() => {
    setProperties(block.properties || {});
    setStyles(block.styles || {});
  }, [block]);

  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
    onBlockUpdate({ ...block, properties: newProperties });
  };

  const handleStyleChange = (key: string, value: any) => {
    const newStyles = { ...styles, [key]: value };
    setStyles(newStyles);
    onBlockUpdate({ ...block, styles: newStyles });
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Özellikler</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="properties">
            <TabsList className="w-full">
              <TabsTrigger value="properties" className="flex-1">İçerik</TabsTrigger>
              <TabsTrigger value="styles" className="flex-1">Stil</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-4 mt-4">
              {renderPropertiesForm(block.type, properties, handlePropertyChange)}
            </TabsContent>

            <TabsContent value="styles" className="space-y-4 mt-4">
              {renderStylesForm(block.type, styles, handleStyleChange)}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

function renderPropertiesForm(
  blockType: string,
  properties: Record<string, any>,
  onChange: (key: string, value: any) => void
) {
  switch (blockType) {
    case 'heading':
      return (
        <>
          <div>
            <Label htmlFor="text">Başlık Metni</Label>
            <Input
              id="text"
              value={properties.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Başlığınızı girin"
            />
          </div>
          <div>
            <Label htmlFor="level">Seviye</Label>
            <Select value={properties.level || 'h1'} onValueChange={(v) => onChange('level', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1 (En Büyük)</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
                <SelectItem value="h4">H4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="align">Hizalama</Label>
            <Select value={properties.align || 'left'} onValueChange={(v) => onChange('align', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Sol</SelectItem>
                <SelectItem value="center">Orta</SelectItem>
                <SelectItem value="right">Sağ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'text':
      return (
        <>
          <div>
            <Label htmlFor="text">Metin</Label>
            <textarea
              id="text"
              value={properties.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Paragraf metnini girin"
              className="w-full min-h-[100px] p-2 border rounded-md"
            />
          </div>
          <div>
            <Label htmlFor="align">Hizalama</Label>
            <Select value={properties.align || 'left'} onValueChange={(v) => onChange('align', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Sol</SelectItem>
                <SelectItem value="center">Orta</SelectItem>
                <SelectItem value="right">Sağ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'button':
      return (
        <>
          <div>
            <Label htmlFor="text">Buton Metni</Label>
            <Input
              id="text"
              value={properties.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              placeholder="Tıklayın"
            />
          </div>
          <div>
            <Label htmlFor="href">Link (URL)</Label>
            <Input
              id="href"
              value={properties.href || ''}
              onChange={(e) => onChange('href', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="align">Hizalama</Label>
            <Select value={properties.align || 'center'} onValueChange={(v) => onChange('align', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Sol</SelectItem>
                <SelectItem value="center">Orta</SelectItem>
                <SelectItem value="right">Sağ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'image':
      return (
        <>
          <div>
            <Label htmlFor="src">Resim URL'si</Label>
            <Input
              id="src"
              value={properties.src || ''}
              onChange={(e) => onChange('src', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="alt">Alt Metin</Label>
            <Input
              id="alt"
              value={properties.alt || ''}
              onChange={(e) => onChange('alt', e.target.value)}
              placeholder="Resim açıklaması"
            />
          </div>
          <div>
            <Label htmlFor="href">Link (İsteğe Bağlı)</Label>
            <Input
              id="href"
              value={properties.href || ''}
              onChange={(e) => onChange('href', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label htmlFor="align">Hizalama</Label>
            <Select value={properties.align || 'center'} onValueChange={(v) => onChange('align', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Sol</SelectItem>
                <SelectItem value="center">Orta</SelectItem>
                <SelectItem value="right">Sağ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'spacer':
      return (
        <div>
          <Label htmlFor="height">Yükseklik</Label>
          <Input
            id="height"
            value={properties.height || '20px'}
            onChange={(e) => onChange('height', e.target.value)}
            placeholder="20px"
          />
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Bu blok için özellikler mevcut değil
        </div>
      );
  }
}

function renderStylesForm(
  blockType: string,
  styles: Record<string, any>,
  onChange: (key: string, value: any) => void
) {
  const commonStyles = (
    <>
      <div>
        <Label htmlFor="fontSize">Yazı Boyutu</Label>
        <Input
          id="fontSize"
          value={styles.fontSize || '14px'}
          onChange={(e) => onChange('fontSize', e.target.value)}
          placeholder="14px"
        />
      </div>
      <div>
        <Label htmlFor="color">Renk</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            type="color"
            value={styles.color || '#333333'}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-16 h-10"
          />
          <Input
            value={styles.color || '#333333'}
            onChange={(e) => onChange('color', e.target.value)}
            placeholder="#333333"
            className="flex-1"
          />
        </div>
      </div>
    </>
  );

  switch (blockType) {
    case 'heading':
    case 'text':
      return (
        <>
          {commonStyles}
          <div>
            <Label htmlFor="fontWeight">Kalınlık</Label>
            <Select value={styles.fontWeight || 'normal'} onValueChange={(v) => onChange('fontWeight', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Kalın</SelectItem>
                <SelectItem value="600">Semi Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {blockType === 'text' && (
            <div>
              <Label htmlFor="lineHeight">Satır Yüksekliği</Label>
              <Input
                id="lineHeight"
                value={styles.lineHeight || '1.6'}
                onChange={(e) => onChange('lineHeight', e.target.value)}
                placeholder="1.6"
              />
            </div>
          )}
        </>
      );

    case 'button':
      return (
        <>
          <div>
            <Label htmlFor="backgroundColor">Arkaplan Rengi</Label>
            <div className="flex gap-2">
              <Input
                id="backgroundColor"
                type="color"
                value={styles.backgroundColor || '#0066cc'}
                onChange={(e) => onChange('backgroundColor', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={styles.backgroundColor || '#0066cc'}
                onChange={(e) => onChange('backgroundColor', e.target.value)}
                placeholder="#0066cc"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="color">Metin Rengi</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={styles.color || '#ffffff'}
                onChange={(e) => onChange('color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={styles.color || '#ffffff'}
                onChange={(e) => onChange('color', e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="borderRadius">Köşe Yuvarlama</Label>
            <Input
              id="borderRadius"
              value={styles.borderRadius || '4px'}
              onChange={(e) => onChange('borderRadius', e.target.value)}
              placeholder="4px"
            />
          </div>
          <div>
            <Label htmlFor="padding">İç Boşluk</Label>
            <Input
              id="padding"
              value={styles.padding || '12px 24px'}
              onChange={(e) => onChange('padding', e.target.value)}
              placeholder="12px 24px"
            />
          </div>
        </>
      );

    case 'image':
      return (
        <div>
          <Label htmlFor="width">Genişlik</Label>
          <Input
            id="width"
            value={styles.width || '100%'}
            onChange={(e) => onChange('width', e.target.value)}
            placeholder="100% veya 600px"
          />
        </div>
      );

    case 'divider':
      return (
        <>
          <div>
            <Label htmlFor="borderColor">Çizgi Rengi</Label>
            <div className="flex gap-2">
              <Input
                id="borderColor"
                type="color"
                value={styles.borderColor || '#dddddd'}
                onChange={(e) => onChange('borderColor', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={styles.borderColor || '#dddddd'}
                onChange={(e) => onChange('borderColor', e.target.value)}
                placeholder="#dddddd"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="borderWidth">Çizgi Kalınlığı</Label>
            <Input
              id="borderWidth"
              value={styles.borderWidth || '1px'}
              onChange={(e) => onChange('borderWidth', e.target.value)}
              placeholder="1px"
            />
          </div>
        </>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          Bu blok için stil seçenekleri mevcut değil
        </div>
      );
  }
}

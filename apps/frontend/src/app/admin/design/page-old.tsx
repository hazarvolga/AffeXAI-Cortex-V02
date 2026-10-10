'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Palette, Paintbrush, Layers, Sparkles, Save, RotateCcw, Eye, Sun, Moon } from "lucide-react";

// Color variable type
interface ColorVariable {
  name: string;
  label: string;
  lightValue: string;
  darkValue: string;
  description: string;
}

export default function DesignManagementPage() {
  const [activeTab, setActiveTab] = useState('public');
  const [hasChanges, setHasChanges] = useState(false);
  const [editingMode, setEditingMode] = useState<'light' | 'dark'>('light'); // Hangi modu düzenliyoruz

  // Design tokens (border radius, spacing, typography)
  const [designTokens, setDesignTokens] = useState({
    radius: '0.5rem',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    }
  });

  // Component variants
  const [componentVariants, setComponentVariants] = useState({
    button: {
      defaultVariant: 'default',
      defaultSize: 'default',
      animation: true,
    },
    card: {
      defaultVariant: 'default',
      shadow: 'sm',
      border: true,
    },
    badge: {
      defaultVariant: 'default',
      size: 'default',
    },
    input: {
      variant: 'default',
      focusRing: true,
    }
  });

  // Public theme colors - başlangıç değerleri globals.css'den
  const [publicColors, setPublicColors] = useState<ColorVariable[]>([
    {
      name: '--background',
      label: 'Background',
      lightValue: '0 0% 98%',
      darkValue: '225 6% 9%',
      description: 'Ana arka plan rengi'
    },
    {
      name: '--foreground',
      label: 'Foreground',
      lightValue: '220 13% 9%',
      darkValue: '216 14% 90%',
      description: 'Ana metin rengi'
    },
    {
      name: '--primary',
      label: 'Primary',
      lightValue: '39 100% 54%',
      darkValue: '39 100% 54%',
      description: 'Ana marka rengi (turuncu)'
    },
    {
      name: '--secondary',
      label: 'Secondary',
      lightValue: '210 20% 94%',
      darkValue: '228 5% 13%',
      description: 'İkincil arka plan rengi'
    },
    {
      name: '--accent',
      label: 'Accent',
      lightValue: '39 100% 54%',
      darkValue: '39 100% 54%',
      description: 'Vurgu rengi'
    },
    {
      name: '--muted',
      label: 'Muted',
      lightValue: '0 0% 94%',
      darkValue: '228 6% 10%',
      description: 'Soluk arka plan rengi'
    },
  ]);

  const handleColorChange = (index: number, value: string) => {
    const updated = [...publicColors];
    if (editingMode === 'light') {
      updated[index].lightValue = value;
    } else {
      updated[index].darkValue = value;
    }
    setPublicColors(updated);
    setHasChanges(true);
  };

  // HSL to HEX conversion for color picker
  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
      const hDecimal = h / 360;
      const sDecimal = s / 100;
      const lDecimal = l / 100;

      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
      const p = 2 * lDecimal - q;
      
      const r = Math.round(hue2rgb(p, q, hDecimal + 1/3) * 255);
      const g = Math.round(hue2rgb(p, q, hDecimal) * 255);
      const b = Math.round(hue2rgb(p, q, hDecimal - 1/3) * 255);

      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    } catch {
      return '#000000';
    }
  };

  // HEX to HSL conversion
  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return '0 0% 0%';
    }
  };

  const handleColorPickerChange = (index: number, hexColor: string) => {
    const hslValue = hexToHsl(hexColor);
    handleColorChange(index, hslValue);
  };

  const handleSave = async () => {
    // TODO: API call to save theme configuration
    console.log('Saving theme configuration...', publicColors);
    setHasChanges(false);
    // Show success notification
  };

  const handleReset = () => {
    // TODO: Reset to default values
    console.log('Resetting to defaults...');
    setHasChanges(false);
  };

  const handlePreview = () => {
    // TODO: Open preview in new window
    console.log('Opening preview...');
  };
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Design Management</h1>
            <p className="text-muted-foreground">
              Proje genelinde tema, renk paleti ve tasarım sistemini yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for Layout Selection */}
      <Tabs defaultValue="public" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="public" className="gap-2">
            <Layers className="h-4 w-4" />
            Public
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Paintbrush className="h-4 w-4" />
            Admin
          </TabsTrigger>
          <TabsTrigger value="portal" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Portal
          </TabsTrigger>
        </TabsList>

        {/* Public Tab Content */}
        <TabsContent value="public" className="space-y-6">
          {/* Theme Mode Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Public Frontend Tema Sistemi
              </CardTitle>
              <CardDescription>
                Düzenlemek istediğiniz tema modunu seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={editingMode} 
                onValueChange={(value) => setEditingMode(value as 'light' | 'dark')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="light" id="light" className="peer sr-only" />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium leading-none">Light Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Açık tema renklerini düzenle
                      </p>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium leading-none">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Koyu tema renklerini düzenle
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Renk Paleti Yönetimi</h2>
            <p className="text-sm text-muted-foreground">
              {editingMode === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'} renklerini düzenliyorsunuz
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Önizle
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Sıfırla
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        </div>

        {/* Color Variables Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              CSS Değişkenleri
            </CardTitle>
            <CardDescription>
              HSL formatında renk değerlerini düzenleyin (örn: 39 100% 54%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicColors.map((color, index) => {
                const currentValue = editingMode === 'light' ? color.lightValue : color.darkValue;
                
                return (
                  <div key={color.name} className="space-y-3 rounded-lg border p-4">
                    {/* Color preview with picker - üstte büyük */}
                    <div className="relative group">
                      <div 
                        className="h-20 w-full rounded-lg border-2 shadow-sm cursor-pointer transition-all hover:shadow-md" 
                        style={{ backgroundColor: `hsl(${currentValue})` }}
                        title={editingMode === 'light' ? 'Light mode preview' : 'Dark mode preview'}
                      />
                      {/* Color picker overlay */}
                      <input
                        type="color"
                        value={hslToHex(currentValue)}
                        onChange={(e) => handleColorPickerChange(index, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Renk seçici"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                          🎨 Renk Seç
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-semibold">{color.label}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{color.description}</p>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Input
                          id={`${color.name}-${editingMode}`}
                          value={currentValue}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          placeholder="39 100% 54%"
                          className="font-mono text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Additional Feature Cards - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5" />
              Tema Konfigürasyonu
            </CardTitle>
            <CardDescription>
              Border radius, typography ve spacing ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Border Radius */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">Border Radius</Label>
                    <p className="text-xs text-muted-foreground">Component köşe yuvarlama</p>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{designTokens.radius}</code>
                </div>
                <div className="flex gap-2">
                  {['0rem', '0.25rem', '0.5rem', '0.75rem', '1rem'].map((value) => (
                    <Button
                      key={value}
                      variant={designTokens.radius === value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setDesignTokens({ ...designTokens, radius: value });
                        setHasChanges(true);
                      }}
                    >
                      <div 
                        className="h-4 w-4 bg-primary"
                        style={{ borderRadius: value }}
                      />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Typography Scale */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Typography Scale</Label>
                  <p className="text-xs text-muted-foreground">Font boyutları</p>
                </div>
                <div className="grid gap-2">
                  {Object.entries(designTokens.fontSize).map(([size, value]) => (
                    <div key={size} className="flex items-center gap-3">
                      <Label className="text-xs w-12 capitalize">{size}</Label>
                      <Input
                        value={value}
                        onChange={(e) => {
                          setDesignTokens({
                            ...designTokens,
                            fontSize: { ...designTokens.fontSize, [size]: e.target.value }
                          });
                          setHasChanges(true);
                        }}
                        className="font-mono text-xs h-8"
                        placeholder="1rem"
                      />
                      <span 
                        className="text-muted-foreground"
                        style={{ fontSize: value }}
                      >
                        Aa
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacing System */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Spacing System</Label>
                  <p className="text-xs text-muted-foreground">Boşluk değerleri</p>
                </div>
                <div className="grid gap-2">
                  {Object.entries(designTokens.spacing).map(([size, value]) => (
                    <div key={size} className="flex items-center gap-3">
                      <Label className="text-xs w-12 capitalize">{size}</Label>
                      <Input
                        value={value}
                        onChange={(e) => {
                          setDesignTokens({
                            ...designTokens,
                            spacing: { ...designTokens.spacing, [size]: e.target.value }
                          });
                          setHasChanges(true);
                        }}
                        className="font-mono text-xs h-8"
                        placeholder="1rem"
                      />
                      <div 
                        className="bg-primary rounded"
                        style={{ width: value, height: '1rem' }}
                        title={value}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Component Varyantları
            </CardTitle>
            <CardDescription>
              Component varsayılan stilleri ve özellikleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Button Component */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Button</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Varsayılan Variant</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['default', 'outline', 'ghost', 'link'].map((variant) => (
                      <Button
                        key={variant}
                        variant={componentVariants.button.defaultVariant === variant ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => {
                          setComponentVariants({
                            ...componentVariants,
                            button: { ...componentVariants.button, defaultVariant: variant }
                          });
                          setHasChanges(true);
                        }}
                      >
                        {variant}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Varsayılan Boyut</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['sm', 'default', 'lg', 'icon'].map((size) => (
                      <Button
                        key={size}
                        variant={componentVariants.button.defaultSize === size ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => {
                          setComponentVariants({
                            ...componentVariants,
                            button: { ...componentVariants.button, defaultSize: size }
                          });
                          setHasChanges(true);
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Animasyon</Label>
                  <Button
                    variant={componentVariants.button.animation ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setComponentVariants({
                        ...componentVariants,
                        button: { ...componentVariants.button, animation: !componentVariants.button.animation }
                      });
                      setHasChanges(true);
                    }}
                  >
                    {componentVariants.button.animation ? 'Açık' : 'Kapalı'}
                  </Button>
                </div>
              </div>

              {/* Card Component */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Card</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Shadow</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['none', 'sm', 'md', 'lg'].map((shadow) => (
                      <Button
                        key={shadow}
                        variant={componentVariants.card.shadow === shadow ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => {
                          setComponentVariants({
                            ...componentVariants,
                            card: { ...componentVariants.card, shadow: shadow }
                          });
                          setHasChanges(true);
                        }}
                      >
                        {shadow}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Border</Label>
                  <Button
                    variant={componentVariants.card.border ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setComponentVariants({
                        ...componentVariants,
                        card: { ...componentVariants.card, border: !componentVariants.card.border }
                      });
                      setHasChanges(true);
                    }}
                  >
                    {componentVariants.card.border ? 'Var' : 'Yok'}
                  </Button>
                </div>

                {/* Card Preview */}
                <div 
                  className="rounded-lg bg-card p-3 text-center text-xs"
                  style={{
                    border: componentVariants.card.border ? '1px solid hsl(var(--border))' : 'none',
                    boxShadow: componentVariants.card.shadow === 'none' ? 'none' :
                               componentVariants.card.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                               componentVariants.card.shadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                               '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                >
                  Önizleme
                </div>
              </div>

              {/* Badge Component */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Badge</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Varsayılan Variant</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['default', 'secondary', 'outline', 'destructive'].map((variant) => (
                      <Button
                        key={variant}
                        variant={componentVariants.badge.defaultVariant === variant ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => {
                          setComponentVariants({
                            ...componentVariants,
                            badge: { ...componentVariants.badge, defaultVariant: variant }
                          });
                          setHasChanges(true);
                        }}
                      >
                        {variant}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Boyut</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['sm', 'default', 'lg'].map((size) => (
                      <Button
                        key={size}
                        variant={componentVariants.badge.size === size ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => {
                          setComponentVariants({
                            ...componentVariants,
                            badge: { ...componentVariants.badge, size: size }
                          });
                          setHasChanges(true);
                        }}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Component */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Input</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Variant</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['default', 'filled', 'ghost'].map((variant) => (
                      <Button
                        key={variant}
                        variant={componentVariants.input.variant === variant ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs capitalize"
                        onClick={() => {
                          setComponentVariants({
                            ...componentVariants,
                            input: { ...componentVariants.input, variant: variant }
                          });
                          setHasChanges(true);
                        }}
                      >
                        {variant}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Focus Ring</Label>
                  <Button
                    variant={componentVariants.input.focusRing ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setComponentVariants({
                        ...componentVariants,
                        input: { ...componentVariants.input, focusRing: !componentVariants.input.focusRing }
                      });
                      setHasChanges(true);
                    }}
                  >
                    {componentVariants.input.focusRing ? 'Var' : 'Yok'}
                  </Button>
                </div>

                {/* Input Preview */}
                <Input 
                  placeholder="Önizleme" 
                  className="text-xs h-8"
                  style={{
                    outline: componentVariants.input.focusRing ? undefined : 'none',
                    boxShadow: componentVariants.input.focusRing ? undefined : 'none'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Note */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 Nasıl Kullanılır?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                1️⃣ Üstteki karttan düzenlemek istediğiniz temayı seçin (Light veya Dark)<br />
                2️⃣ Renk değerlerini HSL formatında girin: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">39 100% 54%</code><br />
                3️⃣ Değişiklikleri önizleyip kaydedin
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💾 Değişiklikler kaydetmeden kalıcı olmaz. Sıfırla butonu ile varsayılana dönebilirsiniz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Admin Tab Content */}
        <TabsContent value="admin" className="space-y-6">
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Paintbrush className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    🎨 Admin Panel Design Configuration
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Admin panel için özel tema ayarları buraya eklenecek.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portal Tab Content */}
        <TabsContent value="portal" className="space-y-6">
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    🎨 Portal Design Configuration
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Portal için özel tema ayarları buraya eklenecek.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

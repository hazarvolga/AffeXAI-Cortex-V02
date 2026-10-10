'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ComponentSelectorProps {
  componentId: string;
  pageUrl: string;
  onComponentIdChange: (id: string) => void;
  onPageUrlChange: (url: string) => void;
  recentComponents?: Array<{ id: string; type: string; url: string }>;
}

export function ComponentSelector({
  componentId,
  pageUrl,
  onComponentIdChange,
  onPageUrlChange,
  recentComponents = [],
}: ComponentSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Seçimi</CardTitle>
        <CardDescription>
          Heatmap görmek istediğiniz component'i seçin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component ID Input */}
        <div className="space-y-2">
          <Label htmlFor="component-id">Component ID</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="component-id"
              value={componentId}
              onChange={(e) => onComponentIdChange(e.target.value)}
              placeholder="örn: hero-banner, cta-button-1"
              className="pl-9"
            />
          </div>
        </div>

        {/* Page URL Input */}
        <div className="space-y-2">
          <Label htmlFor="page-url">Sayfa URL (Opsiyonel)</Label>
          <Input
            id="page-url"
            value={pageUrl}
            onChange={(e) => onPageUrlChange(e.target.value)}
            placeholder="örn: /products, /about"
          />
        </div>

        {/* Recent Components */}
        {recentComponents.length > 0 && (
          <div className="space-y-2">
            <Label>Son Kullanılan Component'ler</Label>
            <Select
              value={componentId}
              onValueChange={(value) => {
                const component = recentComponents.find((c) => c.id === value);
                if (component) {
                  onComponentIdChange(component.id);
                  onPageUrlChange(component.url);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Listeden seçin" />
              </SelectTrigger>
              <SelectContent>
                {recentComponents.map((component) => (
                  <SelectItem key={component.id} value={component.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{component.id}</span>
                      <span className="text-xs text-muted-foreground">
                        ({component.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>💡 Component ID, tracking kodunuzda kullandığınız ID olmalıdır.</p>
          <p>
            📍 Sayfa URL'si belirtmezseniz, tüm sayfalardaki heatmap birleştirilir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

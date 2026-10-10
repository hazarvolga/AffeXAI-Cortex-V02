'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { ABTest, ABTestStatus, CreateABTestDto } from '@/lib/api/cmsAnalyticsService';

interface ABTestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateABTestDto) => void;
  editingTest?: ABTest | null;
  isSubmitting?: boolean;
}

interface VariantForm {
  name: string;
  description: string;
  trafficAllocation: number;
  config: string; // JSON string
}

export function ABTestFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingTest,
  isSubmitting,
}: ABTestFormDialogProps) {
  const [formData, setFormData] = useState({
    name: editingTest?.name || '',
    description: editingTest?.description || '',
    componentId: editingTest?.componentId || '',
    componentType: editingTest?.componentType || '',
    status: (editingTest?.status || 'draft') as ABTestStatus,
    periodStart: editingTest?.periodStart
      ? new Date(editingTest.periodStart).toISOString().slice(0, 16)
      : '',
    periodEnd: editingTest?.periodEnd
      ? new Date(editingTest.periodEnd).toISOString().slice(0, 16)
      : '',
    conversionGoal: editingTest?.conversionGoal || '',
  });

  const [variants, setVariants] = useState<VariantForm[]>(
    editingTest?.variants.map((v) => ({
      name: v.name,
      description: v.description || '',
      trafficAllocation: v.trafficAllocation,
      config: JSON.stringify(v.componentConfig, null, 2),
    })) || [
      { name: 'Control', description: '', trafficAllocation: 50, config: '{}' },
      { name: 'Variant A', description: '', trafficAllocation: 50, config: '{}' },
    ]
  );

  const addVariant = () => {
    const remainingTraffic = 100 - variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    setVariants([
      ...variants,
      {
        name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
        description: '',
        trafficAllocation: Math.max(0, remainingTraffic),
        config: '{}',
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 2) return; // Min 2 variants
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = () => {
    const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (totalAllocation !== 100) {
      alert('Trafik dağılımı toplamı %100 olmalıdır!');
      return;
    }

    try {
      const dto: CreateABTestDto = {
        name: formData.name,
        description: formData.description || undefined,
        componentId: formData.componentId,
        componentType: formData.componentType,
        status: formData.status,
        periodStart: new Date(formData.periodStart).toISOString(),
        periodEnd: new Date(formData.periodEnd).toISOString(),
        conversionGoal: formData.conversionGoal,
        variants: variants.map((v) => ({
          name: v.name,
          description: v.description || undefined,
          componentConfig: JSON.parse(v.config),
          trafficAllocation: v.trafficAllocation,
        })),
      };

      onSubmit(dto);
    } catch (error) {
      alert('Variant config JSON formatında geçersiz!');
    }
  };

  const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTest ? 'A/B Testi Düzenle' : 'Yeni A/B Testi Oluştur'}
          </DialogTitle>
          <DialogDescription>
            Component variant'larını test edin ve en iyi performansı belirleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-name">Test Adı *</Label>
              <Input
                id="test-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="örn: Hero Button Color Test"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion-goal">Dönüşüm Hedefi *</Label>
              <Input
                id="conversion-goal"
                value={formData.conversionGoal}
                onChange={(e) =>
                  setFormData({ ...formData, conversionGoal: e.target.value })
                }
                placeholder="örn: button_click, form_submit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Test hakkında notlar..."
              rows={2}
            />
          </div>

          {/* Component Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="component-id">Component ID *</Label>
              <Input
                id="component-id"
                value={formData.componentId}
                onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
                placeholder="örn: hero-cta-button"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="component-type">Component Type *</Label>
              <Input
                id="component-type"
                value={formData.componentType}
                onChange={(e) =>
                  setFormData({ ...formData, componentType: e.target.value })
                }
                placeholder="örn: button, card, banner"
              />
            </div>
          </div>

          {/* Period */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period-start">Başlangıç Tarihi *</Label>
              <Input
                id="period-start"
                type="datetime-local"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-end">Bitiş Tarihi *</Label>
              <Input
                id="period-end"
                type="datetime-local"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              />
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variant'lar ({variants.length})</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addVariant}
                disabled={variants.length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                Variant Ekle
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              Toplam Trafik: {totalAllocation}%{' '}
              {totalAllocation !== 100 && (
                <span className="text-destructive font-medium">(100% olmalı!)</span>
              )}
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Variant {index + 1}</h4>
                  {variants.length > 2 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Variant Adı</Label>
                    <Input
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      placeholder="Control, A, B..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trafik %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={variant.trafficAllocation}
                      onChange={(e) =>
                        updateVariant(index, 'trafficAllocation', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Input
                      value={variant.description}
                      onChange={(e) => updateVariant(index, 'description', e.target.value)}
                      placeholder="Opsiyonel..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Config (JSON)</Label>
                  <Textarea
                    value={variant.config}
                    onChange={(e) => updateVariant(index, 'config', e.target.value)}
                    placeholder='{"color": "blue", "size": "large"}'
                    rows={3}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : editingTest ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

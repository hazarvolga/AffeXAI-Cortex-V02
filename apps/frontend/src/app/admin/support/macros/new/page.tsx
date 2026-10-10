'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface MacroAction {
  type: 'update_status' | 'assign' | 'set_priority' | 'add_category' | 'add_tags' | 'add_note' | 'send_email';
  value: string;
  label?: string;
}

export default function NewMacroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [actions, setActions] = useState<MacroAction[]>([
    { type: 'update_status', value: '', label: '' },
  ]);

  const actionTypes = [
    { value: 'update_status', label: 'Durum Değiştir' },
    { value: 'assign', label: 'Kullanıcıya Ata' },
    { value: 'set_priority', label: 'Öncelik Ayarla' },
    { value: 'add_category', label: 'Kategori Ekle' },
    { value: 'add_tags', label: 'Etiket Ekle' },
    { value: 'add_note', label: 'Not Ekle' },
    { value: 'send_email', label: 'Email Gönder' },
  ];

  const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'PENDING_CUSTOMER'];
  const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  const handleAddAction = () => {
    setActions([...actions, { type: 'update_status', value: '', label: '' }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index: number, field: keyof MacroAction, value: string) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch('/api/admin/macros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          actions: actions.filter((action) => action.value),
        }),
      });

      if (response.ok) {
        router.push('/admin/support/macros');
      }
    } catch (error) {
      console.error('Failed to create macro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValuePlaceholder = (type: string): string => {
    const placeholders: Record<string, string> = {
      update_status: 'Durum seçin',
      assign: 'Kullanıcı ID',
      set_priority: 'Öncelik seçin',
      add_category: 'Kategori ID',
      add_tags: 'etiket1, etiket2',
      add_note: 'Not içeriği',
      send_email: 'Email template ID',
    };
    return placeholders[type] || 'Değer girin';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-purple-600" />
            Yeni Makro Oluştur
          </h1>
          <p className="text-muted-foreground mt-2">
            Toplu işlemler için yeni bir makro oluşturun
          </p>
        </div>
        <Link href="/admin/support/macros">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
            <CardDescription>Makro ismi ve açıklaması</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">İsim *</Label>
              <Input
                id="name"
                placeholder="Örn: Spam olarak işaretle ve kapat"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                placeholder="Bu makronun ne işe yaradığını açıklayın"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Genel Makro</Label>
                <p className="text-sm text-muted-foreground">
                  Tüm kullanıcılar bu makroyu kullanabilir
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>İşlemler</CardTitle>
                <CardDescription>Bu makro hangi işlemleri gerçekleştirecek?</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAction}>
                <Plus className="mr-2 h-4 w-4" />
                İşlem Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary">İşlem {index + 1}</Badge>
                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAction(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İşlem Tipi</Label>
                    <Select
                      value={action.type}
                      onValueChange={(value) =>
                        handleActionChange(index, 'type', value as MacroAction['type'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Değer</Label>
                    {action.type === 'update_status' ? (
                      <Select
                        value={action.value}
                        onValueChange={(value) => handleActionChange(index, 'value', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : action.type === 'set_priority' ? (
                      <Select
                        value={action.value}
                        onValueChange={(value) => handleActionChange(index, 'value', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Öncelik seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={getValuePlaceholder(action.type)}
                        value={action.value}
                        onChange={(e) => handleActionChange(index, 'value', e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {(action.type === 'add_note' || action.type === 'send_email') && (
                  <div className="space-y-2">
                    <Label>Etiket (Opsiyonel)</Label>
                    <Input
                      placeholder="Görüntülenecek etiket"
                      value={action.label || ''}
                      onChange={(e) => handleActionChange(index, 'label', e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Makro Kullanım İpuçları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Durum Değiştir:</strong> Ticket durumunu değiştirir (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
            </p>
            <p>
              <strong>Kullanıcıya Ata:</strong> Ticket'ı belirtilen kullanıcıya atar
            </p>
            <p>
              <strong>Öncelik Ayarla:</strong> Ticket önceliğini ayarlar (LOW, MEDIUM, HIGH, URGENT)
            </p>
            <p>
              <strong>Kategori Ekle:</strong> Ticket'a kategori ekler
            </p>
            <p>
              <strong>Etiket Ekle:</strong> Virgülle ayrılmış etiketler ekler
            </p>
            <p>
              <strong>Not Ekle:</strong> Ticket'a dahili not ekler
            </p>
            <p>
              <strong>Email Gönder:</strong> Belirtilen email template'ini gönderir
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/admin/support/macros">
            <Button type="button" variant="outline">
              İptal
            </Button>
          </Link>

          <Button type="submit" disabled={loading || actions.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Makro Oluştur
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

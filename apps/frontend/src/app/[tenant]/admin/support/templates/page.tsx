'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Edit, Trash2, FileText, TrendingUp, Search } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    content: '',
    priority: 'MEDIUM',
    isPublic: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tickets/templates');
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/tickets/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          subject: '',
          content: '',
          priority: 'MEDIUM',
          isPublic: true,
        });
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Bu template silinsin mi?')) return;

    try {
      await fetch(`/api/tickets/templates/${id}`, {
        method: 'DELETE',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleToggleTemplate = async (id: string) => {
    try {
      await fetch(`/api/tickets/templates/${id}/toggle`, {
        method: 'PATCH',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BccEditorialWrapper
      headerTitle="TICKET ŞABLONLARI"
      headerSubtitle="Sık kullanılan yanıtlar ve ticketlar için hazır şablonlar"
      headerBadge="TEMPLATES"
    >
      <div className="space-y-8">

        {/* Popular Templates Section */}
        {templates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#9df425]" />
              Popüler Şablonlar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 4)
                .map((template) => (
                  <div key={template.id} className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white truncate" title={template.name}>{template.name}</h3>
                          <Badge variant="secondary" className="bg-[#9df425]/10 text-[#9df425] border-0 text-xs">
                            {template.usageCount}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/60 line-clamp-2">{template.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <Badge variant="outline" className="border-white/10 text-white/40 text-[10px] uppercase">
                          {template.priority}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white" onClick={() => handleCreateTemplate()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All Templates Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-white/40" />
              Tüm Şablonlar ({filteredTemplates.length})
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/40" />
              <Input
                placeholder="Şablon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/20 h-9"
              />
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-lg">
              <FileText className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/40">Şablon bulunamadı</p>
            </div>
          ) : (
            <div className="border border-white/5 bg-white/[0.02] rounded-md overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="bg-[#09090b] p-6 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white text-lg">{template.name}</h3>
                        <div className="flex gap-2">
                          <Badge variant={template.isActive ? 'default' : 'secondary'} className={template.isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0' : 'bg-white/5 text-white/40'}>
                            {template.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                          {template.isPublic && (
                            <Badge variant="outline" className="border-blue-500/20 text-blue-400">Herkese Açık</Badge>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-red-400" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Konu</p>
                        <p className="text-sm text-white/80 line-clamp-1">{template.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">İçerik</p>
                        <p className="text-sm text-white/60 line-clamp-2 min-h-[2.5rem]">{template.content}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                      <Badge variant="outline" className="border-white/10 text-white/40 font-mono text-xs">
                        {template.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-white/40 hover:text-white"
                        onClick={() => handleToggleTemplate(template.id)}
                      >
                        {template.isActive ? 'Devre Dışı Bırak' : 'Aktif Et'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl bg-[#09090b] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Yeni Template Oluştur</DialogTitle>
              <DialogDescription className="text-white/60">
                Sık kullanılan ticketlar için şablon oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">Template Adı</Label>
                <Input
                  id="name"
                  placeholder="Örn: Lisans Aktivasyon Problemi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white/80">Açıklama</Label>
                <Input
                  id="description"
                  placeholder="Template açıklaması"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white/80">Ticket Konusu</Label>
                <Input
                  id="subject"
                  placeholder="Ticket başlığı"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-white/80">İçerik</Label>
                <Textarea
                  id="content"
                  placeholder="Ticket içeriği"
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-white/80">Öncelik</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#09090b] border-white/10 text-white">
                      <SelectItem value="LOW">Düşük</SelectItem>
                      <SelectItem value="MEDIUM">Orta</SelectItem>
                      <SelectItem value="HIGH">Yüksek</SelectItem>
                      <SelectItem value="URGENT">Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isPublic" className="text-white/80">Görünürlük</Label>
                  <Select
                    value={formData.isPublic ? 'true' : 'false'}
                    onValueChange={(value) => setFormData({ ...formData, isPublic: value === 'true' })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#09090b] border-white/10 text-white">
                      <SelectItem value="true">Herkese Açık</SelectItem>
                      <SelectItem value="false">Özel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10 bg-transparent text-white hover:bg-white/10">
                İptal
              </Button>
              <Button onClick={handleCreateTemplate} className="bg-[#9df425] text-black hover:bg-[#82cb1e]">
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BccEditorialWrapper>
  );
}

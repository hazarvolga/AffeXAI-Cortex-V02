'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateLibrary } from '@/components/cms/template-library/template-library';
import { TemplateImportExport } from '@/components/cms/template-library/template-import-export';
import { TemplatePartsLibrary } from '@/components/cms/template-library/template-parts-library';
import { TemplatePreviewDialog } from '@/components/cms/template-library/template-preview-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileStack, FileDown, FileUp, Layers, Plus, RefreshCw } from 'lucide-react';
import { templateService } from '@/lib/api/templateService';
import { getSeedTemplatesWithIds } from '@/lib/cms/seed-templates';
import type { PageTemplate, TemplatePart } from '@/types/cms-template';

/**
 * CMS Templates Management Page
 *
 * Comprehensive template management interface for CMS
 * Features:
 * - Browse and apply templates
 * - Import/export templates
 * - Manage template parts (header, footer, etc.)
 * - Template analytics
 */
export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [templateParts, setTemplateParts] = useState<TemplatePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('library');

  // Load templates and parts
  useEffect(() => {
    loadTemplates();
    loadTemplateParts();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await templateService.getAll({ isActive: true });

      // If API returns empty or fails, use seed templates as fallback
      if (data && data.length > 0) {
        setTemplates(data);
      } else {
        console.log('No templates from API, using seed templates');
        setTemplates(getSeedTemplatesWithIds());
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback to seed templates on error
      console.log('API error, using seed templates as fallback');
      setTemplates(getSeedTemplatesWithIds());
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplateParts = async () => {
    try {
      // TODO: Implement API call to fetch template parts
      // const response = await fetch('/api/cms/template-parts');
      // const data = await response.json();
      // setTemplateParts(data);

      // For now, use empty array until backend API is implemented
      setTemplateParts([]);
    } catch (error) {
      console.error('Error loading template parts:', error);
    }
  };

  const handleApplyTemplate = async (template: PageTemplate) => {
    // TODO: Implement template application logic
    console.log('Applying template:', template.name);
    // Navigate to CMS editor with template
    router.push(`/admin/cms/editor?template=${template.id}`);
  };

  const handlePreviewTemplate = async (template: PageTemplate) => {
    // Navigate to dedicated preview page
    router.push(`/admin/cms/templates/preview/${template.id}`);
  };

  const handleImportTemplate = async (template: PageTemplate) => {
    try {
      // TODO: Validate and save template to backend
      console.log('Imported template:', template.name);

      // For now, just add to local state
      setTemplates(prev => [...prev, template]);

      // Reload templates from backend
      await loadTemplates();
    } catch (error) {
      console.error('Error importing template:', error);
    }
  };

  const handleExportTemplate = async (template: PageTemplate) => {
    // TODO: Implement template export logic
    console.log('Exporting template:', template.name);

    // Create download
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sayfa Şablonları</h1>
          <p className="text-muted-foreground mt-1">
            Hazır şablonlarla hızlı sayfa oluşturun, şablonlarınızı yönetin
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-8">
            <FileStack className="h-3 w-3 mr-1" />
            {templates.length} Şablon
          </Badge>
          <Badge variant="outline" className="h-8">
            <Layers className="h-3 w-3 mr-1" />
            {templateParts.length} Parça
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadTemplates();
              loadTemplateParts();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileStack className="h-4 w-4 text-primary" />
              Şablon Kütüphanesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{templates.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Kullanıma hazır sayfa şablonları
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Şablon Parçaları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{templateParts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Yeniden kullanılabilir bileşenler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileDown className="h-4 w-4 text-primary" />
              İçe/Dışa Aktarım
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">JSON</p>
            <p className="text-xs text-muted-foreground mt-1">
              Şablonları içe ve dışa aktarın
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <FileStack className="h-4 w-4" />
            Şablon Kütüphanesi
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Şablon Parçaları
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            İçe/Dışa Aktarım
          </TabsTrigger>
        </TabsList>

        {/* Template Library Tab */}
        <TabsContent value="library" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sayfa Şablonları</CardTitle>
                  <CardDescription>
                    Hazır şablonları inceleyin, önizleyin ve sayfa oluşturmak için kullanın
                  </CardDescription>
                </div>
                <Button onClick={() => router.push('/admin/cms/editor')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Şablon
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Henüz şablon yok</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    İlk şablonunuzu oluşturun veya hazır bir şablonu içe aktarın
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <FileUp className="h-4 w-4 mr-2" />
                      Şablon İçe Aktar
                    </Button>
                    <Button onClick={() => router.push('/admin/cms/editor')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Şablon
                    </Button>
                  </div>
                </div>
              ) : (
                <TemplateLibrary
                  templates={templates}
                  onApplyTemplate={handleApplyTemplate}
                  onPreviewTemplate={handlePreviewTemplate}
                  filterByContext={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Parts Tab */}
        <TabsContent value="parts" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Şablon Parçaları</CardTitle>
                  <CardDescription>
                    Yeniden kullanılabilir header, footer, sidebar gibi bölümleri yönetin
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Parça
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templateParts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Henüz parça yok</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    Şablon parçaları header, footer gibi tekrar kullanılabilir bölümlerdir
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Parçayı Oluştur
                  </Button>
                </div>
              ) : (
                <TemplatePartsLibrary
                  parts={templateParts}
                  onSelectPart={(part) => console.log('Selected part:', part)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şablon İçe/Dışa Aktarımı</CardTitle>
              <CardDescription>
                Şablonları JSON formatında içe veya dışa aktarın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateImportExport
                templates={templates}
                onImport={handleImportTemplate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Şablonlar Hakkında</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Şablonlar:</strong> Tamamen yapılandırılmış sayfa düzenleri. Hızlıca yeni sayfalar oluşturmak için kullanın.
          </p>
          <p>
            <strong>Şablon Parçaları:</strong> Header, footer gibi tekrar kullanılabilir bölümler. Birden fazla şablonda kullanabilirsiniz.
          </p>
          <p>
            <strong>Design Tokens:</strong> Tüm şablonlar tasarım sistemi token'larını kullanır, tema değişikliklerinde otomatik güncellenir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

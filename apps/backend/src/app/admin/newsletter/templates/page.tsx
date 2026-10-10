'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutTemplate, PlusCircle, Eye, Pen, Copy } from 'lucide-react';
import Link from 'next/link';
import templatesService, { TemplateResponse } from '@/lib/api/templatesService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from "next/image";
import { Badge } from '@/components/ui/badge';

export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await templatesService.getAllTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Şablonlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateFromTemplate = async (fileTemplateName: string, templateName: string) => {
    try {
      await templatesService.createTemplateFromFile(fileTemplateName, templateName);
      // Refresh the template list
      const data = await templatesService.getAllTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error creating template from file:', err);
      alert('Şablon oluşturulurken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Şablonları Yönet</h1>
            <p className="text-muted-foreground">Yeniden kullanılabilir e-posta şablonları oluşturun ve yönetin.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Şablonlar yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/newsletter">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Şablonları Yönet</h1>
            <p className="text-muted-foreground">Yeniden kullanılabilir e-posta şablonları oluşturun ve yönetin.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">{error}</div>
        </div>
      </div>
    );
  }

  // Combine db and file templates for display
  const allTemplates = templates ? [
    ...templates.dbTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || 'Veritabanı şablonu',
      thumbnailUrl: template.thumbnailUrl || '/placeholders/template-default.png',
      createdAt: template.createdAt,
      type: 'db',
      templateType: template.type,
      isCustom: template.type === 'custom'
    })),
    ...templates.fileTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: 'Hazır şablon',
      thumbnailUrl: '/placeholders/template-default.png',
      createdAt: new Date().toISOString(),
      type: 'file',
      templateType: 'file_based',
      isCustom: false
    }))
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/newsletter">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Şablonları Yönet</h1>
          <p className="text-muted-foreground">Yeniden kullanılabilir e-posta şablonları oluşturun ve yönetin.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Şablonlar</CardTitle>
          <CardDescription>
            Mevcut e-posta şablonlarınızı görüntüleyin ve yönetin. Toplam {templates?.total || 0} şablon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">Henüz Şablon Oluşturulmadı</h3>
                <p className="text-muted-foreground">
                  Yeni şablonlar oluşturarak e-posta gönderimlerinizi kolaylaştırın.
                </p>
              </div>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Yeni Şablon Oluştur
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Önizleme</TableHead>
                  <TableHead>Şablon Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                  <TableHead className="text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTemplates.map((template) => (
                  <TableRow key={`${template.type}-${template.id}`}>
                    <TableCell>
                      <Image 
                        src={template.thumbnailUrl} 
                        alt={template.name}
                        width={120}
                        height={90}
                        className="rounded-md border aspect-[4/3] object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {template.name}
                      {template.isCustom && (
                        <Badge variant="secondary" className="ml-2">Özelleştirilmiş</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{template.description}</TableCell>
                    <TableCell>
                      {template.type === 'file' ? (
                        <Badge variant="outline">Hazır Şablon</Badge>
                      ) : (
                        <Badge variant="default">Özel</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(template.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" asChild>
                        <Link href={`/admin/newsletter/templates/${template.id}/preview?type=${template.type}`}>
                          <Eye className="mr-2 h-4 w-4" /> Önizle
                        </Link>
                      </Button>
                      
                      {template.type === 'file' ? (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleCreateFromTemplate(template.id, template.name)}
                          className="mr-2"
                        >
                          <Copy className="mr-2 h-4 w-4" /> Kullan
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/admin/newsletter/templates/${template.id}/edit`}>
                            <Pen className="mr-2 h-4 w-4" /> Düzenle
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
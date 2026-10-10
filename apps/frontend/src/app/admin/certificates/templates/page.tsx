'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { certificatesService, type CertificateTemplate } from '@/lib/api/certificatesService';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Eye, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await certificatesService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Template yükleme hatası:', error);
      toast.error('Template\'ler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (templateId: string) => {
    router.push(`/admin/certificates/templates/${templateId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Template'ler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/certificates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sertifikalara Dön
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Sertifika Template'leri</h1>
        <p className="text-gray-600 mt-2">
          PDF sertifikaları için HTML template'lerini görüntüleyin ve düzenleyin
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </div>
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Template Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Yönelim:</span>
                    <p className="font-medium capitalize">{template.orientation}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sayfa:</span>
                    <p className="font-medium">{template.pageFormat}</p>
                  </div>
                </div>

                {/* Variables */}
                {template.variables && template.variables.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">Değişkenler:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {'{{'}{variable}{'}}'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Updated Date */}
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                  <Calendar className="w-3 h-3" />
                  <span>Güncelleme: {formatDate(template.updatedAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(template.id)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Düzenle
                  </Button>
                  {template.previewImageUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(template.previewImageUrl!, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Henüz template oluşturulmamış</p>
          </div>
        </Card>
      )}
    </div>
  );
}

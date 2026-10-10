'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { certificatesService, type CertificateTemplate } from '@/lib/api/certificatesService';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Code, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TemplateEditorPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await certificatesService.getTemplate(templateId);
      setTemplate(data);
      setHtmlContent(data.htmlContent);
      setDescription(data.description);
    } catch (error) {
      console.error('Template yükleme hatası:', error);
      toast.error('Template yüklenemedi');
      router.push('/admin/certificates/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await certificatesService.updateTemplate(templateId, {
        htmlContent,
        description,
      });
      toast.success('Template başarıyla güncellendi');
      setPreviewKey((prev) => prev + 1); // Refresh preview
      await loadTemplate(); // Reload to get updated data
    } catch (error) {
      console.error('Template güncelleme hatası:', error);
      toast.error('Template güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Template yükleniyor...</div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin/certificates/templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Template'lere Dön
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              {template.name}
            </h1>
            <p className="text-gray-600 mt-2">
              HTML template'ini düzenleyin ve değişiklikleri önizleyin
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Kullanılabilir Değişkenler:</strong>{' '}
          {template.variables.map((v) => `{{${v}}}`).join(', ')}
          <br />
          <strong>Sayfa Ayarları:</strong> {template.pageFormat} - {template.orientation}
        </AlertDescription>
      </Alert>

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code Editor */}
        <Card className="h-[calc(100vh-300px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              HTML Editörü
            </CardTitle>
            <CardDescription>
              Template HTML kodunu buradan düzenleyebilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)]">
            <div className="space-y-4 h-full flex flex-col">
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Template açıklaması"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="htmlContent">HTML İçerik</Label>
                <Textarea
                  id="htmlContent"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="font-mono text-sm h-[calc(100%-30px)] resize-none"
                  placeholder="HTML içeriğini buraya yazın..."
                />
              </div>
              <Button onClick={handlePreview} variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Önizlemeyi Güncelle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card className="h-[calc(100vh-300px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Canlı Önizleme
            </CardTitle>
            <CardDescription>
              Template'in nasıl görüneceğini buradan kontrol edin
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-100px)]">
            <Tabs defaultValue="preview" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Önizleme</TabsTrigger>
                <TabsTrigger value="raw">Ham HTML</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="h-[calc(100%-50px)] mt-4">
                <div className="border rounded-lg overflow-auto h-full bg-gray-50 p-4">
                  <div
                    key={previewKey}
                    className="bg-white shadow-lg mx-auto"
                    style={{
                      width: template.orientation === 'landscape' ? '297mm' : '210mm',
                      minHeight: template.orientation === 'landscape' ? '210mm' : '297mm',
                      transform: 'scale(0.5)',
                      transformOrigin: 'top left',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: htmlContent
                        .replace(/\{\{recipientName\}\}/g, 'Örnek Kullanıcı Adı')
                        .replace(/\{\{recipientEmail\}\}/g, 'ornek@email.com')
                        .replace(/\{\{trainingTitle\}\}/g, 'Örnek Eğitim Başlığı')
                        .replace(/\{\{issueDate\}\}/g, new Date().toLocaleDateString('tr-TR'))
                        .replace(/\{\{logoUrl\}\}/g, '')
                        .replace(/\{\{signatureUrl\}\}/g, ''),
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="raw" className="h-[calc(100%-50px)] mt-4">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto h-full text-xs font-mono">
                  {htmlContent}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Template ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-gray-600">{template.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Son Güncelleme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              {new Date(template.updatedAt).toLocaleString('tr-TR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Durum</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              {template.isActive ? '✅ Aktif' : '❌ Pasif'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

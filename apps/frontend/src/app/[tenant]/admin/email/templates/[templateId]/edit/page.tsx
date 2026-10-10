'use client';

import { notFound, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Save, Copy, Lock, Database, FileText } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EditEmailTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const unwrappedParams = use(params);
  const { templateId } = unwrappedParams;
  const router = useRouter();
  const { toast } = useToast();

  const [template, setTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedTemplate = useRef(false);

  useEffect(() => {
    if (hasFetchedTemplate.current) return;
    hasFetchedTemplate.current = true;

    const fetchTemplate = async () => {
      try {
        setLoading(true);

        // Fetch unified template
        const response = await fetch(`http://localhost:9006/api/email-templates/unified/${templateId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setTemplate(data);
        setTemplateName(data.name);

        // For database templates, show structure
        if (data.source === 'DATABASE') {
          setTemplateContent(JSON.stringify(data.content || data.structure || {}, null, 2));
        } else {
          // For file templates, show content
          setTemplateContent(data.content || 'File template content will be loaded here');
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching template:', err);
        setError('Şablon bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const handleCloneTemplate = async () => {
    try {
      setSaving(true);

      const cloneName = prompt('Yeni şablon adı:', `${template.name} (Kopya)`);
      if (!cloneName) return;

      const response = await fetch(`http://localhost:9006/api/email-templates/${templateId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloneName })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const newTemplate = await response.json();

      toast({
        title: 'Başarılı!',
        description: `Şablon "${cloneName}" olarak kopyalandı.`,
      });

      // Redirect to new template edit page
      router.push(`/admin/email-marketing/templates/${newTemplate.id}/edit`);
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Şablon kopyalanamadı.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);

      // Parse JSON content
      let structure;
      try {
        structure = JSON.parse(templateContent);
      } catch (e) {
        toast({
          title: 'Hata',
          description: 'Geçersiz JSON formatı.',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`http://localhost:9006/api/email-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          structure
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast({
        title: 'Başarılı!',
        description: 'Şablon kaydedildi.',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: 'Şablon kaydedilemedi.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Şablon yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-red-600">Hata</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/admin/email-marketing/templates">Şablonlara Geri Dön</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!template) {
    notFound();
    return null;
  }

  const isFileTemplate = template.source === 'FILE';
  const isDatabaseTemplate = template.source === 'DATABASE';

  return (
    <div className="space-y-4">
      {/* Header with template info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {template.name}
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                {isFileTemplate && (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Dosya Şablonu (Read-Only)</span>
                  </>
                )}
                {isDatabaseTemplate && (
                  <>
                    <Database className="h-4 w-4" />
                    <span>Database Şablonu (Düzenlenebilir)</span>
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isFileTemplate && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <FileText className="h-3 w-3 mr-1" />
                  File
                </Badge>
              )}
              {isDatabaseTemplate && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Database className="h-3 w-3 mr-1" />
                  Database
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isFileTemplate ? 'Şablon İçeriği (Salt Okunur)' : 'Şablon Düzenle'}
          </CardTitle>
          {isFileTemplate && (
            <CardDescription className="flex items-center gap-2 text-amber-600">
              <Lock className="h-4 w-4" />
              Bu şablon dosya tabanlıdır ve doğrudan düzenlenemez. Düzenlemek için kopyalayın.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isDatabaseTemplate && (
            <div className="space-y-2">
              <Label htmlFor="template-name">Şablon Adı</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="template-content">
              {isFileTemplate ? 'Şablon Yapısı' : 'Şablon İçeriği (JSON)'}
            </Label>
            <Textarea
              id="template-content"
              readOnly={isFileTemplate}
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              className="w-full h-[60vh] font-mono text-xs"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/admin/email-marketing/templates">Geri Dön</Link>
          </Button>

          <div className="flex gap-2">
            {isFileTemplate && (
              <Button
                onClick={handleCloneTemplate}
                disabled={saving}
              >
                <Copy className="mr-2 h-4 w-4" />
                {saving ? 'Kopyalanıyor...' : 'Kopyala ve Düzenle'}
              </Button>
            )}

            {isDatabaseTemplate && (
              <Button
                onClick={handleSaveTemplate}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

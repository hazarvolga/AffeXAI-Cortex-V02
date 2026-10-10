'use client';

import { templates } from "@/lib/newsletter-data";
import { notFound } from "next/navigation";
import { promises as fs } from 'fs';
import path from 'path';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Save } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { use } from "react";

// This is a client component that reads the template data
export default function EditEmailTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { templateId } = unwrappedParams;
  
  const [template, setTemplate] = useState<any>(undefined);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedTemplate = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedTemplate.current) return;
    hasFetchedTemplate.current = true;
    
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch the template data from an API
        // For now, we're using mock data
        const templateData = templates.find(t => t.id === templateId);
        if (!templateData) {
          notFound();
          return;
        }
        setTemplate(templateData);
        
        // In a real app, you would fetch the file content from an API
        // For now, we're using mock content
        setFileContent(`// Bu alan şu an için sadece bir konsepttir. 
// Gerçek bir uygulamada burada e-posta şablonunun HTML içeriği olacak.
// Şablon dosyası: src/emails/${templateData.content}`);
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!template) {
    notFound();
    return null;
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code /> Kod Editörü: {template.name}</CardTitle>
            <CardDescription>
                <code>src/emails/{template.content}</code> dosyasının içeriği. Bu arayüz sadece gösterim amaçlıdır.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Textarea
                readOnly
                value={fileContent}
                className="w-full h-[60vh] font-mono text-xs bg-muted"
            />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" asChild>
                <Link href="/admin/newsletter">Geri Dön</Link>
            </Button>
            <Button disabled>
                <Save className="mr-2 h-4 w-4"/> Kaydet (Devre Dışı)
            </Button>
        </CardFooter>
    </Card>
  );
}
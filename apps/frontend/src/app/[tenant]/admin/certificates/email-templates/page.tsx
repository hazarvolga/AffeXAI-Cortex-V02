'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, FileCode, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmailTemplate {
  name: string;
  displayName: string;
  description: string;
  category: string;
  variables: string[];
  usedBy: string[];
}

const certificateEmailTemplates: EmailTemplate[] = [
  {
    name: "certificate-issued",
    displayName: "Sertifika Gönderildi",
    description: "Sertifika düzenlendiğinde kullanıcıya gönderilen email (PDF ekte)",
    category: "Certificate Delivery",
    variables: ["recipientName", "trainingTitle", "certificateNumber", "issueDate", "verificationUrl"],
    usedBy: ["CertificateEmailService.sendCertificateEmail()"]
  },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Certificate Delivery": "bg-purple-500",
  };
  return colors[category] || "bg-gray-500";
};

export default function CertificatesEmailTemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sertifika Email Şablonları</h1>
          <p className="text-muted-foreground mt-2">
            Sertifika sistemi için kullanılan {certificateEmailTemplates.length} email şablonu
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/certificates">
            <Award className="mr-2 h-4 w-4" />
            Sertifikalara Dön
          </Link>
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>📧 Modüler Email Mimarisi</CardTitle>
          <CardDescription>
            Her modül kendi email template'lerini yönetir. Tüm template'ler <code>apps/backend/src/modules/certificates/templates/</code> klasöründe bulunur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <FileCode className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">React Email (.tsx)</p>
                <p className="text-sm text-muted-foreground">TypeScript + React components</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileCode className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">PDF Attachment</p>
                <p className="text-sm text-muted-foreground">Sertifika PDF ekte gönderilir</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Shared Components</p>
                <p className="text-sm text-muted-foreground">EmailFooter (tüm modüller)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Notice */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-orange-900 dark:text-orange-100">🔄 Migration Status</CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            Sertifika email sistemi modüler yapıya geçiş aşamasında
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-100">Mevcut Durum (Eski Sistem):</p>
            <ul className="list-disc list-inside text-orange-800 dark:text-orange-200 ml-2 mt-1">
              <li><code>CertificateEmailService.generateEmailHtml()</code> - Hardcoded HTML string</li>
              <li>Inline CSS ve statik HTML yapısı</li>
              <li>EmailFooter component kullanılmıyor</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-100">Yeni Sistem (Modüler):</p>
            <ul className="list-disc list-inside text-orange-800 dark:text-orange-200 ml-2 mt-1">
              <li><code>certificate-issued.tsx</code> - React Email template hazır ✅</li>
              <li>EmailFooter component entegrasyonu ✅</li>
              <li>Handlebars variable system ✅</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-900 p-3 rounded border border-orange-300 dark:border-orange-700 mt-3">
            <p className="font-medium text-gray-900 dark:text-gray-100">Migration Adımları:</p>
            <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 ml-2 mt-1 space-y-1">
              <li>Template compiler'a <code>certificate-issued.tsx</code> ekle</li>
              <li><code>CertificateEmailService</code> → MailService.sendMail() kullan</li>
              <li><code>generateEmailHtml()</code> metodunu kaldır</li>
              <li>Template: <code>'certificate-issued'</code> ile gönder</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificateEmailTemplates.map((template) => (
          <Card key={template.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.displayName}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variables */}
              <div>
                <p className="text-sm font-medium mb-2">Template Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Used By */}
              <div>
                <p className="text-sm font-medium mb-2">Kullanıldığı Servisler:</p>
                {template.usedBy.map((service) => (
                  <code key={service} className="text-xs bg-muted px-2 py-1 rounded block">
                    {service}
                  </code>
                ))}
              </div>

              {/* File Paths */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📄 <code>templates/{template.name}.tsx</code></p>
                <p className="text-orange-600 dark:text-orange-400">⚠️ HTML compile edilmedi (migration gerekli)</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a
                    href={`vscode://file/Users/hazarekiz/Projects/v06/Affexai/apps/backend/src/modules/certificates/templates/${template.name}.tsx`}
                    target="_blank"
                  >
                    <FileCode className="mr-2 h-3 w-3" />
                    TSX Aç
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

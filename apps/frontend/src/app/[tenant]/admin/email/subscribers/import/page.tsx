'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ImportWizard } from '@/components/admin/email-marketing/import-wizard';
import { ImportResult } from '@affexai/shared-types';

export default function ImportSubscribersPage() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
  };

  const handleImportCancel = () => {
    // Navigate back to email marketing page
    window.history.back();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/email-marketing">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Email Marketing'e Dön
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Toplu Abone İçe Aktarma</CardTitle>
            <CardDescription>
              CSV dosyası yükleyerek toplu olarak abone ekleyin. Sistem otomatik olarak e-posta adreslerini doğrular ve raporlar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportWizard
              onComplete={handleImportComplete}
              onCancel={handleImportCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
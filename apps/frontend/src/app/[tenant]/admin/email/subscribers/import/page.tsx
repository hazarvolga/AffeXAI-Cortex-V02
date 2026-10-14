"use client";

import { useState } from "react";
import { useTenantAdminHref } from "@/hooks/use-tenant-admin-href";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ImportWizard } from "@/components/admin/email-marketing/import-wizard";
import { ImportResult } from "@affexai/shared-types";

export default function ImportSubscribersPage() {
  const tenantHref = useTenantAdminHref();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
  };

  const handleImportCancel = () => {
    // Navigate back to email marketing page
    window.history.back();
  };

  return (
    <div className="container mx-auto max-w-full space-y-6 overflow-x-hidden px-4 py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={tenantHref("/email")}>
            <ArrowLeft aria-hidden className="h-4 w-4 mr-2" />
            E-posta pazarlamaya dön
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              Toplu abone içe aktarma
            </h1>
            <CardDescription>
              CSV dosyası yükleyerek toplu olarak abone ekleyin. Sistem otomatik
              olarak e-posta adreslerini doğrular ve raporlar.
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

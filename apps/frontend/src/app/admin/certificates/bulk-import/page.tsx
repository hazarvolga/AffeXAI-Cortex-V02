'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import certificatesService, { BulkImportCertificateDto } from '@/lib/api/certificatesService';

export default function BulkImportCertificatesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<BulkImportCertificateDto[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleParseFile = async () => {
    if (!file) return;

    try {
      setIsParsing(true);
      setError(null);
      const parsedCertificates = await certificatesService.parseCSVFile(file);
      setCertificates(parsedCertificates);
    } catch (err) {
      setError('Dosya okunurken bir hata oluştu: ' + (err as Error).message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (certificates.length === 0) return;

    try {
      setIsImporting(true);
      setError(null);
      const importResult = await certificatesService.bulkImportCertificates(certificates);
      setResult(importResult);
    } catch (err) {
      setError('İçe aktarma sırasında bir hata oluştu: ' + (err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `user_email,certificate_name,issue_date,expiry_date,description,file_path
user@example.com,"AWS Certified Developer",2025-01-15,2028-01-15,"AWS Geliştirme Sertifikası",/certificates/aws-dev.pdf
user2@example.com,"Google Cloud Professional",2025-02-20,2028-02-20,"Google Cloud Uzman Sertifikası",/certificates/gcp-pro.pdf`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sertifika_ice_aktarma_sablonu.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Toplu Sertifika İçe Aktarma</h1>
        <p className="text-muted-foreground">
          CSV dosyası kullanarak birden fazla sertifikayı toplu olarak içe aktarın
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Dosyası Yükle</CardTitle>
          <CardDescription>
            Sertifika verilerinizi içeren CSV dosyasını seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV Dosyası</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="flex-1"
              />
              <Button onClick={handleDownloadTemplate} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Şablon İndir
              </Button>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2">
              <Button onClick={handleParseFile} disabled={isParsing}>
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dosya İşleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Dosyayı İncele
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {certificates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>İçe Aktarılacak Sertifikalar ({certificates.length})</CardTitle>
            <CardDescription>
              Aşağıdaki sertifikalar içe aktarılacak
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Kullanıcı E-posta</th>
                    <th className="p-2 text-left">Sertifika Adı</th>
                    <th className="p-2 text-left">Verilme Tarihi</th>
                    <th className="p-2 text-left">Bitiş Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{cert.userEmail}</td>
                      <td className="p-2">{cert.certificateName}</td>
                      <td className="p-2">{cert.issueDate}</td>
                      <td className="p-2">{cert.expiryDate || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={handleImport} disabled={isImporting} className="w-full">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                `Tüm Sertifikaları İçe Aktar (${certificates.length})`
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>İçe Aktarma Sonucu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Başarılı: {result.success}</span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span>Başarısız: {result.failed}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Hatalar:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={() => {
              setFile(null);
              setCertificates([]);
              setResult(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>
              Yeni İçe Aktarma Yap
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
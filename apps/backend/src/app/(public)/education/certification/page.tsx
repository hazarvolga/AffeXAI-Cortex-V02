
'use client'

import { PageHero } from "@/components/common/page-hero";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, CheckCircle, XCircle, Award } from "lucide-react";
import { useState } from "react";
import { certificates, Certificate } from "@/lib/certificate-data";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function CertificationPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Certificate | null | 'not_found'>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        setTimeout(() => {
            const found = certificates.find(c => c.certificateNumber.toLowerCase() === searchTerm.toLowerCase() || c.recipientName.toLowerCase() === searchTerm.toLowerCase());
            setResult(found || 'not_found');
            setLoading(false);
        }, 1000);
    };

    const isCertificateValid = (cert: Certificate) => {
        if (cert.status === 'Revoked') return false;
        if (!cert.validUntil) return true;
        return new Date(cert.validUntil) >= new Date();
    };

    return (
        <div>
            <PageHero 
                title="Sertifika Sorgulama"
                subtitle="Aluplan tarafından verilen sertifikaların geçerliliğini anında doğrulayın."
            />
            <Breadcrumb items={[
                { name: 'Eğitim & Destek', href: '/education' },
                { name: 'Sertifika Sorgulama', href: '/education/certification' }
            ]} />
            <div className="container mx-auto py-16 px-4 flex justify-center">
                <div className="w-full max-w-3xl space-y-8">
                    <Card>
                        <form onSubmit={handleSearch}>
                            <CardHeader className="text-center">
                                <CardTitle>Sertifika Doğrulama</CardTitle>
                                <CardDescription>Lütfen doğrulamak istediğiniz sertifika numarasını veya katılımcı adını girin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="certificate-number" className="sr-only">Sertifika Numarası veya Katılımcı Adı</Label>
                                    <Input 
                                        id="certificate-number" 
                                        placeholder="Örn: ALP-TR-2024-12345 veya Ahmet Yılmaz" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" type="submit" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sorgulanıyor...</>
                                    ) : (
                                        <><Search className="mr-2 h-4 w-4" /> Sorgula</>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {result && result !== 'not_found' && (
                        isCertificateValid(result) ? (
                            <Alert variant="default" className="bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4 !text-green-600" />
                                <AlertTitle className="text-green-900">Sertifika Geçerli</AlertTitle>
                                <AlertDescription className="text-green-800">
                                    <p><strong>Sertifika No:</strong> {result.certificateNumber}</p>
                                    <p><strong>Alıcı:</strong> {result.recipientName}</p>
                                    <p><strong>Sertifika:</strong> {result.certificateName}</p>
                                    <p><strong>Veriliş Tarihi:</strong> {new Date(result.issuedAt).toLocaleDateString('tr-TR')}</p>
                                    {result.validUntil && <p><strong>Geçerlilik Tarihi:</strong> {new Date(result.validUntil).toLocaleDateString('tr-TR')}</p>}
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Sertifika Geçerli Değil</AlertTitle>
                                <AlertDescription>
                                     <p><strong>"{result.certificateNumber}"</strong> numaralı sertifikanın süresi dolmuş veya iptal edilmiştir.</p>
                                     <p>Detaylı bilgi için lütfen <Link href="/contact" className="underline font-semibold">bizimle iletişime geçin.</Link></p>
                                </AlertDescription>
                            </Alert>
                        )
                    )}

                    {result === 'not_found' && (
                         <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Sertifika veya Katılımcı Bulunamadı</AlertTitle>
                            <AlertDescription>
                                Girdiğiniz bilgilerle eşleşen bir kayıt bulunamadı. Lütfen bilgileri kontrol edip tekrar deneyin.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}

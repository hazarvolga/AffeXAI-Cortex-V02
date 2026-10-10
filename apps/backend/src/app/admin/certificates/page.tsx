'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, FileDown, Copy, Search, FileUp, Award, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { Certificate } from "@/lib/types";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import certificatesService from "@/lib/api/certificatesService";

// Map backend certificate to frontend certificate type
interface FrontendCertificate {
  id: string;
  name: string;
  description: string;
  issueDate: string;
  expiryDate: string | null;
  fileUrl: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  // Frontend specific properties
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  certificateName: string;
  issuedAt: string;
  validUntil?: string;
  verificationUrl: string;
  status: 'Generated' | 'Pending' | 'Revoked';
  generationMethod: 'Auto' | 'Manual (Single)' | 'Manual (Bulk Import)';
  eventId?: string;
}

const CertificateTable = ({ certificatesToShow, onCertificateUpdate }: { certificatesToShow: FrontendCertificate[], onCertificateUpdate: (certificateNumber: string, status: FrontendCertificate['status']) => void }) => {
    if (certificatesToShow.length === 0) {
        return <div className="text-center text-muted-foreground py-12">Bu görünümde gösterilecek sertifika yok.</div>
    }

    const getStatusVariant = (status: FrontendCertificate['status']) => {
        switch (status) {
            case 'Generated': return 'default';
            case 'Pending': return 'secondary';
            case 'Revoked': return 'destructive';
            default: return 'outline';
        }
    };

    const handleDownloadPdf = async (certificateId: string) => {
        try {
            const fileUrl = await certificatesService.generateCertificatePdf(certificateId);
            // Create a temporary link to download the PDF
            const link = document.createElement('a');
            link.href = fileUrl;
            link.target = '_blank';
            link.download = `certificate-${certificateId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            // Check if it's a 404 error (certificate not found)
            if (error.response?.status === 404) {
                alert('Sertifika bulunamadı. Bu sertifika henüz sisteme kaydedilmemiş olabilir.');
            } else {
                // In a real application, you would show an error message to the user
                alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };

    const handleRevokeCertificate = async (certificateId: string) => {
        // In a real application, you would call an API to revoke the certificate
        // For now, we'll just show an alert
        if (confirm('Bu sertifikayı iptal etmek istediğinizden emin misiniz?')) {
            try {
                // Here you would call the API to revoke the certificate
                // For example: await certificatesService.revokeCertificate(certificateId);
                alert('Sertifika başarıyla iptal edildi.');
                // Update the certificate status in the parent component
                onCertificateUpdate(certificateId, 'Revoked');
            } catch (error) {
                console.error('Error revoking certificate:', error);
                alert('Sertifika iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };

    return (
         <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Sertifika Adı</TableHead>
                        <TableHead>Alıcı Adı</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Veriliş Tarihi</TableHead>
                        <TableHead>Geçerlilik Tarihi</TableHead>
                        <TableHead><span className="sr-only">Eylemler</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {certificatesToShow.map(cert => (
                        <TableRow key={cert.id}>
                            <TableCell className="font-medium">
                                <div>{cert.certificateName}</div>
                                <div className="text-xs text-muted-foreground font-mono">{cert.id}</div>
                            </TableCell>
                            <TableCell>
                                <div>{cert.recipientName}</div>
                                <div className="text-xs text-muted-foreground">{cert.recipientEmail}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(cert.status)} className={cn(cert.status === 'Generated' && 'bg-green-600')}>{cert.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(cert.issuedAt).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell>{cert.validUntil ? new Date(cert.validUntil).toLocaleDateString('tr-TR') : 'Süresiz'}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Menüyü aç</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/admin/certificates/${cert.id}`}>Düzenle</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem><Copy className="mr-2 h-4 w-4"/>Doğrulama Linkini Kopyala</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDownloadPdf(cert.id)}>
                                            <FileDown className="mr-2 h-4 w-4"/>PDF Olarak İndir
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRevokeCertificate(cert.id)}>
                                            İptal Et
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <CardFooter className="pt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                        <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                        <PaginationItem><PaginationNext href="#" /></PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardFooter>
        </>
    )
}

export default function CertificatesDashboardPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [certificates, setCertificates] = useState<FrontendCertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch certificates from backend
    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                setLoading(true);
                const backendCertificates = await certificatesService.getAllCertificates();
                
                // Map backend certificates to frontend format
                const frontendCertificates: FrontendCertificate[] = backendCertificates.map(cert => ({
                    ...cert,
                    certificateNumber: cert.id,
                    recipientName: cert.userId ? `User ${cert.userId.substring(0, 8)}` : 'Kullanıcı Bilgisi Yok',
                    recipientEmail: 'user@example.com', // In a real app, you'd fetch user details
                    certificateName: cert.name || 'Sertifika Adı Belirtilmemiş',
                    issuedAt: cert.issueDate || new Date().toISOString(),
                    validUntil: cert.expiryDate || undefined,
                    templateId: 'default', // Default template since it's not in backend model
                    verificationUrl: `/certificates/verify/${cert.id}`,
                    status: 'Generated', // In a real app, this would come from the backend
                    generationMethod: 'Auto'
                }));
                
                setCertificates(frontendCertificates);
                setError(null);
            } catch (err) {
                console.error('Error fetching certificates:', err);
                setError('Sertifikalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    const filteredCertificates = certificates.filter(cert =>
        (cert.certificateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const generatedCerts = filteredCertificates.filter(c => c.status === 'Generated');
    const revokedCerts = filteredCertificates.filter(c => c.status === 'Revoked');
    const pendingCerts = filteredCertificates.filter(c => c.status === 'Pending');

    const handleCertificateUpdate = (certificateNumber: string, status: FrontendCertificate['status']) => {
        setCertificates(prev => prev.map(cert => 
            cert.certificateNumber === certificateNumber ? { ...cert, status } : cert
        ));
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-12">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sertifika Paneli</h1>
                    <p className="text-muted-foreground">Sertifikalarınıza genel bir bakış atın ve yönetin.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/certificates/bulk-import">
                            <FileUp className="mr-2 h-4 w-4" />
                            Toplu İçe Aktar
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/certificates/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Yeni Sertifika Oluştur
                        </Link>
                    </Button>
                </div>
            </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Sertifika</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{certificates.length}</div>
                        <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Geçerli Sertifikalar</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{generatedCerts.length}</div>
                         <p className="text-xs text-muted-foreground">Aktif ve geçerli</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">İptal Edilenler</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{revokedCerts.length}</div>
                         <p className="text-xs text-muted-foreground">Geçersiz kılınmış sertifikalar</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Beklemede Olanlar</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCerts.length}</div>
                         <p className="text-xs text-muted-foreground">Oluşturulmayı bekliyor</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <Tabs defaultValue="all">
                     <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                             <TabsList>
                                <TabsTrigger value="all">Tümü</TabsTrigger>
                                <TabsTrigger value="generated">Geçerli</TabsTrigger>
                                <TabsTrigger value="pending">Beklemede</TabsTrigger>
                                <TabsTrigger value="revoked">İptal Edilmiş</TabsTrigger>
                            </TabsList>
                            <div className="relative md:w-1/3">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Sertifika, alıcı veya ID ara..." 
                                    className="pl-8 w-full" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="all">
                           <CertificateTable certificatesToShow={filteredCertificates} onCertificateUpdate={handleCertificateUpdate} />
                        </TabsContent>
                        <TabsContent value="generated">
                           <CertificateTable certificatesToShow={generatedCerts} onCertificateUpdate={handleCertificateUpdate} />
                        </TabsContent>
                        <TabsContent value="pending">
                            <CertificateTable certificatesToShow={pendingCerts} onCertificateUpdate={handleCertificateUpdate} />
                        </TabsContent>
                        <TabsContent value="revoked">
                            <CertificateTable certificatesToShow={revokedCerts} onCertificateUpdate={handleCertificateUpdate} />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
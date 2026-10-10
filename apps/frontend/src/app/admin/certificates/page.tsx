'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, FileDown, Copy, Search, FileUp, Award, CheckCircle, XCircle, Clock, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import certificatesService from "@/lib/api/certificatesService";
import type { Certificate as BackendCertificate } from "@/lib/api/certificatesService";

// Get base URL for media files - use env variable for production support
function getMediaBaseUrl(): string {
    // NEXT_PUBLIC_API_URL ends with /api, we need to remove it for media URLs
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9006/api';
    return apiUrl.replace(/\/api\/?$/, '');
}

// Map backend certificate to frontend certificate type
interface FrontendCertificate {
    id: string;
    name: string;
    description: string | null;
    issueDate: string;
    expiryDate: string | null;
    fileUrl: string | null;
    userId: string | null;
    createdAt: string;
    updatedAt: string;
    templateId?: string | null;
    // V2 fields
    recipientName: string | null;
    recipientEmail: string | null;
    trainingTitle: string | null;
    status: 'draft' | 'issued' | 'sent' | 'revoked';
    pdfUrl: string | null;
    // Frontend specific properties
    certificateNumber: string;
    certificateName: string;
    issuedAt: string;
    validUntil?: string;
    verificationUrl: string;
    displayStatus: 'Generated' | 'Pending' | 'Revoked' | 'Draft' | 'Issued' | 'Sent';
    generationMethod: 'Auto' | 'Manual (Single)' | 'Manual (Bulk Import)';
    eventId?: string | null;
}

const CertificateTable = ({ certificatesToShow, onCertificateUpdate, onCertificateDelete }: {
    certificatesToShow: FrontendCertificate[],
    onCertificateUpdate: (certificateId: string, status: FrontendCertificate['displayStatus']) => void,
    onCertificateDelete: (certificateId: string) => void
}) => {
    const { toast } = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState<FrontendCertificate | null>(null);

    if (certificatesToShow.length === 0) {
        return <div className="text-center text-muted-foreground py-12">Bu görünümde gösterilecek sertifika yok.</div>
    }

    const getStatusVariant = (status: FrontendCertificate['displayStatus']) => {
        switch (status) {
            case 'Generated':
            case 'Issued':
            case 'Sent':
                return 'default';
            case 'Pending':
            case 'Draft':
                return 'secondary';
            case 'Revoked':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const handleDownloadPdf = async (certificate: FrontendCertificate) => {
        try {
            // If PDF already exists, download it directly
            if (certificate.pdfUrl) {
                const link = document.createElement('a');
                link.href = `${getMediaBaseUrl()}${certificate.pdfUrl}`;
                link.target = '_blank';
                link.download = `certificate-${certificate.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Generate new PDF
                const result = await certificatesService.generatePdf(certificate.id);
                const link = document.createElement('a');
                link.href = `${getMediaBaseUrl()}${result.pdfUrl}`;
                link.target = '_blank';
                link.download = `certificate-${certificate.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            toast({
                title: "Başarılı",
                description: "PDF başarıyla indirildi.",
            });
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: error.response?.status === 404
                    ? 'Sertifika bulunamadı. Bu sertifika henüz sisteme kaydedilmemiş olabilir.'
                    : 'PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
            });
        }
    };

    const confirmDelete = (certificate: FrontendCertificate) => {
        setSelectedCertificate(certificate);
        setDeleteDialogOpen(true);
    };

    const handleDeleteCertificate = async () => {
        if (!selectedCertificate) return;

        try {
            await certificatesService.delete(selectedCertificate.id);
            toast({
                title: "Başarılı",
                description: "Sertifika başarıyla silindi.",
            });
            onCertificateDelete(selectedCertificate.id);
            setDeleteDialogOpen(false);
            setSelectedCertificate(null);
        } catch (error) {
            console.error('Error deleting certificate:', error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Sertifika silinirken bir hata oluştu. Lütfen tekrar deneyin.",
            });
        }
    };

    const confirmRevoke = (certificate: FrontendCertificate) => {
        setSelectedCertificate(certificate);
        setRevokeDialogOpen(true);
    };

    const handleRevokeCertificate = async () => {
        if (!selectedCertificate) return;

        try {
            await certificatesService.update(selectedCertificate.id, { status: 'revoked' });
            toast({
                title: "Başarılı",
                description: "Sertifika başarıyla iptal edildi.",
            });
            onCertificateUpdate(selectedCertificate.id, 'Revoked');
            setRevokeDialogOpen(false);
            setSelectedCertificate(null);
        } catch (error) {
            console.error('Error revoking certificate:', error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Sertifika iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.",
            });
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
                                <Badge variant={getStatusVariant(cert.displayStatus)} className={cn(cert.displayStatus === 'Generated' && 'bg-green-600')}>{cert.displayStatus}</Badge>
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
                                        <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Doğrulama Linkini Kopyala</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDownloadPdf(cert)}>
                                            <FileDown className="mr-2 h-4 w-4" />PDF Olarak İndir
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-orange-600 focus:text-orange-600" onClick={() => confirmRevoke(cert)}>
                                            İptal Et
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirmDelete(cert)}>
                                            <XCircle className="mr-2 h-4 w-4" />Sil
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Sertifikayı Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-semibold">{selectedCertificate?.certificateName}</span> isimli sertifikayı silmek istediğinizden emin misiniz?
                            <br /><br />
                            <span className="text-destructive font-medium">Bu işlem geri alınamaz.</span> Sertifika kalıcı olarak silinecek ve alıcı artık bu sertifikayı doğrulayamayacak.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setDeleteDialogOpen(false);
                            setSelectedCertificate(null);
                        }}>
                            İptal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCertificate}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Revoke Confirmation Dialog */}
            <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Sertifikayı İptal Et
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-semibold">{selectedCertificate?.certificateName}</span> isimli sertifikayı iptal etmek istediğinizden emin misiniz?
                            <br /><br />
                            Sertifika iptal edildiğinde alıcı tarafından artık geçerli olmayacaktır. İptal edilen sertifikalar daha sonra tekrar aktif hale getirilebilir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setRevokeDialogOpen(false);
                            setSelectedCertificate(null);
                        }}>
                            İptal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevokeCertificate}
                            className="bg-orange-600 text-white hover:bg-orange-700"
                        >
                            İptal Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                const backendCertificates = await certificatesService.getAll();

                // Map backend certificates to frontend format
                const frontendCertificates: FrontendCertificate[] = backendCertificates.map(cert => {
                    // Map backend status to display status
                    const getDisplayStatus = (status: string): FrontendCertificate['displayStatus'] => {
                        switch (status) {
                            case 'issued': return 'Issued';
                            case 'sent': return 'Sent';
                            case 'revoked': return 'Revoked';
                            case 'draft': return 'Draft';
                            default: return 'Draft';
                        }
                    };

                    return {
                        ...cert,
                        certificateNumber: cert.id,
                        recipientName: cert.recipientName || 'Kullanıcı Bilgisi Yok',
                        recipientEmail: cert.recipientEmail || 'Email Bilgisi Yok',
                        certificateName: cert.trainingTitle || cert.name || 'Sertifika Adı Belirtilmemiş',
                        trainingTitle: cert.trainingTitle || cert.name || 'Sertifika Adı Belirtilmemiş',
                        issuedAt: cert.issuedAt || cert.issueDate || new Date().toISOString(),
                        validUntil: cert.validUntil || cert.expiryDate || undefined,
                        verificationUrl: `/certificates/verify/${cert.id}`,
                        displayStatus: getDisplayStatus(cert.status),
                        status: cert.status,
                        generationMethod: 'Manual (Single)'
                    };
                });

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
        (cert.recipientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const generatedCerts = filteredCertificates.filter(c => c.displayStatus === 'Issued' || c.displayStatus === 'Sent' || c.displayStatus === 'Generated');
    const revokedCerts = filteredCertificates.filter(c => c.displayStatus === 'Revoked');
    const pendingCerts = filteredCertificates.filter(c => c.displayStatus === 'Pending' || c.displayStatus === 'Draft');

    const handleCertificateUpdate = (certificateId: string, status: FrontendCertificate['displayStatus']) => {
        setCertificates(prev => prev.map(cert =>
            cert.id === certificateId ? { ...cert, displayStatus: status } : cert
        ));
    };

    const handleCertificateDelete = (certificateId: string) => {
        setCertificates(prev => prev.filter(cert => cert.id !== certificateId));
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
                    <Button asChild variant="ghost">
                        <Link href="/admin/certificates/templates">
                            <FileText className="mr-2 h-4 w-4" />
                            Template'ler
                        </Link>
                    </Button>
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
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{certificates.length}</div>
                        <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Geçerli Sertifikalar</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{generatedCerts.length}</div>
                        <p className="text-xs text-muted-foreground">Aktif ve geçerli</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">İptal Edilenler</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{revokedCerts.length}</div>
                        <p className="text-xs text-muted-foreground">Geçersiz kılınmış sertifikalar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Beklemede Olanlar</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
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
                            <CertificateTable certificatesToShow={filteredCertificates} onCertificateUpdate={handleCertificateUpdate} onCertificateDelete={handleCertificateDelete} />
                        </TabsContent>
                        <TabsContent value="generated">
                            <CertificateTable certificatesToShow={generatedCerts} onCertificateUpdate={handleCertificateUpdate} onCertificateDelete={handleCertificateDelete} />
                        </TabsContent>
                        <TabsContent value="pending">
                            <CertificateTable certificatesToShow={pendingCerts} onCertificateUpdate={handleCertificateUpdate} onCertificateDelete={handleCertificateDelete} />
                        </TabsContent>
                        <TabsContent value="revoked">
                            <CertificateTable certificatesToShow={revokedCerts} onCertificateUpdate={handleCertificateUpdate} onCertificateDelete={handleCertificateDelete} />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    );
}
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

import { BccEditorialWrapper } from "@/components/brand/BccEditorialWrapper";
import { useParams } from "next/navigation";

export default function CertificatesDashboardPage() {
    const params = useParams();
    const tenant = params?.tenant as string || 'default';
    const [searchTerm, setSearchTerm] = useState('');
    const [certificates, setCertificates] = useState<FrontendCertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const backendCerts = await certificatesService.getAllCertificates();

                // Map to frontend format
                const mappedCerts: FrontendCertificate[] = backendCerts.map(cert => ({
                    ...cert,
                    certificateNumber: cert.id.slice(0, 8).toUpperCase(),
                    certificateName: cert.name || cert.trainingTitle || 'Untitled Certificate',
                    issuedAt: cert.issuedAt || cert.issueDate,
                    validUntil: cert.validUntil || undefined,
                    displayStatus: (cert.status.charAt(0).toUpperCase() + cert.status.slice(1)) as FrontendCertificate['displayStatus'],
                    generationMethod: 'Auto',
                    verificationUrl: `/${tenant}/verify/${cert.id}`
                }));

                setCertificates(mappedCerts);
                setError(null);
            } catch (err) {
                console.error('Error fetching certificates:', err);
                setError('SYSTEX_SYNC_FAILURE');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenant]);

    const handleCertificateUpdate = (id: string, status: FrontendCertificate['displayStatus']) => {
        setCertificates(prev => prev.map(c => c.id === id ? { ...c, displayStatus: status } : c));
    };

    const handleCertificateDelete = (id: string) => {
        setCertificates(prev => prev.filter(c => c.id !== id));
    };

    const filteredCertificates = certificates.filter(cert =>
        cert.certificateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generatedCerts = filteredCertificates.filter(c => c.displayStatus === 'Generated' || c.displayStatus === 'Issued' || c.displayStatus === 'Sent');
    const pendingCerts = filteredCertificates.filter(c => c.displayStatus === 'Pending' || c.displayStatus === 'Draft');
    const revokedCerts = filteredCertificates.filter(c => c.displayStatus === 'Revoked');

    if (loading) {
        return (
            <BccEditorialWrapper
                headerTitle="Credential_Registry"
                headerBadge="Probe"
                telemetryData={[
                    { label: "INDEX_SYNC", value: "INITIALIZING" },
                    { label: "MAPPING_SEARCH", value: "PENDING" },
                ]}
            >
                <div className="flex items-center justify-center py-32">
                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] animate-pulse">Mapping Nodal Credentials...</div>
                </div>
            </BccEditorialWrapper>
        );
    }

    if (error) {
        return (
            <BccEditorialWrapper
                headerTitle="Registry_Error"
                headerBadge="Critical"
            >
                <div className="text-center text-red-500/60 font-mono py-32 uppercase tracking-widest text-[10px]">{error}</div>
            </BccEditorialWrapper>
        );
    }

    return (
        <BccEditorialWrapper
            headerTitle="Trust_Infrastructure"
            headerSubtitle="Credential authority and validation nodes."
            headerBadge="Registry"
            telemetryData={[
                { label: "TOTAL_NODES", value: certificates.length.toString() },
                { label: "STABILITY", value: "OPTIMAL" },
                { label: "REGISTRY_LOCKED", value: "TRUE" },
                { label: "TRUST_INDEX", value: "99.9%" }
            ]}
        >
            <div className="space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.02] border border-white/5 p-6 backdrop-blur-md gap-6">
                    <div className="space-y-1">
                        <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Registry_Controls</h2>
                        <p className="text-[11px] text-white/60 uppercase tracking-widest font-bold">Credential State Management</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" className="rounded-none border-white/10 text-white/60 hover:bg-white/5 text-[9px] tracking-[0.2em] uppercase h-10 px-6">
                            <Link href={`/${tenant}/admin/certificates/templates`}>
                                <FileText className="mr-2 h-3.5 w-3.5" />
                                PROTOCOLS
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-none border-white/10 text-white/60 hover:bg-white/5 text-[9px] tracking-[0.2em] uppercase h-10 px-6">
                            <Link href={`/${tenant}/admin/certificates/bulk-import`}>
                                <FileUp className="mr-2 h-3.5 w-3.5" />
                                BULK_INIT
                            </Link>
                        </Button>
                        <Button asChild className="rounded-none bg-[#9df425] text-black hover:bg-[#86d11f] text-[9px] tracking-[0.2em] uppercase h-10 px-6 font-bold shadow-lg shadow-[#9df425]/10">
                            <Link href={`/${tenant}/admin/certificates/new`}>
                                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                                INITIALIZE_NODE
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: "Total_Metadata", value: certificates.length, icon: Award, color: "text-white" },
                        { label: "Active_Resonance", value: generatedCerts.length, icon: CheckCircle, color: "text-[#9df425]" },
                        { label: "Purged_Entropy", value: revokedCerts.length, icon: XCircle, color: "text-red-500" },
                        { label: "Pending_Coupling", value: pendingCerts.length, icon: Clock, color: "text-[#ff8c00]" }
                    ].map((stat, i) => (
                        <Card key={i} className="rounded-none bg-white/[0.02] border border-white/5 p-5 group hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">{stat.label}</span>
                                <stat.icon className={cn("h-4 w-4", stat.color)} />
                            </div>
                            <div className="text-2xl font-light text-white tabular-nums tracking-tighter">{stat.value}</div>
                        </Card>
                    ))}
                </div>

                <Card className="rounded-none bg-white/[0.01] border border-white/5 overflow-hidden">
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex flex-col md:flex-row justify-between items-center bg-white/[0.02] border-b border-white/5 p-4 gap-6">
                            <TabsList className="bg-transparent h-10 p-0 gap-2">
                                {[
                                    { value: "all", label: "ALL_NODES" },
                                    { value: "generated", label: "STABLE" },
                                    { value: "pending", label: "DRAFT_STATE" },
                                    { value: "revoked", label: "PURGED" }
                                ].map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="rounded-none bg-transparent border border-transparent data-[state=active]:border-white/20 data-[state=active]:bg-white/5 text-[9px] uppercase tracking-widest font-bold text-white/40 data-[state=active]:text-white transition-all h-full px-6"
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="relative w-full md:w-80 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within:text-[#9df425] transition-colors" />
                                <Input
                                    placeholder="SEARCH_REGISTRY..."
                                    className="h-10 rounded-none bg-white/5 border-white/10 pl-10 text-[10px] font-mono uppercase tracking-widest focus-visible:ring-[#9df425]/40"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-0">
                            {[
                                { value: "all", data: filteredCertificates },
                                { value: "generated", data: generatedCerts },
                                { value: "pending", data: pendingCerts },
                                { value: "revoked", data: revokedCerts }
                            ].map(content => (
                                <TabsContent key={content.value} value={content.value} className="m-0 border-none outline-none">
                                    <CertificateTable
                                        certificatesToShow={content.data}
                                        onCertificateUpdate={handleCertificateUpdate}
                                        onCertificateDelete={handleCertificateDelete}
                                    />
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </Card>
            </div>
        </BccEditorialWrapper>
    );
}
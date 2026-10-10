'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Save, FileText, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import certificatesService from "@/lib/api/certificatesService";
import type { Certificate } from "@/lib/types";

type CertificateFormProps = {
    certificate?: Certificate;
};

export function CertificateForm({ certificate }: CertificateFormProps) {
    const isEditing = !!certificate;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [issuedAt, setIssuedAt] = useState<Date | undefined>(certificate ? new Date(certificate.issueDate) : new Date());
    const [validUntil, setValidUntil] = useState<Date | undefined>(certificate?.expiryDate ? new Date(certificate.expiryDate) : undefined);

    const [recipientName, setRecipientName] = useState(certificate?.name || '');
    const [recipientEmail, setRecipientEmail] = useState(''); // We'll need to fetch user by email
    const [certificateName, setCertificateName] = useState(certificate?.name || '');
    const [description, setDescription] = useState(certificate?.description || '');
    const [templateId, setTemplateId] = useState(certificate?.templateId || 'default');
    const [userId, setUserId] = useState(certificate?.userId || '');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setRecipientName(searchParams.get('userName') || '');
            setRecipientEmail(searchParams.get('userEmail') || '');
            setCertificateName(searchParams.get('certificateName') || '');
        }
    }, [searchParams, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        
        try {
            // In a real application, you would look up the user by email
            // For now, we'll use a placeholder user ID
            const userIdToUse = userId || '00000000-0000-0000-0000-000000000000'; // Placeholder
            
            const certificateData = {
                name: certificateName,
                description,
                issueDate: issuedAt?.toISOString() || new Date().toISOString(),
                expiryDate: validUntil?.toISOString() || undefined,
                userId: userIdToUse,
                templateId
            };
            
            if (isEditing && certificate) {
                // Update existing certificate
                await certificatesService.updateCertificate(certificate.id, certificateData);
            } else {
                // Create new certificate
                await certificatesService.createCertificate(certificateData);
            }
            
            setSuccess(true);
            // Redirect to certificates list after a short delay
            setTimeout(() => {
                router.push('/admin/certificates');
            }, 1500);
        } catch (err) {
            console.error('Error saving certificate:', err);
            setError('Sertifika kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="max-w-4xl mx-auto" onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Sertifikayı Düzenle' : 'Yeni Sertifika Oluştur'}</CardTitle>
                    <CardDescription>
                        {isEditing ? 'Sertifika detaylarını güncelleyin.' : 'Yeni bir katılımcı için sertifika oluşturun.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hata</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {success && (
                        <Alert variant="default" className="border-green-500 text-green-700">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Başarılı</AlertTitle>
                            <AlertDescription>Sertifika başarıyla kaydedildi. Yönlendiriliyorsunuz...</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="recipientName">Alıcı Adı Soyadı</Label>
                            <Input 
                                id="recipientName" 
                                placeholder="Ahmet Yılmaz" 
                                value={recipientName} 
                                onChange={(e) => setRecipientName(e.target.value)} 
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recipientEmail">Alıcı E-posta</Label>
                            <Input 
                                id="recipientEmail" 
                                type="email" 
                                placeholder="ahmet.yilmaz@example.com" 
                                value={recipientEmail} 
                                onChange={(e) => setRecipientEmail(e.target.value)} 
                                required
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="certificateName">Sertifika / Eğitim Adı</Label>
                        <Input 
                            id="certificateName" 
                            placeholder="Allplan Temel Eğitimi" 
                            value={certificateName} 
                            onChange={(e) => setCertificateName(e.target.value)} 
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                        <Textarea 
                            id="description" 
                            placeholder="Sertifika hakkında ek bilgiler..." 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template">Sertifika Tasarımı</Label>
                        <Select value={templateId} onValueChange={setTemplateId}>
                            <SelectTrigger id="template">
                                <SelectValue placeholder="Bir tasarım seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Standart Tasarım</SelectItem>
                                <SelectItem value="premium">Premium Tasarım</SelectItem>
                                <SelectItem value="executive">Yönetici Tasarımı</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Oluşturulma Tarihi</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {issuedAt ? format(issuedAt, "PPP") : <span>Bir tarih seçin</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={issuedAt}
                                        onSelect={setIssuedAt}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Geçerlilik Tarihi (Opsiyonel)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {validUntil ? format(validUntil, "PPP") : <span>Süresiz</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={validUntil}
                                        onSelect={setValidUntil}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    
                    {!isEditing && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Bilgi</AlertTitle>
                            <AlertDescription>
                                Sertifika oluşturulduktan sonra alıcıya e-posta ile gönderilecektir. 
                                Ayrıca sertifikayı PDF olarak indirebilirsiniz.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" asChild type="button">
                        <Link href="/admin/certificates">İptal</Link>
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <FileText className="mr-2 h-4 w-4 animate-spin" />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? 'Sertifikayı Güncelle' : 'Sertifikayı Oluştur'}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
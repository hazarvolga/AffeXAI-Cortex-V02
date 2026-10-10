
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Share2, Award, CheckCircle, Clock, XCircle, Download } from "lucide-react";
import Link from "next/link";
import { certificates } from "@/lib/certificate-data";
import { Badge } from "@/components/ui/badge";

const UserCertificatesPage = () => {
    // In a real app, you would filter these by the logged-in user's ID
    const userCertificates = certificates.filter(c => c.recipientEmail === 'ahmet.yilmaz@example.com');

    const getStatus = (cert: typeof certificates[0]) => {
        if (cert.status === 'Revoked') {
            return { text: "İptal Edildi", variant: "destructive" as const };
        }
        if (cert.validUntil) {
            const expiry = new Date(cert.validUntil);
            if (new Date() > expiry) return { text: "Süresi Dolmuş", variant: "destructive" as const };
        }
        return { text: "Geçerli", variant: "default" as const };
    };

    return (
        <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sertifikalarım</h2>
                    <p className="text-muted-foreground">
                        Kazandığınız tüm sertifikaları burada görüntüleyebilir ve yönetebilirsiniz.
                    </p>
                </div>
            </div>

            <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {userCertificates.length > 0 ? userCertificates.map(cert => {
                     const status = getStatus(cert);
                    return (
                    <Card key={cert.certificateNumber} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <Award className="h-8 w-8 text-primary" />
                                <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-green-600' : ''}>{status.text}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardTitle className="mb-2">{cert.certificateName}</CardTitle>
                            <CardDescription>Sertifika No: {cert.certificateNumber}</CardDescription>
                            <p className="text-sm text-muted-foreground mt-2">
                                Veriliş Tarihi: {new Date(cert.issuedAt).toLocaleDateString('tr-TR')}
                            </p>
                            {cert.validUntil && (
                                 <p className="text-sm text-muted-foreground">
                                    Geçerlilik Tarihi: {new Date(cert.validUntil).toLocaleDateString('tr-TR')}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="grid grid-cols-2 gap-2">
                            <Button variant="outline"><Download className="mr-2 h-4 w-4"/> PDF İndir</Button>
                            <Button><Share2 className="mr-2 h-4 w-4"/> Paylaş</Button>
                        </CardFooter>
                    </Card>
                )}) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">Henüz kazanılmış bir sertifikanız bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserCertificatesPage;

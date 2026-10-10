
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyRound, Download, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

const licenses = [
    {
        product: "Allplan Professional",
        licenseKey: "XXXX-XXXX-XXXX-1234",
        type: "Yıllık Abonelik",
        expiresAt: "2025-08-01T00:00:00.000Z",
        status: "active",
    },
    {
        product: "Allplan Bridge",
        licenseKey: "XXXX-XXXX-XXXX-5678",
        type: "Kalıcı Lisans",
        expiresAt: null,
        status: "active",
    },
    {
        product: "Bimplus Professional",
        licenseKey: "XXXX-XXXX-XXXX-9101",
        type: "Aylık Abonelik",
        expiresAt: "2024-07-20T00:00:00.000Z",
        status: "expired",
    }
];

export default function LicensesPage() {
    return (
        <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Lisanslarım</h2>
                    <p className="text-muted-foreground">
                        Satın aldığınız tüm lisansları ve abonelikleri burada yönetin.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/portal/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Geri Dön
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Aktif Lisanslar ve Abonelikler</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ürün</TableHead>
                                <TableHead>Lisans Tipi</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Bitiş Tarihi</TableHead>
                                <TableHead className="text-right">Eylemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {licenses.map((license) => (
                                <TableRow key={license.licenseKey}>
                                    <TableCell className="font-medium">{license.product}</TableCell>
                                    <TableCell>{license.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={license.status === 'active' ? 'default' : 'destructive'} className={license.status === 'active' ? 'bg-green-600' : ''}>
                                            {license.status === 'active' ? 'Aktif' : 'Süresi Dolmuş'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('tr-TR') : 'Süresiz'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            Anahtarı Göster
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { educationData } from "@/lib/education-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export default function DownloadsPage() {
    const downloads = educationData.content.downloads;
    const documents = educationData.content.documents;

    const allDownloads = [...downloads, ...documents];

    return (
        <div className="flex-1 space-y-8">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İndirmelerim</h2>
                    <p className="text-muted-foreground">
                        Erişiminiz olan tüm dökümanlar ve dosyalar.
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
                 <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dosya Adı</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">İndir</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allDownloads.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={item.ctaLink}>
                                                <Download className="mr-2 h-4 w-4"/> İndir
                                            </Link>
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

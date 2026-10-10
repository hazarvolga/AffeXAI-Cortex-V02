
'use client';

import { CardFooter, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LayoutTemplate, Eye, Pen, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { templates as emailTemplates } from "@/lib/newsletter-data";
import Link from "next/link";

export default function TemplatesSection() {
     if (emailTemplates.length === 0) {
        return (
            <>
                <div className="text-center text-muted-foreground py-12">
                    <LayoutTemplate className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold">Henüz Şablon Oluşturulmadı</h3>
                    <p className="mt-1">"Yeni Şablon Oluştur" butonuna tıklayarak ilk e-posta şablonunuzu tasarlamaya başlayın.</p>
                </div>
                <CardFooter className="pt-6 border-t bg-muted/50 justify-center">
                    <p className="text-xs text-muted-foreground">
                        Gelecekte burada sürükle-bırak bir şablon editörü yer alacak.
                    </p>
                </CardFooter>
            </>
        )
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">Önizleme</TableHead>
                        <TableHead>Şablon Adı</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Oluşturulma Tarihi</TableHead>
                        <TableHead className="text-right">Eylemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {emailTemplates.map(template => (
                       <TableRow key={template.id}>
                            <TableCell>
                                <Image 
                                    src={template.thumbnailUrl} 
                                    alt={template.name}
                                    width={120}
                                    height={90}
                                    className="rounded-md border aspect-[4/3] object-cover"
                                />
                            </TableCell>
                            <TableCell className="font-semibold">{template.name}</TableCell>
                            <TableCell className="text-muted-foreground">{template.description}</TableCell>
                            <TableCell>{new Date(template.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" className="mr-2" asChild>
                                    <Link href={`/admin/email-marketing/templates/${template.id}/preview`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4"/> Önizle
                                    </Link>
                                </Button>
                                <Button variant="secondary" size="sm" asChild>
                                    <Link href={`/admin/email-marketing/templates/${template.id}/edit`}>
                                        <Pen className="mr-2 h-4 w-4"/> Düzenle
                                    </Link>
                                </Button>
                            </TableCell>
                       </TableRow>
                   ))}
                </TableBody>
            </Table>
            <CardFooter className="pt-6 border-t bg-muted/50 justify-between items-center">
                 <p className="text-xs text-muted-foreground">
                    Şablonlar React Email kullanılarak <code>src/emails</code> klasöründe yönetilir.
                </p>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4"/> Yeni Şablon Oluştur
                </Button>
            </CardFooter>
        </>
    )
}

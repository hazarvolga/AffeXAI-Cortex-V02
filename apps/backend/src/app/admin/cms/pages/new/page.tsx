
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import Link from "next/link";

export default function NewCmsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Sayfa Oluştur</h1>
          <p className="text-muted-foreground">Yeni bir sayfanın içeriğini ve SEO ayarlarını yapılandırın.</p>
        </div>
      </div>
      
       <form className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Sayfa İçeriği</CardTitle>
                        <CardDescription>
                            Bu alan şu an için sadece bir konsepttir. Gerçek bir CMS'de burada zengin bir metin editörü (Rich Text Editor) bulunacaktır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Textarea 
                            className="min-h-[400px]"
                            placeholder="Yeni sayfanızın içeriğini buraya yazın..."
                        />
                    </CardContent>
                </Card>
            </div>
             <div className="lg:col-span-1 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Yayınlama</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label>Sayfa Başlığı</Label>
                             <Input placeholder="Örn: Hakkımızda" />
                        </div>
                        <div className="space-y-2">
                            <Label>Durum</Label>
                            <Select defaultValue="draft">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="published">Yayınlandı</SelectItem>
                                    <SelectItem value="draft">Taslak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                     <CardFooter className="flex justify-between">
                        <Button variant="outline" asChild><Link href="/admin/cms/pages">İptal</Link></Button>
                        <Button><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                    </CardFooter>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>SEO Ayarları</CardTitle>
                        <CardDescription>Arama motoru optimizasyonu için meta başlık ve açıklamayı düzenleyin.</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="seo-title">SEO Başlığı</Label>
                            <Input id="seo-title" placeholder="Sayfanızın SEO başlığı"/>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="seo-description">SEO Açıklaması</Label>
                            <Textarea id="seo-description" placeholder="Sayfanızın SEO açıklaması" className="min-h-[100px]"/>
                        </div>
                     </CardContent>
                 </Card>
            </div>
        </form>
    </div>
  );
}

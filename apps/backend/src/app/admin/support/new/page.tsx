
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import Link from 'next/link';

export default function AdminNewSupportTicketPage() {
  return (
    <div className="flex-1 space-y-8">
      <Card>
        <form>
          <CardHeader>
            <CardTitle>Yeni Destek Talebi Oluştur</CardTitle>
            <CardDescription>
              Bir kullanıcı adına manuel olarak yeni bir destek talebi oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-email">Kullanıcı E-posta Adresi</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="kullanici@example.com"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Konu</Label>
              <Input
                id="subject"
                placeholder="Örn: Lisans anahtarı çalışmıyor"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Bir kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Teknik Sorun</SelectItem>
                    <SelectItem value="billing">Faturalama</SelectItem>
                    <SelectItem value="general">Genel Soru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select defaultValue="Medium">
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Düşük</SelectItem>
                    <SelectItem value="Medium">Orta</SelectItem>
                    <SelectItem value="High">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Yaşanan sorunu detaylı bir şekilde anlatın..."
                className="min-h-[180px]"
              />
            </div>
             <div>
                <Label>Ekler</Label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                    <div className="text-center">
                    <Paperclip className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                        >
                        <span>Dosyalarınızı yükleyin</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                        </label>
                        <p className="pl-1">veya sürükleyip bırakın</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF, PDF, vb. en fazla 10MB</p>
                    </div>
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" asChild>
                <Link href="/admin/support">İptal</Link>
            </Button>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" /> Talebi Oluştur
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

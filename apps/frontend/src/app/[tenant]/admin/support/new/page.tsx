'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
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
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminNewSupportTicketPage() {
  const params = useParams();
  const tenant = params?.tenant as string || 'default';
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCustomField = () => {
    const key = prompt('Alan adı:');
    if (key && !customFields[key]) {
      setCustomFields({ ...customFields, [key]: '' });
    }
  };

  const updateCustomField = (key: string, value: string) => {
    setCustomFields({ ...customFields, [key]: value });
  };

  const removeCustomField = (key: string) => {
    const { [key]: _, ...rest } = customFields;
    setCustomFields(rest);
  };

  return (
    <BccEditorialWrapper
      headerTitle="YENİ DESTEK TALEBİ"
      headerSubtitle="Bir kullanıcı adına manuel olarak yeni bir destek talebi oluşturun."
      headerBadge="ACTION"
    >
      <div className="max-w-4xl mx-auto py-8">
        <Card className="bg-white/[0.02] border-white/5 rounded-none">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-[#9df425]">Signal_Composition</CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest text-white/40">Initialize new support transmission</CardDescription>
          </CardHeader>
          <form className="space-y-6">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="user-email" className="text-[10px] uppercase tracking-widest text-white/60">Kullanıcı E-posta Adresi</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="kullanici@example.com"
                  className="bg-black/40 border-white/10 rounded-none focus:border-[#9df425] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[10px] uppercase tracking-widest text-white/60">Konu</Label>
                <Input
                  id="subject"
                  placeholder="Örn: Lisans anahtarı çalışmıyor"
                  className="bg-black/40 border-white/10 rounded-none focus:border-[#9df425] transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-[10px] uppercase tracking-widest text-white/60">Kategori</Label>
                  <Select>
                    <SelectTrigger id="category" className="bg-black/40 border-white/10 rounded-none focus:ring-0 focus:border-[#9df425]">
                      <SelectValue placeholder="Bir kategori seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 rounded-none">
                      <SelectItem value="technical">Teknik Sorun</SelectItem>
                      <SelectItem value="billing">Faturalama</SelectItem>
                      <SelectItem value="general">Genel Soru</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-[10px] uppercase tracking-widest text-white/60">Öncelik</Label>
                  <Select defaultValue="Medium">
                    <SelectTrigger id="priority" className="bg-black/40 border-white/10 rounded-none focus:ring-0 focus:border-[#9df425]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 rounded-none">
                      <SelectItem value="Low">Düşük</SelectItem>
                      <SelectItem value="Medium">Orta</SelectItem>
                      <SelectItem value="High">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] uppercase tracking-widest text-white/60">Açıklama</Label>
                <Textarea
                  id="description"
                  placeholder="Yaşanan sorunu detaylı bir şekilde anlatın..."
                  className="min-h-[180px] bg-black/40 border-white/10 rounded-none focus:border-[#9df425] transition-colors"
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-[10px] uppercase tracking-widest text-white/60">Etiketler</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Etiket ekle ve Enter'a bas"
                    className="bg-black/40 border-white/10 rounded-none focus:border-[#9df425] transition-colors"
                  />
                  <Button type="button" onClick={addTag} size="icon" variant="outline" className="rounded-none border-white/10 hover:bg-[#9df425]/10 hover:text-[#9df425]">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-[#9df425]/10 text-[#9df425] border-[#9df425]/20 rounded-none px-2 py-1 text-[9px] uppercase tracking-widest">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:bg-destructive/20 rounded-full"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-white/60">Özel Alanlar</Label>
                  <Button type="button" onClick={addCustomField} size="sm" variant="outline" className="rounded-none border-white/10 text-[9px] uppercase tracking-widest">
                    <Plus className="mr-2 h-3 w-3" />
                    Alan Ekle
                  </Button>
                </div>
                {Object.keys(customFields).length > 0 && (
                  <div className="space-y-3">
                    {Object.entries(customFields).map(([key, value]) => (
                      <div key={key} className="flex gap-2 items-start bg-white/[0.01] p-3 border border-white/5">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[9px] font-mono uppercase text-white/40">{key}</Label>
                          <Input
                            value={value}
                            onChange={(e) => updateCustomField(key, e.target.value)}
                            placeholder={`${key} değerini girin`}
                            className="bg-black/40 border-white/10 rounded-none focus:border-[#9df425] transition-colors h-8 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeCustomField(key)}
                          size="icon"
                          variant="ghost"
                          className="mt-5 h-8 w-8 hover:text-red-500 rounded-none"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-white/60">Ekler</Label>
                <div className="mt-2 flex justify-center rounded-none border border-dashed border-white/10 bg-white/[0.01] px-6 py-10 hover:bg-white/[0.02] transition-all">
                  <div className="text-center">
                    <Paperclip className="mx-auto h-8 w-8 text-white/10" aria-hidden="true" />
                    <div className="mt-4 flex text-xs leading-6 text-white/40">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer font-mono text-[#9df425] hover:opacity-80"
                      >
                        <span>Dosyalarınızı yükleyin</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                      </label>
                      <p className="pl-1">veya sürükleyip bırakın</p>
                    </div>
                    <p className="text-[9px] uppercase tracking-widest text-white/20">PNG, JPG, PDF (MAX 10MB)</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-white/5 pt-6">
              <Button variant="outline" asChild className="rounded-none border-white/10 text-[10px] uppercase tracking-widest">
                <Link href={`/${tenant}/admin/support`}>İptal</Link>
              </Button>
              <Button type="submit" className="rounded-none bg-[#9df425] text-black hover:bg-[#9df425]/90 text-[10px] uppercase tracking-widest font-bold px-6">
                <Send className="mr-2 h-3.5 w-3.5" /> Talebi Oluştur
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </BccEditorialWrapper>
  );
}

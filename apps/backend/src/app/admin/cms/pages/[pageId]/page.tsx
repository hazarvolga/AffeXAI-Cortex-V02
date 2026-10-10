
'use client';

import { notFound, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pages, CmsPage } from "@/lib/cms-data";
import { Save, Bot, Sparkles } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialMediaManager } from "@/components/admin/social-media/social-media-manager";
import { use } from "react";

// Helper function to create a URL-friendly slug
const slugify = (text: string) => {
  if (!text) return '';
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}


const GooglePreview = ({ title, slug, description }: { title: string, slug: string, description: string }) => {
    const siteUrl = "https://www.aluplan.com.tr";
    const displayUrl = `${siteUrl}${slug === '/' ? '' : slug}`;

    return (
        <div className="p-4 rounded-lg">
            <p className="text-sm text-gray-800 truncate">{displayUrl}</p>
            <h3 className="text-blue-600 text-xl font-medium truncate group-hover:underline">{title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
    )
}


export default function EditCmsPage({ params }: { params: Promise<{ pageId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { pageId } = unwrappedParams;
  
  const [page, setPage] = useState<CmsPage | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const hasFetchedPage = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedPage.current) return;
    hasFetchedPage.current = true;
    
    const fetchPage = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch the page data from an API
        // For now, we're using mock data
        const pageData = pages.find(p => p.id === pageId);
        if (!pageData) {
          notFound();
          return;
        }
        setPage(pageData);
        // Format date on client-side to avoid hydration mismatch
        setFormattedDate(new Date(pageData.lastUpdated).toLocaleString('tr-TR'));
        setError(null);
      } catch (err: any) {
        console.error('Error fetching page:', err);
        setError('Sayfa bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageId]);

  useEffect(() => {
    // This effect runs once when the component mounts with the initial page data.
    // It checks if the initial slug was likely manually edited.
    if (page?.slug && page?.title) {
        const expectedSlug = `/${slugify(page.title)}`;
        if(page.slug !== expectedSlug) {
            setIsSlugManuallyEdited(true);
        }
    }
    // We only want this to run once on mount for the initial page data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!page) {
    notFound();
    return null;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPage(prevPage => {
        if (!prevPage) return undefined;
        
        let newSlug = prevPage.slug;
        if (!isSlugManuallyEdited) {
            newSlug = `/${slugify(newTitle)}`;
        }

        return {
            ...prevPage,
            title: newTitle,
            slug: newSlug,
            seo: { ...prevPage.seo, title: newTitle }
        };
    });
  };
  
   const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!isSlugManuallyEdited) {
        setIsSlugManuallyEdited(true);
    }
    
    const newSlug = e.target.value;
    setPage(prevPage => {
      if (!prevPage) return undefined;
      return { ...prevPage, slug: newSlug.startsWith('/') ? newSlug : `/${newSlug}` };
    });
  };

  const handleSeoChange = (field: 'title' | 'description', value: string) => {
     setPage(prevPage => {
      if (!prevPage) return undefined;
      return { ...prevPage, seo: { ...prevPage.seo, [field]: value } };
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sayfa Düzenle: {page.title}</h1>
          <p className="text-muted-foreground">Sayfanın içeriğini, SEO ayarlarını ve sosyal medya paylaşımlarını yönetin.</p>
        </div>
      </div>
      
       <Tabs defaultValue="content">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Sayfa İçeriği</TabsTrigger>
            <TabsTrigger value="social">Sosyal Medyada Paylaş</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-6">
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
                            <div className="space-y-2 mb-6">
                                <Label htmlFor="page-title">Sayfa Başlığı</Label>
                                <Input id="page-title" value={page.title} onChange={handleTitleChange} />
                            </div>
                            <Textarea 
                                className="min-h-[400px]"
                                defaultValue={`Bu alanda "${page.title}" sayfasının içeriği düzenlenecek.`}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gelişmiş SEO Ayarları</CardTitle>
                            <CardDescription>Arama motoru optimizasyonu için meta verileri ve sosyal medya paylaşım ayarlarını düzenleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Yolu (Slug)</Label>
                                <div className="flex items-center">
                                    <span className="text-sm text-muted-foreground bg-secondary px-3 py-2 rounded-l-md border border-r-0">https://aluplan.com.tr</span>
                                    <Input id="slug" value={page.slug} onChange={handleSlugChange} className="rounded-l-none"/>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="seo-title">SEO Başlığı</Label>
                                <Input id="seo-title" value={page.seo.title} onChange={e => handleSeoChange('title', e.target.value)}/>
                                <Button type="button" variant="link" className="p-0 h-auto text-primary flex items-center gap-1">
                                    <Sparkles className="h-4 w-4"/> AI ile Öneri Al
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seo-description">SEO Açıklaması</Label>
                                <Textarea id="seo-description" value={page.seo.description} onChange={e => handleSeoChange('description', e.target.value)} className="min-h-[100px]"/>
                                <Button type="button" variant="link" className="p-0 h-auto text-primary flex items-center gap-1">
                                    <Sparkles className="h-4 w-4"/> AI ile Öneri Al
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="keywords">Anahtar Kelimeler (Virgülle ayırın)</Label>
                                <Input id="keywords" placeholder="Örn: mimari tasarım, BIM, allplan" />
                                <Button type="button" variant="link" className="p-0 h-auto text-primary flex items-center gap-1">
                                    <Sparkles className="h-4 w-4"/> AI ile Öneri Al
                                </Button>
                            </div>
                            <Separator />
                            <div>
                                <Label>Google Önizlemesi</Label>
                                <div className="mt-2 border rounded-lg bg-white shadow-sm">
                                    <GooglePreview title={page.seo.title} slug={page.slug} description={page.seo.description} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yayınlama</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Durum</Label>
                                <Select defaultValue={page.status}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="published">Yayınlandı</SelectItem>
                                        <SelectItem value="draft">Taslak</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Son Güncelleme: {formattedDate || '...'}
                            </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild><Link href="/admin/cms/pages">İptal</Link></Button>
                            <Button><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </TabsContent>
        <TabsContent value="social" className="mt-6">
            <SocialMediaManager />
        </TabsContent>
       </Tabs>
    </div>
  );
}

    

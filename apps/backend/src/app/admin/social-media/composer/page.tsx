
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { socialAccounts, getPlatformIcon } from '@/lib/social-media-data';
import { events } from '@/lib/events-data';
import { pages } from '@/lib/cms-data';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Calendar, PenSquare, Sparkles, Image as ImageIcon, Tags, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;
type ContentType = 'event' | 'page' | 'custom';
type SelectedContent = {
  id: string;
  title: string;
  type: ContentType;
} | null;

const availableContent = [
    ...events.map(e => ({ ...e, type: 'event', icon: Calendar })),
    ...pages.map(p => ({ ...p, type: 'page', icon: FileText })),
];

export default function SocialMediaComposerPage() {
    const [step, setStep] = useState<Step>(1);
    const [selectedContent, setSelectedContent] = useState<SelectedContent>(null);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    
    const handleContentSelect = (content: any) => {
        setSelectedContent({ id: content.id, title: content.title, type: content.type });
        setStep(2);
    };

    const handleStartCustom = () => {
        setSelectedContent({ id: 'custom', title: 'Özel Gönderi', type: 'custom' });
        setStep(2);
    };

    const toggleAccountSelection = (accountId: string) => {
        const account = socialAccounts.find(a => a.id === accountId);
        if (!account || !account.isConnected) return; // Do not select if not connected

        setSelectedAccounts(prev => 
            prev.includes(accountId)
            ? prev.filter(id => id !== accountId)
            : [...prev, accountId]
        );
    };

    const StepIndicator = ({ currentStep }: { currentStep: Step }) => (
        <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
            {[ "İçerik Seç", "Platform Seç", "AI ile Oluştur", "Planla & Yayınla"].map((title, index) => {
                const stepNumber = index + 1;
                const isCompleted = currentStep > stepNumber;
                const isCurrent = currentStep === stepNumber;
                return (
                     <li key={stepNumber} className={`flex md:w-full items-center ${isCompleted ? 'text-blue-600 dark:text-blue-500' : ''} ${stepNumber < 4 ? "sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700" : ""}`}>
                        <span className={`flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 ${isCompleted || isCurrent ? '' : 'text-gray-500'}`}>
                            {isCompleted ? (
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                                </svg>
                            ) : (
                                <span className="me-2">{stepNumber}</span>
                            )}
                            {title}
                        </span>
                    </li>
                )
            })}
        </ol>
    );

    return (
        <div className="space-y-8">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Destekli Gönderi Oluşturucu</h1>
                    <p className="text-muted-foreground">Mevcut içeriklerden veya sıfırdan sosyal medya gönderileri oluşturun.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <StepIndicator currentStep={step} />
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div>
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-semibold">Nasıl Başlamak İstersiniz?</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <CardTitle>Mevcut İçerikten Başla</CardTitle>
                                        <CardDescription>Bir etkinlik, sayfa veya blog yazısını sosyal medya gönderisine dönüştürün.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="max-h-96 overflow-y-auto">
                                        <div className="space-y-2">
                                            {availableContent.map(item => (
                                                <button key={item.id} onClick={() => handleContentSelect(item)} className="w-full text-left p-2 rounded-md hover:bg-muted flex items-center gap-3">
                                                    <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="truncate flex-grow">{item.title}</span>
                                                    <Badge variant="outline">{item.type}</Badge>
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                 <Card className="hover:shadow-lg transition-shadow flex flex-col items-center justify-center text-center">
                                    <CardHeader>
                                        <CardTitle>Yeni Gönderi Oluştur</CardTitle>
                                        <CardDescription>Tamamen yeni ve özel bir sosyal medya gönderisi yazın.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button size="lg" onClick={handleStartCustom}>
                                            <PenSquare className="mr-2 h-5 w-5" /> Sıfırdan Başla
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                    {step === 2 && selectedContent && (
                        <div>
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-semibold">2. Adım: Platformları Seçin</h2>
                                    <p className="text-muted-foreground">Kaynak İçerik: <span className="font-semibold text-primary">{selectedContent.title}</span></p>
                                </div>
                                <Button variant="outline" onClick={() => setStep(1)}>Geri</Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {socialAccounts.map(account => {
                                    const PlatformIcon = getPlatformIcon(account.platform);
                                    const isSelected = selectedAccounts.includes(account.id);
                                    return (
                                        <button key={account.id} onClick={() => toggleAccountSelection(account.id)} disabled={!account.isConnected} className={cn(`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all`, isSelected ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted', !account.isConnected && 'opacity-50 cursor-not-allowed')}>
                                            <PlatformIcon className="h-8 w-8" />
                                            <span className="font-semibold">{account.platform}</span>
                                            {!account.isConnected && <Badge variant="destructive">Bağlı Değil</Badge>}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setStep(3)} disabled={selectedAccounts.length === 0}>İleri</Button>
                            </div>
                        </div>
                    )}
                    {step === 3 && selectedContent && (
                         <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-semibold">3. Adım: AI ile İçerik Oluşturun</h2>
                                     <p className="text-muted-foreground">Seçili platformlar için AI önerilerini düzenleyin ve kullanın.</p>
                                </div>
                                <Button variant="outline" onClick={() => setStep(2)}>Geri</Button>
                            </div>

                            <Tabs defaultValue={selectedAccounts[0]} className="w-full">
                                <TabsList>
                                    {selectedAccounts.map(id => {
                                        const account = socialAccounts.find(a => a.id === id);
                                        if(!account) return null;
                                        const PlatformIcon = getPlatformIcon(account.platform);
                                        return <TabsTrigger key={id} value={id} className="flex items-center gap-2"><PlatformIcon className="h-4 w-4"/> {account.platform}</TabsTrigger>
                                    })}
                                </TabsList>
                                {selectedAccounts.map(id => {
                                     const account = socialAccounts.find(a => a.id === id);
                                      if(!account) return null;
                                     return (
                                        <TabsContent key={id} value={id} className="mt-4">
                                            <div className="grid lg:grid-cols-2 gap-6">
                                                {/* Text Content */}
                                                <div className="space-y-4">
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center justify-between">
                                                                Metin İçeriği
                                                                <Button variant="ghost" size="sm"><Sparkles className="mr-2 h-4 w-4"/> Yeniden Oluştur</Button>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <Textarea className="min-h-48" defaultValue={`#Allplan ile projelerinizi bir üst seviyeye taşıyın! "${selectedContent.title}" etkinliğimizde bize katılın. Detaylar ve kayıt için link profilde! #BIM #${account?.platform}`}/>
                                                        </CardContent>
                                                    </Card>
                                                     <Card>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2"><Tags className="h-5 w-5"/> Hashtag Önerileri</div>
                                                                <Button variant="ghost" size="sm"><Sparkles className="mr-2 h-4 w-4"/> Yenile</Button>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="flex flex-wrap gap-2">
                                                            <Badge variant="secondary" className="cursor-pointer">#Allplan</Badge>
                                                            <Badge variant="secondary" className="cursor-pointer">#BIM</Badge>
                                                            <Badge variant="secondary" className="cursor-pointer">#Mimari</Badge>
                                                            <Badge variant="secondary" className="cursor-pointer">#İnşaatTeknolojileri</Badge>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                                {/* Visual Content */}
                                                <Card>
                                                    <CardHeader>
                                                         <CardTitle className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Görsel İçerik</div>
                                                            <Button variant="ghost" size="sm"><Sparkles className="mr-2 h-4 w-4"/> Yeni Görsel Oluştur</Button>
                                                        </CardTitle>
                                                        <CardDescription>AI, içeriğiniz için bu görsel temalarını öneriyor. Yeni bir tane oluşturabilir veya mevcut görselleri kullanabilirsiniz.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                         <Image src="https://picsum.photos/seed/social-media-post/1200/630" alt="Generated Post" width={1200} height={630} className="rounded-lg border aspect-video object-cover"/>
                                                         <p className="text-sm text-muted-foreground text-center">Önerilen görsel teması: <span className="font-semibold text-foreground">modern bina ve planlar</span></p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </TabsContent>
                                     )
                                })}
                            </Tabs>
                             <div className="flex justify-end mt-8">
                                <Button onClick={() => setStep(4)}>İleri</Button>
                            </div>
                         </div>
                    )}
                    {step === 4 && (
                        <div>
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-semibold">4. Adım: Planla ve Yayınla</h2>
                                    <p className="text-muted-foreground">Gönderilerinizi hemen yayınlayın veya ileri bir tarihe planlayın.</p>
                                </div>
                                <Button variant="outline" onClick={() => setStep(3)}>Geri</Button>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Yayınlama Seçenekleri</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="schedule-switch" />
                                        <Label htmlFor="schedule-switch">Gönderileri Planla</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input type="date" />
                                        <Input type="time" />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-4">
                                    <Button variant="secondary"><Clock className="mr-2 h-4 w-4"/> Gönderileri Planla</Button>
                                    <Button><Send className="mr-2 h-4 w-4"/> Şimdi Yayınla</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

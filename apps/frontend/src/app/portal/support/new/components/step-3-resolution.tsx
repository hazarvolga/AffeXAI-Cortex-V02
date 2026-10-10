import type { UploadedFile } from '@/lib/api/fileUploadService';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, FileText, ArrowLeft, Loader2, ClipboardCheck, Lightbulb, CheckCircle, ArrowRight } from 'lucide-react';
import { ChatBox } from '@/components/support/chatbox';
import { useActionState } from 'react';
import { analyzeSupportTicket, FormState } from '../actions';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Step3ResolutionProps {
    categoryId: string;
    categoryName: string;
    initialData: { title: string; description: string; attachments:UploadedFile[] };
    onBack: () => void;
}

function SubmitButton({ isCreating }: { isCreating: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || isCreating} className="w-full sm:w-auto">
            {pending || isCreating ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> İşleniyor...
                </>
            ) : (
                <>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    {isCreating ? 'Oluşturuluyor...' : 'Analiz Et ve Devam Et'}
                </>
            )}
        </Button>
    );
}

export function Step3Resolution({ categoryId, categoryName, initialData, onBack }: Step3ResolutionProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [resolutionType, setResolutionType] = useState<'chat' | 'ticket' | null>(null);

    // Action State for Ticket Form
    const initialState: FormState = {
        step: 1,
        message: '',
        originalInput: {
            title: initialData.title,
            problemDescription: initialData.description,
            category: categoryId,
            priority: 'medium',
            attachmentIds: initialData.attachments.map(file=>file.id)
        }
    };
    const [state, formAction] = useActionState(analyzeSupportTicket, initialState);

    useEffect(() => {
        if (state.ticketCreated && state.ticketId) {
            toast({
                title: 'Başarılı! 🎉',
                description: state.message || 'Destek talebiniz oluşturuldu. Yönlendiriliyorsunuz...',
            });
            setTimeout(() => {
                router.push(`/portal/support/${state.ticketId}`);
            }, 1500);
        }
    }, [state.ticketCreated, state.ticketId, router, toast]);

    const handleChatSessionCreate = (session: any) => {
        console.log('Chat session:', session);
    };

    if (!resolutionType) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="h-auto p-0 hover:bg-transparent">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Geri Dön
                    </Button>
                    <span>/</span>
                    <span className="font-medium text-foreground">Çözüm Yöntemi</span>
                </div>

                <div className="text-center space-y-4 mb-8">
                    <h2 className="text-2xl font-bold">Nasıl devam etmek istersiniz?</h2>
                    <p className="text-muted-foreground">Sorunun çözümü için iki farklı yöntem sunuyoruz.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Option 1: AI Chat */}
                    <Card
                        className="cursor-pointer hover:border-primary transition-all hover:bg-accent/50 group relative overflow-hidden"
                        onClick={() => setResolutionType('chat')}
                    >
                        <div className="absolute top-0 right-0 p-3 bg-green-100 text-green-700 text-xs font-bold rounded-bl-lg">
                            ÖNERİLEN
                        </div>
                        <CardHeader>
                            <div className="mb-4 p-3 bg-primary/10 w-fit rounded-full group-hover:bg-primary/20 transition-colors">
                                <MessageCircle className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle>AI Asistan ile Çöz</CardTitle>
                            <CardDescription>
                                Yapay zeka asistanımızla anlık sohbet başlatın. Sorunlarınızı saniyeler içinde analiz edip çözüm sunabilir.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Anında yanıt</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> 7/24 Aktif</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Gerekirse ekibe aktarır</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Option 2: Ticket */}
                    <Card
                        className="cursor-pointer hover:border-primary transition-all hover:bg-accent/50 group"
                        onClick={() => setResolutionType('ticket')}
                    >
                        <CardHeader>
                            <div className="mb-4 p-3 bg-orange-100 w-fit rounded-full group-hover:bg-orange-200 transition-colors">
                                <FileText className="h-8 w-8 text-orange-600" />
                            </div>
                            <CardTitle>Destek Talebi Oluştur</CardTitle>
                            <CardDescription>
                                Klasik yöntemle bir bilet oluşturun. Destek ekibimiz inceleyip size e-posta veya portal üzerinden dönecektir.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-orange-500" /> Detaylı inceleme</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-orange-500" /> Uzman desteği ve takibi</li>
                                <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-orange-500" /> Dosya ve ekran görüntüsü ekleme</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (resolutionType === 'chat') {
        return (
            <div className="animate-in fade-in zoom-in duration-300 h-[600px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setResolutionType(null)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Yöntem Seçimine Dön
                    </Button>
                    <span className="font-semibold text-lg flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" /> AI Destek Asistanı
                    </span>
                </div>
                <Card className="flex-1 overflow-hidden border-primary/50 shadow-lg">
                    <ChatBox
                        sessionType="support"
                        onSessionCreate={handleChatSessionCreate}
                        embedded={true}
                        showHeader={false}
                        height="100%"
                        className="w-full h-full"
                        initialMessage={`Merhaba, az önce "${categoryName}" kategorisinde şu sorunu belirttim: "${initialData.title}". ${initialData.description}`}
                    />
                </Card>
            </div>
        );
    }

    // Ticket Form View
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => setResolutionType(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Yöntem Seçimine Dön
                </Button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" /> Destek Talebi
                </h2>
            </div>

            <Card>
                {state.step === 1 && (
                    <form action={formAction}>
                        <CardHeader>
                            <CardTitle>Talep Detayları</CardTitle>
                            <CardDescription>
                                Bilgileri kontrol edip eksik kısımları tamamlayın.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Hidden fields to maintain state */}
                            <input type="hidden" name="category" value={categoryId} />
                            <input type="hidden" name="attachmentIds" value={JSON.stringify(initialData.attachments.map(file=>file.id))} />

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Başlık *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        defaultValue={initialData.title}
                                        required
                                        minLength={10}
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <div className="p-2 border rounded-md bg-muted text-muted-foreground text-sm">
                                        {categoryName}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="problemDescription">Açıklama *</Label>
                                <Textarea
                                    id="problemDescription"
                                    name="problemDescription"
                                    defaultValue={initialData.description}
                                    className="min-h-[200px]"
                                    required
                                    minLength={50}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Öncelik *</Label>
                                    <Select name="priority" defaultValue="medium" required>
                                        <SelectTrigger id="priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Düşük</SelectItem>
                                            <SelectItem value="medium">Orta</SelectItem>
                                            <SelectItem value="high">Yüksek</SelectItem>
                                            <SelectItem value="urgent">Acil</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-end gap-4 bg-muted/20 border-t p-6">
                            {state.message && (
                                <Alert variant="destructive">
                                    <AlertTitle>Hata</AlertTitle>
                                    <AlertDescription>{state.message}</AlertDescription>
                                </Alert>
                            )}
                            <SubmitButton isCreating={false} />
                        </CardFooter>
                    </form>
                )}

                {state.step === 2 && state.data && (
                    <div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                                {state.data.analysisAvailable ? 'AI Analiz Raporu ve Onay' : 'Talebi Kontrol Et ve Onayla'}
                            </CardTitle>
                            <CardDescription>
                                {state.data.analysisAvailable ? 'Yapay zeka sorununuzu analiz etti. Aşağıdaki özetten sonra talebinizi oluşturabilirsiniz.' : 'AI analizi şu anda kullanılamıyor. Talebiniz henüz oluşturulmadı; bilgilerinizi onaylayarak devam edin.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert className="bg-blue-50 border-blue-200">
                                <Lightbulb className="h-4 w-4 !text-blue-600" />
                                <AlertTitle className="text-blue-800">{state.data.analysisAvailable ? 'AI Çözüm Önerisi' : 'Manuel Onay'}</AlertTitle>
                                <AlertDescription className="text-blue-700 font-medium mt-1">
                                    {state.data.suggestion}
                                </AlertDescription>
                            </Alert>

                            <div className="bg-muted p-4 rounded-lg space-y-4 border">
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Özet (Destek Ekibi İçin)</Label>
                                    <p className="text-sm mt-1">{state.data.summary}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{state.data.analysisAvailable ? 'Önerilen Öncelik' : 'Seçtiğiniz Öncelik'}</Label>
                                    <Badge variant={state.data.priority === 'urgent' || state.data.priority === 'high' ? 'destructive' : 'secondary'} className="ml-2">
                                        {state.data.priority.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 bg-muted/20 border-t p-6">
                            {/* Back Form */}
                            <form action={formAction}>
                                <input type="hidden" name="action" value="back" />
                                <input type="hidden" name="title" value={state.originalInput?.title} />
                                <input type="hidden" name="problemDescription" value={state.originalInput?.problemDescription} />
                                <input type="hidden" name="category" value={state.originalInput?.category} />
                                <input type="hidden" name="priority" value={state.originalInput?.priority} />
                                <Button variant="outline" type="submit">
                                    Düzenle
                                </Button>
                            </form>

                            {/* Create Ticket Form */}
                            <form action={formAction}>
                                <input type="hidden" name="action" value="create_ticket" />
                                <input type="hidden" name="attachmentIds" value={JSON.stringify(state.originalInput?.attachmentIds || [])} />
                                <input type="hidden" name="title" value={state.originalInput?.title} />
                                <input type="hidden" name="problemDescription" value={state.originalInput?.problemDescription} />
                                <input type="hidden" name="category" value={state.originalInput?.category} />
                                <input type="hidden" name="priority" value={state.originalInput?.priority} />
                                <input type="hidden" name="summary" value={state.data.summary} />
                                <input type="hidden" name="aiPriority" value={state.data.priority} />

                                <Button type="submit" disabled={state.creating}>
                                    {state.creating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Oluşturuluyor...
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardCheck className="mr-2 h-4 w-4" /> Onayla ve Gönder
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardFooter>
                    </div>
                )}
            </Card>
        </div>
    );
}

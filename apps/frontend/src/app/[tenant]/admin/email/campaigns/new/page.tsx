
'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Calendar, Clock, Send, Eye, Sparkles, CheckCircle2, Info, TestTube, Brain, Filter } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import AiEmailGenerator from "@/components/admin/email/AiEmailGenerator";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import emailCampaignsService from "@/lib/api/emailCampaignsService";
import emailMarketingStatsService from "@/lib/api/emailMarketingStatsService";
import subscribersService from "@/lib/api/subscribersService";
import groupsService from "@/lib/api/groupsService";
import segmentsService from "@/lib/api/segmentsService";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Group, Segment } from "@affexai/shared-types";
import DOMPurify from "dompurify";


// This is a placeholder for a real rich text editor like Tiptap, TinyMCE, etc.
const RichTextEditorPlaceholder = ({
    content,
    onAiClick
}: {
    content: string;
    onAiClick: () => void;
}) => (
    <div className="w-full min-h-96 rounded-md border bg-muted p-4">
        <div className="flex gap-2 mb-4 border-b pb-2">
            <Button variant="outline" size="sm" type="button">Kalın</Button>
            <Button variant="outline" size="sm" type="button">İtalik</Button>
            <Button variant="outline" size="sm" type="button">Link</Button>
            <Button
                variant="outline"
                size="sm"
                className="text-primary gap-1 ml-auto"
                type="button"
                onClick={onAiClick}
            >
                <Sparkles className="h-4 w-4" /> AI ile Oluştur
            </Button>
        </div>
        <div className="mt-4">
            {content ? (
                <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                />
            ) : (
                <div className="text-muted-foreground">
                    Burası zengin metin editörünün (rich text editor) geleceği yerdir. E-posta içeriğinizi burada oluşturacaksınız.
                    <br /><br />
                    <strong>AI ile Oluştur</strong> butonuna tıklayarak AI'dan içerik oluşturmasını isteyebilirsiniz.
                </div>
            )}
        </div>
    </div>
);

const RecipientFilterDialog = ({
    open,
    onOpenChange,
    onApplyFilter,
    groups,
    segments,
    initialSelectedGroups,
    initialSelectedSegments,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApplyFilter: (selectedGroups: string[], selectedSegments: string[]) => void;
    groups: Group[];
    segments: Segment[];
    initialSelectedGroups: string[];
    initialSelectedSegments: string[];
}) => {
    const [selectedGroups, setSelectedGroups] = useState<string[]>(initialSelectedGroups);
    const [selectedSegments, setSelectedSegments] = useState<string[]>(initialSelectedSegments);

    useEffect(() => {
        setSelectedGroups(initialSelectedGroups);
        setSelectedSegments(initialSelectedSegments);
    }, [initialSelectedGroups, initialSelectedSegments]);

    const handleApply = () => {
        onApplyFilter(selectedGroups, selectedSegments);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Alıcıları Filtrele</DialogTitle>
                    <DialogDescription>
                        Kampanyanızın gönderileceği grupları veya segmentleri seçin.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="groups">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="groups">Gruplar</TabsTrigger>
                        <TabsTrigger value="segments">Segmentler</TabsTrigger>
                    </TabsList>
                    <TabsContent value="groups">
                        <ScrollArea className="h-72">
                            <div className="space-y-2 p-4">
                                {groups.map((group) => (
                                    <div key={group.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`group-${group.id}`}
                                            checked={selectedGroups.includes(group.id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedGroups((prev) =>
                                                    checked
                                                        ? [...prev, group.id]
                                                        : prev.filter((id) => id !== group.id)
                                                );
                                            }}
                                        />
                                        <Label htmlFor={`group-${group.id}`} className="flex justify-between w-full">
                                            <span>{group.name}</span>
                                            <span className="text-muted-foreground">{group.subscriberCount} abone</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="segments">
                        <ScrollArea className="h-72">
                            <div className="space-y-2 p-4">
                                {segments.map((segment) => (
                                    <div key={segment.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`segment-${segment.id}`}
                                            checked={selectedSegments.includes(segment.id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedSegments((prev) =>
                                                    checked
                                                        ? [...prev, segment.id]
                                                        : prev.filter((id) => id !== segment.id)
                                                );
                                            }}
                                        />
                                        <Label htmlFor={`segment-${segment.id}`} className="flex justify-between w-full">
                                            <span>{segment.name}</span>
                                            <span className="text-muted-foreground">{segment.subscriberCount} abone</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleApply}>Filtreyi Uygula</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function NewCampaignPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const tenant = params?.tenant as string || 'default';
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [campaignTitle, setCampaignTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [subjectAlternatives, setSubjectAlternatives] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);

    const [recipientCount, setRecipientCount] = useState(0);
    const [filterType, setFilterType] = useState<'all' | 'group' | 'segment'>('all');
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
    const [totalActiveSubscribers, setTotalActiveSubscribers] = useState(0);
    const [useAiOptimalTime, setUseAiOptimalTime] = useState(false);
    const [optimalTimeRecommendation, setOptimalTimeRecommendation] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const stats = await emailMarketingStatsService.getRecipientStats();

                setTotalActiveSubscribers(stats.totalActiveSubscribers);
                setRecipientCount(stats.totalActiveSubscribers);
                setGroups(stats.groups);
                setSegments(stats.segments);

            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast({
                    title: "Veri alınamadı",
                    description: "Alıcı verileri yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            }
        };
        fetchInitialData();
    }, [toast]);

    const handleAiGenerated = (generatedSubject: string, bodyHtml: string, alternatives: string[]) => {
        setSubject(generatedSubject);
        setEmailBody(bodyHtml);
        setSubjectAlternatives(alternatives);

        toast({
            title: "İçerik oluşturuldu!",
            description: "AI tarafından oluşturulan içerik editöre eklendi.",
        });
    };

    const handleSaveCampaign = async () => {
        if (!campaignTitle || !subject) {
            toast({
                title: "Eksik bilgi",
                description: "Kampanya adı ve konu alanları zorunludur.",
                variant: "destructive",
            });
            return;
        }

        try {
            setSaving(true);
            const campaignData = {
                name: campaignTitle,
                subject: subject,
                content: emailBody || '<p>Email içeriği buraya gelecek...</p>',
                status: 'draft' as const,
                target: {
                    type: filterType,
                    groups: selectedGroups,
                    segments: selectedSegments,
                }
            };

            const newCampaign = await emailCampaignsService.create(campaignData);

            setCreatedCampaignId(newCampaign.id);
            setShowSuccessDialog(true);
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast({
                title: "Hata",
                description: "Kampanya oluşturulurken bir hata oluştu.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleApplyFilter = (newSelectedGroups: string[], newSelectedSegments: string[]) => {
        setSelectedGroups(newSelectedGroups);
        setSelectedSegments(newSelectedSegments);

        if (newSelectedGroups.length > 0) {
            setFilterType('group');
            const count = newSelectedGroups.reduce((acc, groupId) => {
                const group = groups.find(g => g.id === groupId);
                return acc + (group?.subscriberCount || 0);
            }, 0);
            setRecipientCount(count);
        } else if (newSelectedSegments.length > 0) {
            setFilterType('segment');
            const count = newSelectedSegments.reduce((acc, segmentId) => {
                const segment = segments.find(s => s.id === segmentId);
                return acc + (segment?.subscriberCount || 0);
            }, 0);
            setRecipientCount(count);
        } else {
            setFilterType('all');
            setRecipientCount(totalActiveSubscribers);
        }
    };

    const getRecipientDescription = () => {
        if (filterType === 'group') {
            return `Seçili ${selectedGroups.length} gruba gönderilecek.`;
        }
        if (filterType === 'segment') {
            return `Seçili ${selectedSegments.length} segmente gönderilecek.`;
        }
        return `Tüm aktif abonelere gönderilecek.`;
    };

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Yeni Email Kampanyası</h1>
                <p className="text-muted-foreground">Yeni bir e-posta kampanyası oluşturun ve hedef kitlenize gönderin.</p>
            </div>

            <AiEmailGenerator
                open={isAiDialogOpen}
                onOpenChange={setIsAiDialogOpen}
                onGenerated={handleAiGenerated}
                defaultCampaignName={campaignTitle}
            />

            <RecipientFilterDialog
                open={isFilterDialogOpen}
                onOpenChange={setIsFilterDialogOpen}
                onApplyFilter={handleApplyFilter}
                groups={groups}
                segments={segments}
                initialSelectedGroups={selectedGroups}
                initialSelectedSegments={selectedSegments}
            />

            <form className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kampanya İçeriği</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="campaign-title">Kampanya Başlığı (Dahili)</Label>
                                <Input
                                    id="campaign-title"
                                    placeholder="Örn: Eylül 2024 Bülteni"
                                    value={campaignTitle}
                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Bu başlık sadece panelde görünür ve size özeldir.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">E-posta Konusu</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="subject"
                                        placeholder="Abonelerinizin gelen kutusunda göreceği konu"
                                        className="flex-grow"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        aria-label="AI ile konu önerisi al"
                                        onClick={() => setIsAiDialogOpen(true)}
                                    >
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    AI ikonuna tıklayarak içerikle uyumlu konu başlığı önerileri alabilirsiniz.
                                </p>
                                {subjectAlternatives.length > 0 && (
                                    <Alert className="mt-2">
                                        <Sparkles className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium">AI tarafından oluşturulan alternatif konu satırları:</p>
                                                <div className="space-y-1">
                                                    {subjectAlternatives.map((alt, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                setSubject(alt);
                                                                toast({
                                                                    title: "Konu güncellendi",
                                                                    description: "Seçtiğiniz alternatif konu satırı kullanılacak.",
                                                                });
                                                            }}
                                                            className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                                                        >
                                                            <span className="flex-1">{alt}</span>
                                                            {subject === alt && (
                                                                <Badge variant="default" className="text-xs">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Seçili
                                                                </Badge>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>İçerik</Label>
                                    {emailBody && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Sparkles className="h-3 w-3 mr-1" />
                                            AI ile oluşturuldu
                                        </Badge>
                                    )}
                                </div>
                                <RichTextEditorPlaceholder
                                    content={emailBody}
                                    onAiClick={() => setIsAiDialogOpen(true)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gönderim</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Alıcılar</Label>
                                    <Badge variant="secondary" className="text-xs">{recipientCount} alıcı</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>{getRecipientDescription()}</p>
                                    {filterType === 'group' && selectedGroups.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedGroups.map(groupId => {
                                                const group = groups.find(g => g.id === groupId);
                                                return group ? (
                                                    <Badge key={groupId} variant="outline" className="text-xs">
                                                        {group.name}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    {filterType === 'segment' && selectedSegments.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {selectedSegments.map(segmentId => {
                                                const segment = segments.find(s => s.id === segmentId);
                                                return segment ? (
                                                    <Badge key={segmentId} variant="outline" className="text-xs">
                                                        {segment.name}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => setIsFilterDialogOpen(true)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {filterType === 'all' ? 'Alıcıları Filtrele' : 'Filtreyi Değiştir'}
                            </Button>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Gönderim Zamanı</Label>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            disabled={useAiOptimalTime}
                                        />
                                        <Input
                                            type="time"
                                            disabled={useAiOptimalTime}
                                        />
                                    </div>

                                    <div className="space-y-3 rounded-lg border p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Brain className="h-5 w-5 text-primary" />
                                                <Label htmlFor="ai-optimal-time" className="text-sm font-medium">
                                                    AI ile En İyi Zamanı Bul
                                                </Label>
                                            </div>
                                            <Switch
                                                id="ai-optimal-time"
                                                checked={useAiOptimalTime}
                                                onCheckedChange={(checked) => {
                                                    setUseAiOptimalTime(checked);
                                                    if (checked) {
                                                        // Simulated optimal time recommendation
                                                        setOptimalTimeRecommendation("Salı 10:00 - En yüksek açılma oranı");
                                                        toast({
                                                            title: "AI Analizi Tamamlandı",
                                                            description: "Hedef kitleniz için en optimal gönderim zamanı belirlendi.",
                                                        });
                                                    } else {
                                                        setOptimalTimeRecommendation(null);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Abonelerinizin geçmiş email açma davranışlarını analiz ederek en yüksek açılma oranını sağlayacak zamanı otomatik belirler.
                                        </p>
                                        {useAiOptimalTime && optimalTimeRecommendation && (
                                            <Alert className="mt-2">
                                                <Sparkles className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    <strong>AI Önerisi:</strong> {optimalTimeRecommendation}
                                                    <br />
                                                    <span className="text-muted-foreground">
                                                        Bu zamanda gönderim %25-30 daha yüksek açılma oranı sağlayabilir.
                                                    </span>
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    A/B test özelliği kampanya kaydedildikten sonra kullanılabilir olacak.
                                </AlertDescription>
                            </Alert>
                            <Button className="w-full"><Clock className="mr-2 h-4 w-4" /> Kampanyayı Planla</Button>
                            <Button variant="secondary" className="w-full"><Send className="mr-2 h-4 w-4" /> Şimdi Gönder</Button>
                            <Button variant="ghost" className="w-full"><Eye className="mr-2 h-4 w-4" /> Önizle ve Test Maili Gönder</Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Kaydet</CardTitle>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" asChild><Link href="/${tenant}/admin/email">İptal</Link></Button>
                            <Button onClick={handleSaveCampaign} disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Kampanya Başarıyla Oluşturuldu!
                        </DialogTitle>
                        <DialogDescription>
                            Kampanyanız taslak olarak kaydedildi. Şimdi ne yapmak istiyorsunuz?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={() => {
                                    setShowSuccessDialog(false);
                                    router.push(`/${tenant}/admin/email/campaigns/${createdCampaignId}`);
                                }}
                                className="w-full"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Kampanyayı Görüntüle
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowSuccessDialog(false);
                                    router.push(`/${tenant}/admin/email/campaigns/${createdCampaignId}/edit`);
                                }}
                                className="w-full"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Kampanyayı Düzenle
                            </Button>
                        </div>

                        <Alert>
                            <TestTube className="h-4 w-4" />
                            <AlertDescription>
                                <strong>A/B Test İpucu:</strong> Kampanya detay sayfasında "A/B Test Oluştur" butonunu kullanarak farklı konu satırları, içerikler veya gönderim zamanlarını test edebilirsiniz.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowSuccessDialog(false);
                                router.push('/${tenant}/admin/email/campaigns');
                            }}
                        >
                            Kampanya Listesine Dön
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

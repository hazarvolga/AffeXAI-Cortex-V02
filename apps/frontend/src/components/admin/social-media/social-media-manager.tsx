
'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { socialAccounts, getPlatformIcon } from '@/lib/social-media-data';
import type { SocialAccount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Clock, Send, Share2 } from 'lucide-react';

const AccountConnection = ({ selectedAccounts, onSelectionChange }: { selectedAccounts: string[], onSelectionChange: (id: string) => void }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>1. Hesap Seçimi</CardTitle>
                <CardDescription>Paylaşım yapılacak sosyal medya hesaplarını seçin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {socialAccounts.map(account => {
                    const PlatformIcon = getPlatformIcon(account.platform);
                    const isSelected = selectedAccounts.includes(account.id);
                    return (
                        <div key={account.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isSelected && "ring-2 ring-primary border-primary")}>
                            <div className="flex items-center gap-4">
                                <PlatformIcon className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">{account.username}</p>
                                    <p className="text-sm text-muted-foreground">{account.platform}</p>
                                </div>
                            </div>
                            {account.isConnected ? (
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`select-${account.id}`} className="text-sm">Seç</Label>
                                    <Checkbox 
                                        id={`select-${account.id}`} 
                                        checked={isSelected}
                                        onCheckedChange={() => onSelectionChange(account.id)}
                                    />
                                </div>
                            ) : (
                                <Button variant="outline" size="sm">Bağlan</Button>
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    );
};

const PostScheduler = () => {
    const [isScheduled, setIsScheduled] = useState(false);
    return (
        <Card>
            <CardHeader>
                <CardTitle>2. Gönderim Ayarları</CardTitle>
                <CardDescription>Paylaşımın ne zaman yapılacağını ve içeriğini özelleştirin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Switch id="schedule-switch" checked={isScheduled} onCheckedChange={setIsScheduled} />
                    <Label htmlFor="schedule-switch">Gönderiyi Planla</Label>
                </div>
                 {isScheduled && (
                    <div className="grid grid-cols-2 gap-2">
                        <Input type="date" />
                        <Input type="time" />
                    </div>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="custom-message">Platforma Özel Mesaj (Opsiyonel)</Label>
                    <Textarea id="custom-message" placeholder="Her platform için standart metin kullanılacak. Buraya yazarak üzerine yazabilirsiniz." />
                    <p className="text-xs text-muted-foreground">Twitter için 280 karakter sınırı gibi platform limitlerini göz önünde bulundurun.</p>
                </div>
            </CardContent>
             <CardFooter>
                <Button className="w-full" disabled={!isScheduled}>
                    <Clock className="mr-2 h-4 w-4" /> Planla
                </Button>
            </CardFooter>
        </Card>
    );
}

export function SocialMediaManager() {
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
        socialAccounts.filter(a => a.isConnected).map(a => a.id)
    );

    const handleAccountSelection = (accountId: string) => {
        setSelectedAccounts(prev => 
            prev.includes(accountId)
            ? prev.filter(id => id !== accountId)
            : [...prev, accountId]
        );
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <AccountConnection selectedAccounts={selectedAccounts} onSelectionChange={handleAccountSelection} />
                <div className="space-y-8">
                    <PostScheduler />
                     <Card>
                        <CardHeader>
                             <CardTitle>Şimdi Paylaş</CardTitle>
                             <CardDescription>Seçili hesaplarda anında paylaşım yapın.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full" disabled={selectedAccounts.length === 0}>
                                <Send className="mr-2 h-4 w-4" /> Şimdi Paylaş
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

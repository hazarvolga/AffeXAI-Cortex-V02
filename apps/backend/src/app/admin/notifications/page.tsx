
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bell, AlertTriangle, Info, CheckCircle, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Notification = {
  id: number;
  type: 'new_user' | 'system_alert' | 'content_approval' | 'update_complete';
  title: string;
  message: string;
  read: boolean;
  time: string;
};

const initialNotifications: Notification[] = [
    { id: 1, type: 'new_user', title: 'Yeni Kullanıcı Kaydı', message: 'editor@example.com adresiyle yeni bir kullanıcı kayıt oldu.', read: false, time: '5 dakika önce' },
    { id: 2, type: 'system_alert', title: 'Sistem Uyarısı', message: 'Sunucu belleği %90 doluluk oranına ulaştı.', read: false, time: '1 saat önce' },
    { id: 3, type: 'content_approval', title: 'Onay Bekleyen İçerik', message: '"Yeni Allplan Sürümü" başlıklı blog yazısı onayınızı bekliyor.', read: true, time: '3 saat önce' },
    { id: 4, type: 'update_complete', title: 'Güncelleme Başarılı', message: 'Sistem başarıyla v2.1.0 sürümüne güncellendi.', read: true, time: '1 gün önce' },
];

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'system_alert': return <AlertTriangle className="h-5 w-5 text-destructive" />;
        case 'new_user': return <UserPlus className="h-5 w-5 text-blue-500" />;
        case 'content_approval': return <Info className="h-5 w-5 text-orange-500" />;
        case 'update_complete': return <CheckCircle className="h-5 w-5 text-green-500" />;
        default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Bildirim Merkezi</CardTitle>
            <CardDescription>Son sistem ve kullanıcı bildirimleri.</CardDescription>
        </div>
         <Button variant="outline" onClick={markAllAsRead} disabled={notifications.every(n => n.read)}>
            Tümünü Okundu Olarak İşaretle
        </Button>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
            <div className="space-y-4">
            {notifications.map((notification) => (
                <div
                key={notification.id}
                className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                    !notification.read && "bg-secondary/50"
                )}
                >
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>Okundu olarak işaretle</Button>
                )}
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4" />
                <p>Görüntülenecek yeni bildirim yok.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

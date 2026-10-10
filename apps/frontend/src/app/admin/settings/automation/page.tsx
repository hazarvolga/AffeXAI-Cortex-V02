'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Workflow, Webhook, Activity, CheckCircle } from 'lucide-react';
import ApprovalDashboard from '@/components/admin/automation/ApprovalDashboard';
import EventLogViewer from '@/components/admin/automation/EventLogViewer';

export default function AutomationCenterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Otomasyon Merkezi</h1>
        <p className="text-muted-foreground mt-2">
          Platform genelindeki otomatik süreçleri ve entegrasyonları yönetin
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Onaylar
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Otomasyon Kuralları
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooklar
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Olay Geçmişi
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Kurallar</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Toplam 0 kural</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhooklar</CardTitle>
                <Webhook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Kayıtlı webhook</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bugün İşlenen</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Olay işlendi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-%</div>
                <p className="text-xs text-muted-foreground">Son 24 saat</p>
              </CardContent>
            </Card>
          </div>

          {/* Module Status */}
          <Card>
            <CardHeader>
              <CardTitle>Modül Durumu</CardTitle>
              <CardDescription>
                Platform modüllerinin gerçek zamanlı otomasyon durumu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Etkinlikler', status: 'active', events: 4 },
                  { name: 'E-posta Pazarlama', status: 'active', events: 5 },
                  { name: 'Sertifikalar', status: 'active', events: 3 },
                  { name: 'CMS', status: 'active', events: 4 },
                  { name: 'Medya', status: 'active', events: 2 },
                ].map((module) => (
                  <div key={module.name} className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-sm text-muted-foreground">{module.events} olay tipi</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Aktif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <ApprovalDashboard />
        </TabsContent>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Otomasyon Kuralları</CardTitle>
              <CardDescription>
                Olay tetikleyicileri ve otomatik aksiyonları tanımlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <Workflow className="h-12 w-12 mx-auto opacity-50" />
                  <p>Henüz otomasyon kuralı oluşturulmamış</p>
                  <p className="text-sm">Yeni kural eklemek için "Kural Oluştur" butonuna tıklayın</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooklar</CardTitle>
              <CardDescription>
                Platform olaylarını harici sistemlere gönderin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <Webhook className="h-12 w-12 mx-auto opacity-50" />
                  <p>Henüz webhook tanımlanmamış</p>
                  <p className="text-sm">Yeni webhook eklemek için "Webhook Ekle" butonuna tıklayın</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Log Tab */}
        <TabsContent value="events" className="space-y-4">
          <EventLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

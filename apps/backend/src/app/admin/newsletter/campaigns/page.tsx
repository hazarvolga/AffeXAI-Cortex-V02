'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { CampaignPerformanceChart } from '@/app/admin/newsletter/_components/campaign-performance-chart';

export default function CampaignsManagementPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/newsletter">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampanyaları Yönet</h1>
          <p className="text-muted-foreground">Bülten kampanyalarınızı oluşturun, gönderin ve takip edin.</p>
        </div>
      </div>

      {/* Campaign Performance Chart */}
      <CampaignPerformanceChart />

      <Card>
        <CardHeader>
          <CardTitle>Kampanya Yönetimi</CardTitle>
          <CardDescription>
            Bu sayfa henüz tamamlanmadı. Burada kampanyalarınızı oluşturacak, düzenleyecek ve yönetebileceksiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Send className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            Kampanya yönetimi sayfası geliştirme aşamasında. Yakında burada tüm kampanyalarınızı oluşturabilecek ve yönetebileceksiniz.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/newsletter/campaigns/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Kampanya Oluştur
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
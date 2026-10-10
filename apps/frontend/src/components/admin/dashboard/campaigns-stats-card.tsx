'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailOpen, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { emailMarketingService } from "@/lib/api";
import type { Campaign } from "@/lib/api/emailMarketingService";

export function CampaignsStatsCard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await emailMarketingService.getCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading campaigns data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sentCampaigns = campaigns.filter(c => c.status === 'sent' || c.status === 'sending').length;
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled' || c.status === 'draft').length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" />
            Email Kampanyaları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailOpen className="h-5 w-5" />
          Email Kampanyaları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{sentCampaigns}</p>
            <p className="text-xs text-muted-foreground">Gönderildi</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{scheduledCampaigns}</p>
            <p className="text-xs text-muted-foreground">Planlandı</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Toplam {campaigns.length} kampanya
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/admin/email-marketing">
            Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

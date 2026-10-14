"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, BarChart, Users, PlusCircle, Share2, Mail } from "lucide-react";
import Link from "next/link";
import { campaigns, subscribers } from "@/lib/newsletter-data";
import { socialPosts } from "@/lib/social-media-data";
import { DemoDataBadge } from "@/components/patterns/demo-data-badge";
import { Progress } from "@/components/ui/progress";
import { useParams } from "next/navigation";
import { useState } from "react";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function MarketingDashboard() {
  const params = useParams();
  const tenant = (params?.tenant as string) || "default";
  const scheduledCampaigns = campaigns.filter((c) => c.status === "planlandı");
  const [weekAgo] = useState(() => Date.now() - WEEK_MS);
  const recentSubscribers = subscribers.filter(
    (s) => new Date(s.subscribedAt).getTime() > weekAgo,
  ).length;
  const scheduledPosts = socialPosts.filter(
    (p) => p.status === "Planlandı",
  ).length;

  const latestCampaign = campaigns.find((c) => c.status === "gönderildi");

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Pazarlama Ekibi Paneli
          </h2>
          <p className="text-muted-foreground">
            Kampanyaları, bültenleri ve sosyal medya etkileşimlerini yönetin.
          </p>
          <DemoDataBadge
            className="mt-2"
            reason="Bu paneldeki kampanya, abone ve gönderi değerleri örnek veridir; modül API'lerine henüz bağlı değil."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Abone</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscribers.length}</div>
            <p className="text-xs text-muted-foreground">
              +{recentSubscribers} son 7 gün
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Planlanmış Kampanyalar
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scheduledCampaigns.length}
            </div>
            <p className="text-xs text-muted-foreground">
              E-posta kampanyaları
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Planlanmış Gönderiler
            </CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts}</div>
            <p className="text-xs text-muted-foreground">
              Sosyal medya gönderileri
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Son Kampanya Etkileşimi
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestCampaign?.openRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              &quot;{latestCampaign?.title}&quot; açılma oranı
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Eylemler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button
              asChild
              size="lg"
              className="h-auto py-4 text-left justify-start"
            >
              <Link href={`/${tenant}/admin/email-marketing/campaigns/new`}>
                <PlusCircle className="mr-3 h-5 w-5" />
                <div>
                  <p className="font-bold">Yeni Kampanya</p>
                  <p className="font-normal text-xs">
                    E-posta kampanyası oluştur.
                  </p>
                </div>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-auto py-4 text-left justify-start"
            >
              <Link href={`/${tenant}/admin/social/composer`}>
                <PlusCircle className="mr-3 h-5 w-5" />
                <div>
                  <p className="font-bold">Yeni Gönderi</p>
                  <p className="font-normal text-xs">
                    Sosyal medya gönderisi planla.
                  </p>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
        {latestCampaign && (
          <Card>
            <CardHeader>
              <CardTitle>Son Kampanya: {latestCampaign.title}</CardTitle>
              <CardDescription>
                &quot;{latestCampaign.subject}&quot;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Açılma Oranı</span>{" "}
                  <span>{latestCampaign.openRate}%</span>
                </div>
                <Progress value={latestCampaign.openRate} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tıklanma Oranı</span>{" "}
                  <span>{latestCampaign.clickRate}%</span>
                </div>
                <Progress value={latestCampaign.clickRate} />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link
                  href={`/${tenant}/admin/email-marketing/campaigns/${latestCampaign.id}`}
                >
                  Detaylı Raporu Gör
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}

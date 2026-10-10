'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailOpen, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { emailMarketingService } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useParams } from "next/navigation";

interface CampaignPerformance {
  name: string;
  openRate: number;
  clickRate: number;
}

export function CampaignsBarChart() {
  const params = useParams();
  const tenant = params?.tenant as string || "default";
  const [data, setData] = useState<CampaignPerformance[]>([]);
  const [avgOpenRate, setAvgOpenRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get real campaigns data
      const campaigns = await emailMarketingService.getCampaigns().catch(() => []);

      // Take last 5 campaigns and extract performance metrics
      const recentCampaigns = campaigns.slice(-5).map(campaign => ({
        name: campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name,
        openRate: campaign.sentCount > 0 ? campaign.openedCount / campaign.sentCount * 100 : 0,
        clickRate: campaign.sentCount > 0 ? campaign.clickedCount / campaign.sentCount * 100 : 0,
      }));

      // No fallback sample data - show empty state if no campaigns
      setData(recentCampaigns);

      // Calculate average open rate
      if (recentCampaigns.length > 0) {
        const avg = recentCampaigns.reduce((sum, item) => sum + item.openRate, 0) / recentCampaigns.length;
        setAvgOpenRate(Math.round(avg));
      } else {
        setAvgOpenRate(0);
      }

    } catch (error) {
      console.error('Error loading campaigns performance data:', error);
      // Fallback to empty data
      setData([]);
      setAvgOpenRate(0);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-2">{label}</p>
          <p className="text-xs text-purple-600">
            Açılma: <span className="font-semibold">{payload[0].value}%</span>
          </p>
          <p className="text-xs text-blue-600">
            Tıklama: <span className="font-semibold">{payload[1].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailOpen className="h-5 w-5" />
            Kampanya Performansı
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
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
          Kampanya Performansı
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Ortalama açılma oranı: {avgOpenRate}%
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={11}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
              label={{ value: '%', position: 'insideLeft', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar
              dataKey="openRate"
              fill="hsl(271, 91%, 65%)"
              name="Açılma Oranı"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="clickRate"
              fill="hsl(217, 91%, 60%)"
              name="Tıklama Oranı"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href={`/${tenant}/admin/email-marketing`}>
            Tüm Kampanyalar <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

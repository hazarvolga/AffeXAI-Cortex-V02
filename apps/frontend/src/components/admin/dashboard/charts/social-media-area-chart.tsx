'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { socialMediaService } from "@/lib/api/socialMediaService";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useParams } from "next/navigation";

interface SocialEngagement {
  date: string;
  twitter: number;
  facebook: number;
  instagram: number;
  linkedin: number;
}

export function SocialMediaAreaChart() {
  const params = useParams();
  const tenant = params?.tenant as string || "default";
  const [data, setData] = useState<SocialEngagement[]>([]);
  const [totalEngagement, setTotalEngagement] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await socialMediaService.getEngagementTrend();

      // If response is wrapped (success: true, data: [...]), extract data
      // @ts-ignore - API response type might be wrapped
      const rawData = response.data || response;
      const trendData: SocialEngagement[] = Array.isArray(rawData) ? rawData : [];

      if (trendData.length === 0) {
        // Handle empty state gracefully
        const today = new Date();
        const emptyDay = {
          date: today.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
          twitter: 0, facebook: 0, instagram: 0, linkedin: 0
        };
        setData([emptyDay]);
        setTotalEngagement(0);
        return;
      }

      // Format dates for display (backend returns YYYY-MM-DD)
      const formattedData = trendData.map((item: any) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
      }));

      setData(formattedData);

      // Calculate total engagement from the most recent day
      const latest = formattedData[formattedData.length - 1];
      const total = (latest.twitter || 0) + (latest.facebook || 0) + (latest.instagram || 0) + (latest.linkedin || 0);
      setTotalEngagement(total);

    } catch (error) {
      console.error('Error loading social media engagement data:', error);
      // Ensure specific empty state on error, not random mocks
      setData([]);
      setTotalEngagement(0);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-2">{label}</p>
          {payload.reverse().map((item: any) => (
            <p key={item.dataKey} className="text-xs" style={{ color: item.color }}>
              {item.name}: <span className="font-semibold">{item.value}</span>
            </p>
          ))}
          <p className="text-xs text-muted-foreground border-t mt-2 pt-1">
            Toplam: <span className="font-semibold">{total}</span>
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
            <Share2 className="h-5 w-5" />
            Sosyal Medya Engagement
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
          <Share2 className="h-5 w-5" />
          Sosyal Medya Engagement
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Bugün toplam {totalEngagement} etkileşim
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTwitter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(203, 89%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(203, 89%, 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 44%, 41%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(221, 44%, 41%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(340, 75%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(340, 75%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(201, 100%, 35%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(201, 100%, 35%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="instagram"
              stackId="1"
              stroke="hsl(340, 75%, 55%)"
              fill="url(#colorInstagram)"
              name="Instagram"
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="facebook"
              stackId="1"
              stroke="hsl(221, 44%, 41%)"
              fill="url(#colorFacebook)"
              name="Facebook"
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="twitter"
              stackId="1"
              stroke="hsl(203, 89%, 53%)"
              fill="url(#colorTwitter)"
              name="Twitter"
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="linkedin"
              stackId="1"
              stroke="hsl(201, 100%, 35%)"
              fill="url(#colorLinkedin)"
              name="LinkedIn"
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href={`/${tenant}/admin/social`}>
            Detaylı İstatistikler <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

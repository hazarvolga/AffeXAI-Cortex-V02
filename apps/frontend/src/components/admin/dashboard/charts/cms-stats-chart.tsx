'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowUpRight, Eye } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cmsMetricsService } from "@/lib/api/cmsMetricsService";

interface CmsPageStats {
  page: string;
  views: number;
  status: 'published' | 'draft';
}

export function CmsStatsChart() {
  const [topPages, setTopPages] = useState<CmsPageStats[]>([]);
  const [stats, setStats] = useState({ published: 0, draft: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get real CMS metrics
      const metrics = await cmsMetricsService.getMetrics('week');

      // Map top pages to chart data
      const topPagesData: CmsPageStats[] = metrics.topPages.slice(0, 5).map(page => ({
        page: page.pageTitle.length > 20 ? page.pageTitle.substring(0, 20) + '...' : page.pageTitle,
        views: page.viewCount,
        status: 'published' as const,
      }));

      setTopPages(topPagesData);

      // Calculate stats from summary (backend only tracks publishes and edits, no separate draft count)
      const summary = metrics.summary;
      setStats({
        published: summary.publishes,
        draft: summary.edits, // Show edits as draft count for now
        total: summary.publishes + summary.edits,
      });

    } catch (error) {
      console.error('Error loading CMS data:', error);
      // Fallback to empty state
      setTopPages([]);
      setStats({
        published: 0,
        draft: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Custom bar colors
  const getBarColor = (views: number) => {
    if (views > 1000) return 'hsl(142, 71%, 45%)'; // Green
    if (views > 700) return 'hsl(217, 91%, 60%)'; // Blue
    return 'hsl(271, 91%, 65%)'; // Purple
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold">{payload[0].payload.page}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Eye className="h-3 w-3" />
            {payload[0].value.toLocaleString('tr-TR')} görüntülenme
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
            <FileText className="h-5 w-5" />
            CMS İçerik Performansı
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
          <FileText className="h-5 w-5" />
          CMS İçerik Performansı
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          En çok okunan sayfalar
        </p>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topPages} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="page"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={11}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="views"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {topPages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.views)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Stats Summary */}
        <div className="flex justify-around mt-4 border-t pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-xs text-muted-foreground">Yayında</p>
          </div>
          <div className="h-12 w-px bg-border"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            <p className="text-xs text-muted-foreground">Taslak</p>
          </div>
          <div className="h-12 w-px bg-border"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Toplam</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/affexai/admin/cms">
            Tüm Sayfalar <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

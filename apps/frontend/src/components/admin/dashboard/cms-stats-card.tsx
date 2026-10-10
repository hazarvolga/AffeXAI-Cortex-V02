'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function CmsStatsCard() {
  const [stats, setStats] = useState({
    publishedPages: 0,
    draftPages: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call when backend ready
      // const data = await cmsService.getStats();
      // setStats(data);

      // Mock data for now
      setStats({
        publishedPages: 24,
        draftPages: 8,
        totalPages: 32,
      });
    } catch (error) {
      console.error('Error loading CMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CMS İçerik
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
          <FileText className="h-5 w-5" />
          CMS İçerik
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{stats.publishedPages}</p>
            <p className="text-xs text-muted-foreground">Yayında</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.draftPages}</p>
            <p className="text-xs text-muted-foreground">Taslak</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Toplam {stats.totalPages} sayfa
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/admin/cms">
            Yönet <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

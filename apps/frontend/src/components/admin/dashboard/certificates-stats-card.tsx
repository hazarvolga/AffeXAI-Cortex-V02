'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function CertificatesStatsCard() {
  const [stats, setStats] = useState({
    issued: 0,
    pending: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API call when backend ready
      // const data = await certificatesService.getStats();
      // setStats(data);

      // Mock data for now
      setStats({
        issued: 45,
        pending: 12,
        total: 57,
      });
    } catch (error) {
      console.error('Error loading certificates data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Sertifikalar
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
          <Award className="h-5 w-5" />
          Sertifikalar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">{stats.issued}</p>
            <p className="text-xs text-muted-foreground">Verildi</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Beklemede</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Toplam {stats.total} sertifika oluşturuldu
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/admin/certificates">
            Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

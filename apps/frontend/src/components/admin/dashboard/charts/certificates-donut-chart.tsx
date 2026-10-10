'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { certificatesService } from "@/lib/api";

interface CertificateData {
  name: string;
  value: number;
  color: string;
}

export function CertificatesDonutChart() {
  const [data, setData] = useState<CertificateData[]>([]);
  const [total, setTotal] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get real certificate statistics
      const stats = await certificatesService.getStatistics();

      // Map to chart data
      const chartData: CertificateData[] = [
        { name: 'Verildi', value: stats.issued + stats.sent, color: 'hsl(142, 71%, 45%)' }, // Green
        { name: 'Taslak', value: stats.draft, color: 'hsl(48, 96%, 53%)' }, // Yellow
      ];

      // Filter out items with 0 value
      const filteredData = chartData.filter(item => item.value > 0);

      setData(filteredData.length > 0 ? filteredData : [
        { name: 'Veri Yok', value: 1, color: 'hsl(var(--muted))' }
      ]);

      const totalCerts = stats.total;
      setTotal(totalCerts);

      const issuedCount = stats.issued + stats.sent;
      const rate = totalCerts > 0 ? (issuedCount / totalCerts) * 100 : 0;
      setCompletionRate(Math.round(rate));

    } catch (error) {
      console.error('Error loading certificates data:', error);
      // Fallback to empty state
      setData([{ name: 'Hata', value: 1, color: 'hsl(0, 84%, 60%)' }]);
      setTotal(0);
      setCompletionRate(0);
    } finally {
      setLoading(false);
    }
  };

  // Custom label in center
  const renderCustomLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x="50%"
          dy="-0.5em"
          fontSize="28"
          fontWeight="bold"
          fill="hsl(var(--foreground))"
        >
          {completionRate}%
        </tspan>
        <tspan
          x="50%"
          dy="1.5em"
          fontSize="12"
          fill="hsl(var(--muted-foreground))"
        >
          Tamamlandı
        </tspan>
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold">{payload[0].name}</p>
          <p className="text-xs text-muted-foreground">
            {payload[0].value} sertifika ({Math.round((payload[0].value / total) * 100)}%)
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
            <Award className="h-5 w-5" />
            Sertifika Dağılımı
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
          <Award className="h-5 w-5" />
          Sertifika Dağılımı
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Toplam {total} sertifika
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {renderCustomLabel()}
          </PieChart>
        </ResponsiveContainer>

        {/* Stats below chart */}
        <div className="flex justify-around mt-4 border-t pt-4">
          {data.map((item) => (
            <div key={item.name} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/affexai/admin/certificates">
            Tümünü Gör <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

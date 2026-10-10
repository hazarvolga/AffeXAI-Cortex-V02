'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TopPerformingCampaigns } from '@/lib/api/analyticsService';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface CampaignPerformanceTableProps {
  campaigns: TopPerformingCampaigns[];
  showAllColumns?: boolean;
}

export default function CampaignPerformanceTable({ 
  campaigns,
  showAllColumns = false 
}: CampaignPerformanceTableProps) {
  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge variant="default" className="bg-green-500">
          <Trophy className="w-3 h-3 mr-1" />
          Mükemmel
        </Badge>
      );
    } else if (score >= 60) {
      return (
        <Badge variant="default" className="bg-blue-500">
          <TrendingUp className="w-3 h-3 mr-1" />
          İyi
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <TrendingDown className="w-3 h-3 mr-1" />
          Ortalama
        </Badge>
      );
    }
  };

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Kampanya verisi bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kampanya</TableHead>
            <TableHead>Gönderim</TableHead>
            <TableHead className="text-right">Açılma</TableHead>
            <TableHead className="text-right">Tıklama</TableHead>
            {showAllColumns && (
              <>
                <TableHead className="text-right">Dönüşüm</TableHead>
                <TableHead className="text-right">Gelir</TableHead>
              </>
            )}
            <TableHead className="text-right">Performans</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.campaignId}>
              <TableCell className="font-medium">
                {campaign.campaignName}
              </TableCell>
              <TableCell>{formatDate(campaign.sentAt)}</TableCell>
              <TableCell className="text-right">
                {formatPercentage(campaign.openRate)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercentage(campaign.clickRate)}
              </TableCell>
              {showAllColumns && (
                <>
                  <TableCell className="text-right">
                    {formatPercentage(campaign.conversionRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(campaign.revenue)}
                  </TableCell>
                </>
              )}
              <TableCell className="text-right">
                {getPerformanceBadge(campaign.score)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
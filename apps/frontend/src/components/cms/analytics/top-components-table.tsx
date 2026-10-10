'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ExternalLink } from 'lucide-react';
import type { ComponentRanking } from '@/lib/api/cmsAnalyticsService';

interface TopComponentsTableProps {
  components: ComponentRanking[];
  isLoading?: boolean;
}

export function TopComponentsTable({ components, isLoading }: TopComponentsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInteractionRateColor = (rate: number) => {
    if (rate >= 75) return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (rate >= 50) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (rate >= 25) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>En Çok Etkileşim Alan Component'ler</CardTitle>
        <CardDescription>
          Kullanıcı etkileşim oranına göre sıralanmış component'ler
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Sıra</TableHead>
              <TableHead>Component ID</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Sayfa</TableHead>
              <TableHead className="text-right">Etkileşim Oranı</TableHead>
              <TableHead className="text-right">Dönüşüm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Henüz veri yok
                </TableCell>
              </TableRow>
            ) : (
              components.map((component, index) => (
                <TableRow key={component.componentId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {index + 1}
                      {index < 3 && (
                        <TrendingUp className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {component.componentId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{component.componentType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <a
                      href={component.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {component.pageUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={getInteractionRateColor(component.interactionRate)}
                    >
                      {component.interactionRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {component.conversions}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

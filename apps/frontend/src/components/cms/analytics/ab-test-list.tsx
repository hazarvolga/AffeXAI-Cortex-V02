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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Play, Pause, CheckCircle, MoreVertical, Edit, Trash2, TrendingUp } from 'lucide-react';
import type { ABTest, ABTestStatus } from '@/lib/api/cmsAnalyticsService';

interface ABTestListProps {
  tests: ABTest[];
  isLoading?: boolean;
  onStart?: (id: string) => void;
  onPause?: (id: string) => void;
  onComplete?: (id: string, winnerId?: string) => void;
  onEdit?: (test: ABTest) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Taslak',
    variant: 'secondary' as const,
    color: 'text-gray-600',
  },
  running: {
    label: 'Çalışıyor',
    variant: 'default' as const,
    color: 'text-green-600',
  },
  paused: {
    label: 'Duraklatıldı',
    variant: 'outline' as const,
    color: 'text-yellow-600',
  },
  completed: {
    label: 'Tamamlandı',
    variant: 'outline' as const,
    color: 'text-blue-600',
  },
};

export function ABTestList({
  tests,
  isLoading,
  onStart,
  onPause,
  onComplete,
  onEdit,
  onDelete,
}: ABTestListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getWinnerVariant = (test: ABTest) => {
    if (!test.winnerVariantId) return null;
    return test.variants.find((v) => v.id === test.winnerVariantId);
  };

  const getBestVariant = (test: ABTest) => {
    return test.variants.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>A/B Testleri</CardTitle>
        <CardDescription>
          {tests.length} test · Aktif testlerinizi yönetin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Adı</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Variant Sayısı</TableHead>
              <TableHead>En İyi Performans</TableHead>
              <TableHead>Güven Seviyesi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Henüz A/B testi oluşturulmamış
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => {
                const statusConfig = STATUS_CONFIG[test.status];
                const winner = getWinnerVariant(test);
                const bestVariant = getBestVariant(test);

                return (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{test.name}</span>
                        {test.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {test.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <code className="text-xs font-mono">{test.componentId}</code>
                        <span className="text-xs text-muted-foreground">
                          {test.componentType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{test.variants.length} variant</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{bestVariant.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {bestVariant.conversionRate.toFixed(2)}% dönüşüm
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {test.confidenceLevel ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="font-medium">{test.confidenceLevel}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Actions */}
                        {test.status === 'draft' && onStart && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStart(test.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Başlat
                          </Button>
                        )}
                        {test.status === 'running' && onPause && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPause(test.id)}
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Duraklat
                          </Button>
                        )}
                        {test.status === 'running' && onComplete && test.confidenceLevel && test.confidenceLevel >= 95 && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onComplete(test.id, bestVariant.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Tamamla
                          </Button>
                        )}

                        {/* More Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(test)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(test.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

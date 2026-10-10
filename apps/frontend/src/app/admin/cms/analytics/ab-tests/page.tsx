'use client';

import { useState, useEffect } from 'react';
import { ABTestList } from '@/components/cms/analytics/ab-test-list';
import { ABTestFormDialog } from '@/components/cms/analytics/ab-test-form-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlaskConical, Plus, RefreshCw } from 'lucide-react';
import { cmsAnalyticsService } from '@/lib/api/cmsAnalyticsService';
import type { ABTest, ABTestStatus, CreateABTestDto } from '@/lib/api/cmsAnalyticsService';

export default function ABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<ABTest[]>([]);
  const [statusFilter, setStatusFilter] = useState<ABTestStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<ABTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await cmsAnalyticsService.getAllABTests();
      setTests(data);
      applyFilter(data, statusFilter);
    } catch (err) {
      console.error('AB tests fetch error:', err);
      setError('A/B testleri yüklenirken bir hata oluştu.');
      setTests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (testList: ABTest[], status: ABTestStatus | 'all') => {
    if (status === 'all') {
      setFilteredTests(testList);
    } else {
      setFilteredTests(testList.filter((t) => t.status === status));
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    applyFilter(tests, statusFilter);
  }, [statusFilter, tests]);

  const handleCreate = async (data: CreateABTestDto) => {
    setIsSubmitting(true);
    try {
      await cmsAnalyticsService.createABTest(data);
      setIsDialogOpen(false);
      setEditingTest(null);
      fetchTests();
    } catch (err) {
      console.error('Create AB test error:', err);
      alert('Test oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await cmsAnalyticsService.startABTest(id);
      fetchTests();
    } catch (err) {
      console.error('Start AB test error:', err);
      alert('Test başlatılırken bir hata oluştu.');
    }
  };

  const handlePause = async (id: string) => {
    try {
      await cmsAnalyticsService.pauseABTest(id);
      fetchTests();
    } catch (err) {
      console.error('Pause AB test error:', err);
      alert('Test duraklatılırken bir hata oluştu.');
    }
  };

  const handleComplete = async (id: string, winnerId?: string) => {
    try {
      await cmsAnalyticsService.completeABTest(id, winnerId);
      fetchTests();
    } catch (err) {
      console.error('Complete AB test error:', err);
      alert('Test tamamlanırken bir hata oluştu.');
    }
  };

  const handleEdit = (test: ABTest) => {
    setEditingTest(test);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu testi silmek istediğinizden emin misiniz?')) return;

    try {
      await cmsAnalyticsService.deleteABTest(id);
      fetchTests();
    } catch (err) {
      console.error('Delete AB test error:', err);
      alert('Test silinirken bir hata oluştu.');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTest(null);
    }
  };

  const stats = {
    total: tests.length,
    running: tests.filter((t) => t.status === 'running').length,
    completed: tests.filter((t) => t.status === 'completed').length,
    draft: tests.filter((t) => t.status === 'draft').length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            A/B Test Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Component variant'larını test edin ve optimize edin
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTests}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Test
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Toplam Test</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Çalışıyor</div>
          <div className="text-2xl font-bold text-green-600">{stats.running}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Tamamlandı</div>
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Taslak</div>
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrele:</span>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ABTestStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü ({tests.length})</SelectItem>
            <SelectItem value="draft">Taslak ({stats.draft})</SelectItem>
            <SelectItem value="running">Çalışıyor ({stats.running})</SelectItem>
            <SelectItem value="paused">Duraklatıldı</SelectItem>
            <SelectItem value="completed">Tamamlandı ({stats.completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tests List */}
      <ABTestList
        tests={filteredTests}
        isLoading={isLoading}
        onStart={handleStart}
        onPause={handlePause}
        onComplete={handleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create/Edit Dialog */}
      <ABTestFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={handleCreate}
        editingTest={editingTest}
        isSubmitting={isSubmitting}
      />

      {/* Guide */}
      {!isLoading && tests.length === 0 && (
        <div className="bg-muted/50 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">🧪 A/B Testing Nasıl Çalışır?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>"Yeni Test" butonuna tıklayın</strong> ve test detaylarını girin
            </li>
            <li>
              <strong>Variant'ları yapılandırın:</strong> En az 2 variant oluşturun (Control + A, B...)
            </li>
            <li>
              <strong>Trafik dağılımını ayarlayın:</strong> Toplam %100 olmalı
            </li>
            <li>
              <strong>Test periyodunu belirleyin:</strong> Başlangıç ve bitiş tarihleri
            </li>
            <li>
              <strong>Testi başlatın:</strong> "Başlat" butonuna tıklayın
            </li>
            <li>
              <strong>Sonuçları izleyin:</strong> Güven seviyesi %95'e ulaştığında kazanan otomatik belirlenir
            </li>
          </ol>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>İpucu:</strong> En az 1000 görüntülenme ve %95 güven seviyesi için bekleyin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  HardDrive,
  Download,
  Trash2,
  Cloud,
  RefreshCw,
  Play,
  Settings,
  Clock,
  Database,
  Image,
  FileCode,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Upload,
  Save,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react';
import backupService, {
  Backup,
  BackupConfig,
  BackupType,
  CloudDestination,
  CreateBackupDto,
  BackupConfigDto
} from '@/lib/api/backupService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Cloud configuration state interfaces (flat structure matching backend)
interface S3ConfigState {
  awsS3Bucket: string;
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
}

interface GoogleDriveConfigState {
  googleDriveClientId: string;
  googleDriveClientSecret: string;
  googleDriveRefreshToken: string;
}

interface OneDriveConfigState {
  oneDriveClientId: string;
  oneDriveClientSecret: string;
  oneDriveRefreshToken: string;
}

export default function BackupSettingsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBackupType, setNewBackupType] = useState<BackupType>('full');
  const [selectedDestinations, setSelectedDestinations] = useState<CloudDestination[]>([]);

  // Cloud config states (flat structure)
  const [s3Config, setS3Config] = useState<S3ConfigState>({
    awsS3Bucket: '',
    awsRegion: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: ''
  });
  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfigState>({
    googleDriveClientId: '',
    googleDriveClientSecret: '',
    googleDriveRefreshToken: ''
  });
  const [oneDriveConfig, setOneDriveConfig] = useState<OneDriveConfigState>({
    oneDriveClientId: '',
    oneDriveClientSecret: '',
    oneDriveRefreshToken: ''
  });

  // Connection test states
  const [s3Testing, setS3Testing] = useState(false);
  const [s3Connected, setS3Connected] = useState<boolean | null>(null);
  const [googleDriveTesting, setGoogleDriveTesting] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean | null>(null);
  const [oneDriveTesting, setOneDriveTesting] = useState(false);
  const [oneDriveConnected, setOneDriveConnected] = useState<boolean | null>(null);

  // Saving states
  const [s3Saving, setS3Saving] = useState(false);
  const [googleDriveSaving, setGoogleDriveSaving] = useState(false);
  const [oneDriveSaving, setOneDriveSaving] = useState(false);

  // Fetch backups
  const { data: backups = [], isLoading: backupsLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupService.getAllBackups(),
  });

  // Fetch config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['backup-config'],
    queryFn: () => backupService.getConfig(),
  });

  // Populate cloud configs from fetched config
  useEffect(() => {
    if (config) {
      // AWS S3
      setS3Config({
        awsS3Bucket: config.awsS3Bucket || '',
        awsRegion: config.awsRegion || '',
        awsAccessKeyId: config.awsAccessKeyId || '',
        awsSecretAccessKey: config.awsSecretAccessKey || ''
      });
      // Google Drive
      setGoogleDriveConfig({
        googleDriveClientId: config.googleDriveClientId || '',
        googleDriveClientSecret: config.googleDriveClientSecret || '',
        googleDriveRefreshToken: config.googleDriveRefreshToken || ''
      });
      // OneDrive
      setOneDriveConfig({
        oneDriveClientId: config.oneDriveClientId || '',
        oneDriveClientSecret: config.oneDriveClientSecret || '',
        oneDriveRefreshToken: config.oneDriveRefreshToken || ''
      });
    }
  }, [config]);

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: (dto: CreateBackupDto) => backupService.createBackup(dto),
    onSuccess: () => {
      toast.success('Yedekleme başlatıldı');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Yedekleme başlatılamadı');
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => backupService.deleteBackup(id),
    onSuccess: () => {
      toast.success('Yedek silindi');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Yedek silinemedi');
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (dto: BackupConfigDto) => backupService.updateConfig(dto),
    onSuccess: () => {
      toast.success('Ayarlar kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['backup-config'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ayarlar kaydedilemedi');
    },
  });

  // Download backup
  const handleDownload = async (backup: Backup) => {
    try {
      const blob = await backupService.downloadBackup(backup.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.name || `backup-${backup.id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Yedek indiriliyor...');
    } catch (error: any) {
      toast.error(error.message || 'Yedek indirilemedi');
    }
  };

  // Create new backup
  const handleCreateBackup = () => {
    createBackupMutation.mutate({
      type: newBackupType,
      uploadTo: selectedDestinations.length > 0 ? selectedDestinations : undefined,
    });
  };

  // Save S3 config
  const handleSaveS3Config = async () => {
    setS3Saving(true);
    try {
      await updateConfigMutation.mutateAsync({
        awsS3Bucket: s3Config.awsS3Bucket,
        awsRegion: s3Config.awsRegion,
        awsAccessKeyId: s3Config.awsAccessKeyId,
        awsSecretAccessKey: s3Config.awsSecretAccessKey
      });
      toast.success('AWS S3 ayarları kaydedildi');
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setS3Saving(false);
    }
  };

  // Test S3 connection
  const handleTestS3 = async () => {
    setS3Testing(true);
    setS3Connected(null);
    try {
      const result = await backupService.testCloudConnection('aws_s3');
      setS3Connected(result.connected);
      if (result.connected) {
        toast.success('AWS S3 bağlantısı başarılı');
      } else {
        toast.error('AWS S3 bağlantısı başarısız');
      }
    } catch (error: any) {
      setS3Connected(false);
      toast.error(error.message || 'AWS S3 bağlantı testi başarısız');
    } finally {
      setS3Testing(false);
    }
  };

  // Save Google Drive config
  const handleSaveGoogleDriveConfig = async () => {
    setGoogleDriveSaving(true);
    try {
      await updateConfigMutation.mutateAsync({
        googleDriveClientId: googleDriveConfig.googleDriveClientId,
        googleDriveClientSecret: googleDriveConfig.googleDriveClientSecret,
        googleDriveRefreshToken: googleDriveConfig.googleDriveRefreshToken
      });
      toast.success('Google Drive ayarları kaydedildi');
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setGoogleDriveSaving(false);
    }
  };

  // Test Google Drive connection
  const handleTestGoogleDrive = async () => {
    setGoogleDriveTesting(true);
    setGoogleDriveConnected(null);
    try {
      const result = await backupService.testCloudConnection('google_drive');
      setGoogleDriveConnected(result.connected);
      if (result.connected) {
        toast.success('Google Drive bağlantısı başarılı');
      } else {
        toast.error('Google Drive bağlantısı başarısız');
      }
    } catch (error: any) {
      setGoogleDriveConnected(false);
      toast.error(error.message || 'Google Drive bağlantı testi başarısız');
    } finally {
      setGoogleDriveTesting(false);
    }
  };

  // Save OneDrive config
  const handleSaveOneDriveConfig = async () => {
    setOneDriveSaving(true);
    try {
      await updateConfigMutation.mutateAsync({
        oneDriveClientId: oneDriveConfig.oneDriveClientId,
        oneDriveClientSecret: oneDriveConfig.oneDriveClientSecret,
        oneDriveRefreshToken: oneDriveConfig.oneDriveRefreshToken
      });
      toast.success('OneDrive ayarları kaydedildi');
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setOneDriveSaving(false);
    }
  };

  // Test OneDrive connection
  const handleTestOneDrive = async () => {
    setOneDriveTesting(true);
    setOneDriveConnected(null);
    try {
      const result = await backupService.testCloudConnection('onedrive');
      setOneDriveConnected(result.connected);
      if (result.connected) {
        toast.success('OneDrive bağlantısı başarılı');
      } else {
        toast.error('OneDrive bağlantısı başarısız');
      }
    } catch (error: any) {
      setOneDriveConnected(false);
      toast.error(error.message || 'OneDrive bağlantı testi başarısız');
    } finally {
      setOneDriveTesting(false);
    }
  };

  // Get backup type icon
  const getTypeIcon = (type: BackupType) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'media':
        return <Image className="h-4 w-4" />;
      case 'config':
        return <FileCode className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Tamamlandı</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Devam Ediyor</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Başarısız</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Bekliyor</Badge>;
    }
  };

  // Get connection status badge
  const getConnectionBadge = (connected: boolean | null, testing: boolean) => {
    if (testing) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Test Ediliyor
        </Badge>
      );
    }
    if (connected === true) {
      return (
        <Badge variant="default" className="bg-green-500 gap-1">
          <Wifi className="h-3 w-3" />
          Bağlı
        </Badge>
      );
    }
    if (connected === false) {
      return (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Bağlantı Yok
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <WifiOff className="h-3 w-3" />
        Test Edilmedi
      </Badge>
    );
  };

  if (backupsLoading || configLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Yedekleme Yönetimi</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Sistem yedeklerinizi yönetin ve otomatik yedekleme ayarlarını yapılandırın.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Play className="h-4 w-4 mr-2" />
              Yeni Yedek Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Yedek Oluştur</DialogTitle>
              <DialogDescription>
                Yedekleme türünü seçin ve isteğe bağlı olarak bulut depolama hedeflerini belirleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Yedekleme Türü</Label>
                <Select value={newBackupType} onValueChange={(v) => setNewBackupType(v as BackupType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Tam Yedek
                      </div>
                    </SelectItem>
                    <SelectItem value="database">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Sadece Veritabanı
                      </div>
                    </SelectItem>
                    <SelectItem value="media">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Sadece Medya
                      </div>
                    </SelectItem>
                    <SelectItem value="config">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Sadece Konfigürasyon
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bulut Hedefleri (Opsiyonel)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aws_s3"
                      checked={selectedDestinations.includes('aws_s3')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDestinations([...selectedDestinations, 'aws_s3']);
                        } else {
                          setSelectedDestinations(selectedDestinations.filter(d => d !== 'aws_s3'));
                        }
                      }}
                    />
                    <label htmlFor="aws_s3" className="text-sm">AWS S3</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="google_drive"
                      checked={selectedDestinations.includes('google_drive')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDestinations([...selectedDestinations, 'google_drive']);
                        } else {
                          setSelectedDestinations(selectedDestinations.filter(d => d !== 'google_drive'));
                        }
                      }}
                    />
                    <label htmlFor="google_drive" className="text-sm">Google Drive</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onedrive"
                      checked={selectedDestinations.includes('onedrive')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDestinations([...selectedDestinations, 'onedrive']);
                        } else {
                          setSelectedDestinations(selectedDestinations.filter(d => d !== 'onedrive'));
                        }
                      }}
                    />
                    <label htmlFor="onedrive" className="text-sm">OneDrive</label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                İptal
              </Button>
              <Button onClick={handleCreateBackup} disabled={createBackupMutation.isPending} className="w-full sm:w-auto">
                {createBackupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Yedeklemeyi Başlat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="backups" className="text-xs sm:text-sm">
            <HardDrive className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Yedekler</span>
            <span className="sm:hidden">Yedek</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Ayarlar</span>
            <span className="sm:hidden">Ayar</span>
          </TabsTrigger>
          <TabsTrigger value="cloud" className="text-xs sm:text-sm">
            <Cloud className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Bulut Entegrasyonu</span>
            <span className="sm:hidden">Bulut</span>
          </TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yedek Listesi</CardTitle>
              <CardDescription>
                Oluşturulan tüm yedeklerinizi buradan yönetebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Henüz hiç yedek oluşturulmamış. Yeni bir yedek oluşturmak için yukarıdaki butonu kullanın.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tür</TableHead>
                        <TableHead className="hidden sm:table-cell">Ad</TableHead>
                        <TableHead>Boyut</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="hidden md:table-cell">Tarih</TableHead>
                        <TableHead className="hidden lg:table-cell">Bulut</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(backup.type)}
                              <span className="hidden sm:inline">{backupService.getTypeLabel(backup.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm hidden sm:table-cell">
                            {backup.name}
                          </TableCell>
                          <TableCell>{backupService.formatSize(backup.fileSize)}</TableCell>
                          <TableCell>{getStatusBadge(backup.status)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {format(new Date(backup.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex gap-1">
                              {backup.uploadedTo && backup.uploadedTo.length > 0 ? (
                                backup.uploadedTo.map((dest) => (
                                  <Badge key={dest} variant="outline">{backupService.getDestinationLabel(dest)}</Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-sm">Lokal</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 sm:gap-2">
                              {backup.status === 'completed' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(backup)}
                                    title="İndir"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Upload to cloud dialog
                                    }}
                                    title="Buluta Yükle"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBackupMutation.mutate(backup.id)}
                                disabled={deleteBackupMutation.isPending}
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Otomatik Yedekleme Ayarları</CardTitle>
              <CardDescription>
                Sistemin otomatik yedekleme zamanlamalarını yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otomatik Yedekleme</Label>
                  <p className="text-sm text-muted-foreground">
                    Belirlenen aralıklarla otomatik yedekleme alınsın mı?
                  </p>
                </div>
                <Switch
                  checked={config?.automaticBackupEnabled ?? false}
                  onCheckedChange={(checked) => {
                    updateConfigMutation.mutate({ automaticBackupEnabled: checked });
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cron İfadesi</Label>
                  <Input
                    placeholder="0 2 * * *"
                    value={config?.automaticBackupCron ?? '0 2 * * *'}
                    onChange={(e) => {
                      updateConfigMutation.mutate({ automaticBackupCron: e.target.value });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Örnek: "0 2 * * *" = Her gün saat 02:00
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Varsayılan Saklama Süresi (Gün)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={config?.defaultRetentionDays ?? 30}
                    onChange={(e) => {
                      updateConfigMutation.mutate({ defaultRetentionDays: parseInt(e.target.value) });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloud Integration Tab */}
        <TabsContent value="cloud" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* AWS S3 Card */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Server className="h-5 w-5 text-orange-500" />
                    AWS S3
                  </CardTitle>
                  {getConnectionBadge(s3Connected, s3Testing)}
                </div>
                <CardDescription>
                  Amazon S3 bulut depolama entegrasyonu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="s3-bucket">Bucket Adı</Label>
                  <Input
                    id="s3-bucket"
                    placeholder="my-backup-bucket"
                    value={s3Config.awsS3Bucket}
                    onChange={(e) => setS3Config({ ...s3Config, awsS3Bucket: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3-region">Region</Label>
                  <Input
                    id="s3-region"
                    placeholder="eu-central-1"
                    value={s3Config.awsRegion}
                    onChange={(e) => setS3Config({ ...s3Config, awsRegion: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3-access-key">Access Key ID</Label>
                  <Input
                    id="s3-access-key"
                    type="password"
                    placeholder="AKIA..."
                    value={s3Config.awsAccessKeyId}
                    onChange={(e) => setS3Config({ ...s3Config, awsAccessKeyId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3-secret-key">Secret Access Key</Label>
                  <Input
                    id="s3-secret-key"
                    type="password"
                    placeholder="••••••••"
                    value={s3Config.awsSecretAccessKey}
                    onChange={(e) => setS3Config({ ...s3Config, awsSecretAccessKey: e.target.value })}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleTestS3}
                    disabled={s3Testing || !s3Config.awsS3Bucket || !s3Config.awsRegion || !s3Config.awsAccessKeyId || !s3Config.awsSecretAccessKey}
                  >
                    {s3Testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Bağlantıyı Test Et
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveS3Config}
                    disabled={s3Saving || !s3Config.awsS3Bucket || !s3Config.awsRegion || !s3Config.awsAccessKeyId || !s3Config.awsSecretAccessKey}
                  >
                    {s3Saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Drive Card */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Cloud className="h-5 w-5 text-blue-500" />
                    Google Drive
                  </CardTitle>
                  {getConnectionBadge(googleDriveConnected, googleDriveTesting)}
                </div>
                <CardDescription>
                  Google Drive bulut depolama entegrasyonu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gdrive-client-id">Client ID</Label>
                  <Input
                    id="gdrive-client-id"
                    placeholder="xxx.apps.googleusercontent.com"
                    value={googleDriveConfig.googleDriveClientId}
                    onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, googleDriveClientId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gdrive-client-secret">Client Secret</Label>
                  <Input
                    id="gdrive-client-secret"
                    type="password"
                    placeholder="••••••••"
                    value={googleDriveConfig.googleDriveClientSecret}
                    onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, googleDriveClientSecret: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gdrive-refresh-token">Refresh Token</Label>
                  <Input
                    id="gdrive-refresh-token"
                    type="password"
                    placeholder="••••••••"
                    value={googleDriveConfig.googleDriveRefreshToken}
                    onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, googleDriveRefreshToken: e.target.value })}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleTestGoogleDrive}
                    disabled={googleDriveTesting || !googleDriveConfig.googleDriveClientId || !googleDriveConfig.googleDriveClientSecret || !googleDriveConfig.googleDriveRefreshToken}
                  >
                    {googleDriveTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Bağlantıyı Test Et
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveGoogleDriveConfig}
                    disabled={googleDriveSaving || !googleDriveConfig.googleDriveClientId || !googleDriveConfig.googleDriveClientSecret || !googleDriveConfig.googleDriveRefreshToken}
                  >
                    {googleDriveSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OneDrive Card */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Cloud className="h-5 w-5 text-sky-500" />
                    OneDrive
                  </CardTitle>
                  {getConnectionBadge(oneDriveConnected, oneDriveTesting)}
                </div>
                <CardDescription>
                  Microsoft OneDrive bulut depolama entegrasyonu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="onedrive-client-id">Client ID</Label>
                  <Input
                    id="onedrive-client-id"
                    placeholder="xxx-xxx-xxx"
                    value={oneDriveConfig.oneDriveClientId}
                    onChange={(e) => setOneDriveConfig({ ...oneDriveConfig, oneDriveClientId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onedrive-client-secret">Client Secret</Label>
                  <Input
                    id="onedrive-client-secret"
                    type="password"
                    placeholder="••••••••"
                    value={oneDriveConfig.oneDriveClientSecret}
                    onChange={(e) => setOneDriveConfig({ ...oneDriveConfig, oneDriveClientSecret: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onedrive-refresh-token">Refresh Token</Label>
                  <Input
                    id="onedrive-refresh-token"
                    type="password"
                    placeholder="••••••••"
                    value={oneDriveConfig.oneDriveRefreshToken}
                    onChange={(e) => setOneDriveConfig({ ...oneDriveConfig, oneDriveRefreshToken: e.target.value })}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleTestOneDrive}
                    disabled={oneDriveTesting || !oneDriveConfig.oneDriveClientId || !oneDriveConfig.oneDriveClientSecret || !oneDriveConfig.oneDriveRefreshToken}
                  >
                    {oneDriveTesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Bağlantıyı Test Et
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveOneDriveConfig}
                    disabled={oneDriveSaving || !oneDriveConfig.oneDriveClientId || !oneDriveConfig.oneDriveClientSecret || !oneDriveConfig.oneDriveRefreshToken}
                  >
                    {oneDriveSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

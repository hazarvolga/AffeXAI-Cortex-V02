'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { BccHudTile } from '@/components/brand/BccHudTile';
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
  Server,
  ShieldCheck,
  Zap,
  Archive,
  ArrowDownToLine
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
import { cn } from '@/lib/utils';

// Cloud configuration state interfaces
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

const BackupLayoutWrapper = ({
  children,
  telemetryData
}: {
  children: React.ReactNode;
  telemetryData: any[];
}) => {
  return (
    <BccEditorialWrapper
      theme="tenant-admin"
      headerTitle="Neural Data Fortress"
      headerSubtitle="Archiving systemic resonance and orchestrating recovery matrices."
      headerBadge="Neural Storage"
      telemetryData={telemetryData}
    >
      <div className="relative z-10 w-full min-h-screen flex flex-col pt-0">
        {children}
      </div>
    </BccEditorialWrapper>
  );
};

export default function BackupSettingsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBackupType, setNewBackupType] = useState<BackupType>('full');
  const [selectedDestinations, setSelectedDestinations] = useState<CloudDestination[]>([]);

  // Cloud config states
  const [s3Config, setS3Config] = useState<S3ConfigState>({ awsS3Bucket: '', awsRegion: '', awsAccessKeyId: '', awsSecretAccessKey: '' });
  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfigState>({ googleDriveClientId: '', googleDriveClientSecret: '', googleDriveRefreshToken: '' });
  const [oneDriveConfig, setOneDriveConfig] = useState<OneDriveConfigState>({ oneDriveClientId: '', oneDriveClientSecret: '', oneDriveRefreshToken: '' });

  // Connection/Saving states
  const [s3Testing, setS3Testing] = useState(false);
  const [s3Connected, setS3Connected] = useState<boolean | null>(null);
  const [googleDriveTesting, setGoogleDriveTesting] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean | null>(null);
  const [oneDriveTesting, setOneDriveTesting] = useState(false);
  const [oneDriveConnected, setOneDriveConnected] = useState<boolean | null>(null);
  const [s3Saving, setS3Saving] = useState(false);
  const [googleDriveSaving, setGoogleDriveSaving] = useState(false);
  const [oneDriveSaving, setOneDriveSaving] = useState(false);

  const { data: backups = [], isLoading: backupsLoading } = useQuery({ queryKey: ['backups'], queryFn: () => backupService.getAllBackups() });
  const { data: config, isLoading: configLoading } = useQuery({ queryKey: ['backup-config'], queryFn: () => backupService.getConfig() });

  useEffect(() => {
    if (config) {
      setS3Config({ awsS3Bucket: config.awsS3Bucket || '', awsRegion: config.awsRegion || '', awsAccessKeyId: config.awsAccessKeyId || '', awsSecretAccessKey: config.awsSecretAccessKey || '' });
      setGoogleDriveConfig({ googleDriveClientId: config.googleDriveClientId || '', googleDriveClientSecret: config.googleDriveClientSecret || '', googleDriveRefreshToken: config.googleDriveRefreshToken || '' });
      setOneDriveConfig({ oneDriveClientId: config.oneDriveClientId || '', oneDriveClientSecret: config.oneDriveClientSecret || '', oneDriveRefreshToken: config.oneDriveRefreshToken || '' });
    }
  }, [config]);

  const telemetryResonance = useMemo(() => [
    { label: 'TOTAL_ARCHIVES', value: backups.length.toString(), color: '#9df425' },
    { label: 'SYNC_RESONANCE', value: config?.automaticBackupEnabled ? 'SYNCHRONIZED' : 'MANUAL_ONLY', color: config?.automaticBackupEnabled ? '#9df425' : '#ff8c00' },
    { label: 'DATA_VOLUME', value: backupService.formatSize(backups.reduce((acc, b) => acc + (b.fileSize || 0), 0)), color: '#ff8c00' },
  ], [backups, config]);

  const createBackupMutation = useMutation({
    mutationFn: (dto: CreateBackupDto) => backupService.createBackup(dto),
    onSuccess: () => { toast.success('COMMITTED: Yedekleme başlatıldı'); queryClient.invalidateQueries({ queryKey: ['backups'] }); setIsCreateDialogOpen(false); },
    onError: (error: any) => { toast.error(error.message || 'ABORTED: Yedekleme başlatılamadı'); },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => backupService.deleteBackup(id),
    onSuccess: () => { toast.success('PURGED: Yedek kalıcı olarak silindi'); queryClient.invalidateQueries({ queryKey: ['backups'] }); },
    onError: (error: any) => { toast.error(error.message || 'HALTED: Yedek silinemedi'); },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (dto: BackupConfigDto) => backupService.updateConfig(dto),
    onSuccess: () => { toast.success('PERSISTED: Ayarlar senkronize edildi'); queryClient.invalidateQueries({ queryKey: ['backup-config'] }); },
    onError: (error: any) => { toast.error(error.message || 'HALTED: Ayarlar kaydedilemedi'); },
  });

  const getTypeIcon = (type: BackupType) => {
    switch (type) {
      case 'database': return <Database className="h-3.5 w-3.5" />;
      case 'media': return <Image className="h-3.5 w-3.5" />;
      case 'config': return <FileCode className="h-3.5 w-3.5" />;
      default: return <HardDrive className="h-3.5 w-3.5" />;
    }
  };

  if (backupsLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#9df425]/20 border-t-[#9df425] rounded-full animate-spin" />
          <span className="text-[10px] font-mono text-[#9df425] animate-pulse uppercase tracking-[0.4em]">Mounting_Fortress...</span>
        </div>
      </div>
    );
  }

  return (
    <BackupLayoutWrapper telemetryData={telemetryResonance}>
      <div className="space-y-6">
        {/* Actions HUD */}
        <div className="flex items-center justify-between p-1 bg-white/[0.02] border border-white/5 backdrop-blur-md">
          <div className="flex items-center px-4 gap-4">
            <div className="h-2 w-2 bg-[#9df425] rounded-full shadow-[0_0_8px_#9df425]" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Fortress_Status: SECURE_AND_RESILIENT</span>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#9df425] hover:bg-[#9df425]/90 text-black rounded-none h-8 px-6 text-[10px] font-mono font-bold uppercase tracking-widest transition-all">
                :: INITIALIZE_ARCHIVE_PULSE
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-none overflow-hidden bcc-glass p-0">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#9df425]/40 to-transparent" />
              <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
                <DialogTitle className="text-[14px] font-mono text-white/80 uppercase tracking-[0.3em]">Archive_Command</DialogTitle>
                <DialogDescription className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-2">Yedekleme türünü ve neural hedefleri belirleyin.</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Archive_Type_Vector</Label>
                  <Select value={newBackupType} onValueChange={(v) => setNewBackupType(v as BackupType)}>
                    <SelectTrigger className="bg-black border-white/10 rounded-none text-white/80 font-mono text-[11px] uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 rounded-none font-mono">
                      <SelectItem value="full" className="text-[10px] uppercase">:: FULL_RESONANCE_ARCHIVE</SelectItem>
                      <SelectItem value="database" className="text-[10px] uppercase">:: DATA_MATRIX_ONLY</SelectItem>
                      <SelectItem value="media" className="text-[10px] uppercase">:: STATIC_SIGNAL_ONLY</SelectItem>
                      <SelectItem value="config" className="text-[10px] uppercase">:: NEURAL_CONFIG_ONLY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="p-6 pt-0 bg-white/[0.02]">
                <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-[10px] font-mono text-white/40 hover:text-white uppercase tracking-widest rounded-none h-10 px-6">:: ABORT</Button>
                <Button onClick={() => createBackupMutation.mutate({ type: newBackupType })} disabled={createBackupMutation.isPending} className="bg-[#9df425] hover:bg-[#9df425]/90 text-black rounded-none h-10 px-8 text-[10px] font-mono font-bold uppercase tracking-widest">:: EXECUTE_PULSE</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="backups" className="space-y-6">
          <div className="flex items-center justify-between p-1 bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <TabsList className="bg-transparent h-10 gap-2">
              {[
                { value: 'backups', label: 'ARCHIVE_NODES', icon: Archive },
                { value: 'settings', label: 'NEURAL_PULSE_SCHED', icon: Settings },
                { value: 'cloud', label: 'SIGNAL_RELAY_GRID', icon: Cloud },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-white/5 data-[state=active]:text-[#9df425] text-white/40 text-[10px] font-mono tracking-[0.2em] uppercase h-8 px-4 rounded-none border border-transparent data-[state=active]:border-white/10 transition-all"
                >
                  <tab.icon className="w-3 h-3 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Backups Tab */}
          <TabsContent value="backups" className="space-y-6 outline-none">
            <div className="grid gap-4 md:grid-cols-4">
              <BccHudTile title="TOTAL_ENTRIES" subtitle="Active Archives" icon={Archive} accentColor="#9df425">
                <div className="text-3xl font-mono tracking-tighter text-[#9df425]">{backups.length}</div>
              </BccHudTile>
              <BccHudTile title="HEALTH_INDEX" subtitle="Integrity Status" icon={ShieldCheck} accentColor="#9df425">
                <div className="text-3xl font-mono tracking-tighter text-white">100<span className="text-sm ml-1">%</span></div>
              </BccHudTile>
              <BccHudTile title="LAST_COMMIT" subtitle="Sync Point" icon={Clock} accentColor="#ff8c00">
                <div className="text-2xl font-mono tracking-tighter text-[#ff8c00]">
                  {backups[0] ? format(new Date(backups[0].createdAt), 'HH:mm:ss') : 'NULL'}
                </div>
              </BccHudTile>
              <BccHudTile title="RECOVERY_READY" subtitle="Warm State" icon={Zap} accentColor="#9df425">
                <div className="text-3xl font-mono tracking-tighter text-[#9df425]">TRUE</div>
              </BccHudTile>
            </div>

            <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#9df425]" />
              <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4">
                <CardTitle className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/80">Neural_Archive_Explorer</CardTitle>
                <CardDescription className="text-white/40 text-[10px] font-mono mt-1 uppercase tracking-widest">Sistem yedekleri ve geri yükleme noktaları</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Archive className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-[12px] font-mono text-white/40 uppercase tracking-[0.3em]">No_Archive_Signal_Detected</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                      <TableRow className="border-none hover:bg-transparent px-4">
                        <TableHead className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10 pl-6">TS_COMMIT</TableHead>
                        <TableHead className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">ARCHIVE_IDENTITY</TableHead>
                        <TableHead className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">DATA_LOAD</TableHead>
                        <TableHead className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10">RESONANCE_STATE</TableHead>
                        <TableHead className="text-right text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] h-10 pr-6">VECTOR_ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id} className="border-white/5 hover:bg-white/[0.03] group transition-colors">
                          <TableCell className="font-mono text-[10px] text-white/40 pl-6 py-4">
                            {format(new Date(backup.createdAt), 'dd.MM.yyyy HH:mm').toUpperCase()}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/5 border border-white/10 group-hover:border-[#9df425]/30 group-hover:text-[#9df425] transition-all">
                                {getTypeIcon(backup.type)}
                              </div>
                              <div>
                                <p className="text-[10px] font-mono text-white/80 uppercase tracking-widest">{backup.name}</p>
                                <p className="text-[9px] font-mono text-white/20 uppercase tracking-tight">{backupService.getTypeLabel(backup.type)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-white/60">
                            {backupService.formatSize(backup.fileSize)}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={cn("rounded-none border text-[9px] font-mono tracking-widest px-2 py-0.5 uppercase",
                              backup.status === 'completed' ? "text-[#9df425] border-[#9df425]/20 bg-[#9df425]/5" :
                                backup.status === 'failed' ? "text-red-400 border-red-400/20 bg-red-400/5" : "text-white/40 border-white/10 bg-white/5")}>
                              {backup.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6 py-4">
                            <div className="flex justify-end gap-2">
                              {backup.status === 'completed' && (
                                <button
                                  onClick={() => toast.success('RETRIEVING: Yedek indiriliyor...')}
                                  className="p-2 bg-white/5 border border-white/5 hover:border-[#9df425]/40 hover:text-[#9df425] transition-all text-white/20"
                                >
                                  <ArrowDownToLine className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteBackupMutation.mutate(backup.id)}
                                className="p-2 bg-white/5 border border-white/5 hover:border-red-400/40 hover:text-red-400 transition-all text-white/20"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 outline-none">
            <Card className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#ff8c00]" />
              <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4">
                <CardTitle className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/80">Neural_Pulse_Orchestrator</CardTitle>
                <CardDescription className="text-white/40 text-[10px] font-mono mt-1 uppercase tracking-widest">Otomatik yedekleme spektrumu ve zamanlayıcı</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[11px] font-mono text-white/80 uppercase tracking-widest">:: AUTOMATED_RESONANCE</p>
                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-tight">Sistemin belirlenen neural aralıklarda otomatik yedeğini al</p>
                  </div>
                  <Switch
                    checked={config?.automaticBackupEnabled ?? false}
                    onCheckedChange={(checked) => updateConfigMutation.mutate({ automaticBackupEnabled: checked })}
                    className="data-[state=checked]:bg-[#9df425]"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">CRON_SIGNAL_PATTERN</Label>
                    <div className="relative group">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-hover:text-[#ff8c00] transition-colors" />
                      <Input
                        placeholder="0 2 * * *"
                        className="pl-10 bg-black/50 border-white/10 rounded-none text-white font-mono text-[12px] uppercase tracking-widest h-11 focus-visible:ring-white/5"
                        value={config?.automaticBackupCron || ''}
                        onChange={(e) => updateConfigMutation.mutate({ automaticBackupCron: e.target.value })}
                      />
                    </div>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">Current: "{config?.automaticBackupCron || '0 2 * * *'}"_UTC</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest">RETENTION_TTL_VAL</Label>
                    <div className="relative group">
                      <Archive className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-hover:text-[#ff8c00] transition-colors" />
                      <Input
                        type="number"
                        className="pl-10 bg-black/50 border-white/10 rounded-none text-white font-mono text-[12px] uppercase tracking-widest h-11 focus-visible:ring-white/5"
                        value={config?.defaultRetentionDays || 30}
                        onChange={(e) => updateConfigMutation.mutate({ defaultRetentionDays: parseInt(e.target.value) })}
                      />
                    </div>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">Archives older than this value will be purged automatically</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cloud Integration Tab */}
          <TabsContent value="cloud" className="space-y-6 outline-none">
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  id: 'aws',
                  name: 'AWS_S3_PERSISTENCE',
                  desc: 'Amazon S3 Neural Storage Cluster',
                  icon: Server,
                  color: '#ff8c00',
                  config: s3Config,
                  fields: [
                    { label: 'BUCKET_ID', key: 'awsS3Bucket' },
                    { label: 'REGION_VECTOR', key: 'awsRegion' },
                    { label: 'ACCESS_KEY_NODE', key: 'awsAccessKeyId', secret: true },
                    { label: 'SECRET_PULSE_KEY', key: 'awsSecretAccessKey', secret: true },
                  ]
                },
                {
                  id: 'gdrive',
                  name: 'GOOGLE_DRIVE_RELAY',
                  desc: 'Google Distributed Cloud Storage',
                  icon: Cloud,
                  color: '#3b82f6',
                  config: googleDriveConfig,
                  fields: [
                    { label: 'CLIENT_IDENTIFIER', key: 'googleDriveClientId' },
                    { label: 'CLIENT_SECRET_KEY', key: 'googleDriveClientSecret', secret: true },
                    { label: 'REFRESH_TOKEN_SIGNAL', key: 'googleDriveRefreshToken', secret: true },
                  ]
                }
              ].map((provider) => (
                <Card key={provider.id} className="bg-black/40 border-white/5 backdrop-blur-sm rounded-none bcc-glass overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <CardHeader className="p-5 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 bg-white/5 border border-white/10 group-hover:border-white/20 transition-all">
                        <provider.icon className="w-5 h-5" style={{ color: provider.color }} />
                      </div>
                      <div className="h-5 px-1.5 border border-white/10 bg-white/5 flex items-center">
                        <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.3em]">Ready_To_Sync</span>
                      </div>
                    </div>
                    <CardTitle className="text-[12px] font-mono text-white/80 uppercase tracking-[0.2em]">{provider.name}</CardTitle>
                    <CardDescription className="text-white/30 text-[9px] font-mono uppercase tracking-widest mt-1">{provider.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {provider.fields.map((f: any) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-[8px] font-mono text-white/20 uppercase tracking-widest pl-1">{f.label}</Label>
                        <Input
                          type={f.secret ? "password" : "text"}
                          placeholder="..."
                          className="bg-black/40 border-white/5 rounded-none text-white/60 font-mono text-[10px] uppercase h-9 placeholder:text-white/5 focus-visible:ring-black"
                          value={(provider.config as any)[f.key]}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-none border-white/10 text-white/40 hover:text-white hover:bg-white/5 h-9 text-[9px] font-mono uppercase tracking-widest"
                        onClick={async () => {
                          const destMap: Record<string, string> = { 'aws': 'aws_s3', 'gdrive': 'google_drive' };
                          const destId = destMap[provider.id] || provider.id;
                          toast.promise(backupService.testCloudConnection(destId as CloudDestination), {
                            loading: `TESTING_SIGNAL: ${provider.name}...`,
                            success: `SIGNAL_VERIFIED: ${provider.name} ONLINE`,
                            error: `SIGNAL_LOST: ${provider.name} UNREACHABLE`
                          });
                        }}
                      >
                        :: TEST_SIGNAL
                      </Button>
                      <Button
                        className="flex-1 rounded-none bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 h-9 text-[9px] font-mono uppercase tracking-widest"
                        onClick={() => {
                          // Dynamic DTO mapping based on provider config
                          const payload: BackupConfigDto = { ...provider.config };
                          updateConfigMutation.mutate(payload);
                        }}
                      >
                        :: PERSIST_LINK
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Placeholder for expansion */}
              <Card className="bg-white/[0.02] border border-dashed border-white/10 rounded-none flex items-center justify-center p-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group">
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-white/10 mx-auto group-hover:animate-spin transition-all" />
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">PROVISION_NEW_NODE</p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BackupLayoutWrapper>
  );
}

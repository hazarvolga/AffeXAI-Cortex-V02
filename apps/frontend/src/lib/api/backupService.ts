import httpClient from './http-client';

// Types matching backend
export type BackupType = 'full' | 'database' | 'media' | 'config';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type CloudDestination = 'aws_s3' | 'google_drive' | 'onedrive' | 'dropbox' | 'ftp';

export interface Backup {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  filePath: string | null;
  fileSize: number | null;
  checksum: string | null;
  isAutomatic: boolean;
  triggeredBy: string | null;
  uploadedTo: CloudDestination[];
  remoteUrls: Record<string, string>;
  metadata: Record<string, any>;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Flat config structure matching backend entity
export interface BackupConfig {
  id: string;
  // Google Drive OAuth
  googleDriveClientId: string | null;
  googleDriveClientSecret: string | null;
  googleDriveRefreshToken: string | null;
  // OneDrive/Microsoft Graph
  oneDriveClientId: string | null;
  oneDriveClientSecret: string | null;
  oneDriveRefreshToken: string | null;
  // Dropbox
  dropboxAccessToken: string | null;
  // FTP/SFTP
  ftpHost: string | null;
  ftpPort: number | null;
  ftpUsername: string | null;
  ftpPassword: string | null;
  ftpPath: string | null;
  // AWS S3
  awsAccessKeyId: string | null;
  awsSecretAccessKey: string | null;
  awsS3Bucket: string | null;
  awsRegion: string | null;
  // Default settings
  defaultRetentionDays: number;
  defaultUploadDestinations: CloudDestination[];
  automaticBackupEnabled: boolean;
  automaticBackupCron: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBackupDto {
  type: BackupType;
  uploadTo?: CloudDestination[];
  retentionDays?: number;
  triggeredBy?: string;
}

// Flat config DTO matching backend
export interface BackupConfigDto {
  // Google Drive OAuth
  googleDriveClientId?: string;
  googleDriveClientSecret?: string;
  googleDriveRefreshToken?: string;
  // OneDrive/Microsoft Graph
  oneDriveClientId?: string;
  oneDriveClientSecret?: string;
  oneDriveRefreshToken?: string;
  // Dropbox
  dropboxAccessToken?: string;
  // FTP/SFTP
  ftpHost?: string;
  ftpPort?: number;
  ftpUsername?: string;
  ftpPassword?: string;
  ftpPath?: string;
  // AWS S3
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsS3Bucket?: string;
  awsRegion?: string;
  // Default settings
  defaultRetentionDays?: number;
  defaultUploadDestinations?: CloudDestination[];
  automaticBackupEnabled?: boolean;
  automaticBackupCron?: string;
}

class BackupService {
  private endpoint = '/backup';

  // Backup CRUD
  async createBackup(dto: CreateBackupDto): Promise<Backup> {
    const response = await httpClient.post<any>(this.endpoint, dto);
    return response.data || response;
  }

  async getAllBackups(): Promise<Backup[]> {
    const response = await httpClient.get<any>(this.endpoint);
    // Handle wrapped response { data: Backup[], success: true } or direct array
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    // Fallback to empty array if response is unexpected
    console.warn('[BackupService] Unexpected response format:', response);
    return [];
  }

  async getBackupById(id: string): Promise<Backup> {
    const response = await httpClient.get<any>(`${this.endpoint}/${id}`);
    return response.data || response;
  }

  async deleteBackup(id: string): Promise<void> {
    return httpClient.delete(`${this.endpoint}/${id}`);
  }

  // Download
  async downloadBackup(id: string): Promise<Blob> {
    const response = await httpClient.getAxiosInstance().get(
      `${this.endpoint}/${id}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Cloud operations
  async uploadBackupToCloud(id: string, destinations: CloudDestination[]): Promise<void> {
    return httpClient.post(`${this.endpoint}/${id}/upload`, { destinations });
  }

  async deleteBackupFromCloud(id: string, destination: CloudDestination): Promise<void> {
    return httpClient.delete(`${this.endpoint}/${id}/cloud/${destination}`);
  }

  async listCloudBackups(destination: CloudDestination): Promise<any[]> {
    const response = await httpClient.get<any>(`${this.endpoint}/cloud/${destination}/list`);
    return response.data || response;
  }

  async testCloudConnection(destination: CloudDestination): Promise<{ connected: boolean }> {
    const response = await httpClient.get<any>(`${this.endpoint}/cloud/${destination}/test`);
    return response.data || response;
  }

  // Config
  async getConfig(): Promise<BackupConfig | null> {
    const response = await httpClient.get<any>(`${this.endpoint}/config/settings`);
    return response.data || response;
  }

  async updateConfig(dto: BackupConfigDto): Promise<BackupConfig> {
    const response = await httpClient.put<any>(`${this.endpoint}/config/settings`, dto);
    return response.data || response;
  }

  async deleteConfig(): Promise<void> {
    return httpClient.delete(`${this.endpoint}/config/settings`);
  }

  // Schedule
  async updateSchedule(): Promise<void> {
    return httpClient.post(`${this.endpoint}/schedule/update`, {});
  }

  async triggerManualBackup(dto: CreateBackupDto): Promise<Backup> {
    const response = await httpClient.post<any>(`${this.endpoint}/schedule/trigger`, dto);
    return response.data || response;
  }

  // Cleanup
  async cleanupExpired(): Promise<void> {
    return httpClient.post(`${this.endpoint}/cleanup/expired`, {});
  }

  // OAuth helpers
  async getGoogleDriveAuthUrl(clientId: string, clientSecret: string): Promise<{ authUrl: string }> {
    const response = await httpClient.get<any>(`${this.endpoint}/oauth/google-drive/url`, {
      params: { clientId, clientSecret }
    });
    return response.data || response;
  }

  async getGoogleDriveRefreshToken(
    clientId: string,
    clientSecret: string,
    code: string
  ): Promise<{ refreshToken: string }> {
    const response = await httpClient.post<any>(`${this.endpoint}/oauth/google-drive/token`, {
      clientId,
      clientSecret,
      code
    });
    return response.data || response;
  }

  async getOneDriveAuthUrl(clientId: string): Promise<{ authUrl: string }> {
    const response = await httpClient.get<any>(`${this.endpoint}/oauth/onedrive/url`, {
      params: { clientId }
    });
    return response.data || response;
  }

  async getOneDriveRefreshToken(
    clientId: string,
    clientSecret: string,
    code: string
  ): Promise<{ refreshToken: string }> {
    const response = await httpClient.post<any>(`${this.endpoint}/oauth/onedrive/token`, {
      clientId,
      clientSecret,
      code
    });
    return response.data || response;
  }

  // Helper: Format file size
  formatSize(bytes: number | null): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Helper: Get status color
  getStatusColor(status: BackupStatus): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  }

  // Helper: Get status label
  getStatusLabel(status: BackupStatus): string {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'failed':
        return 'Başarısız';
      default:
        return 'Bekliyor';
    }
  }

  // Helper: Get type label
  getTypeLabel(type: BackupType): string {
    switch (type) {
      case 'full':
        return 'Tam Yedek';
      case 'database':
        return 'Veritabanı';
      case 'media':
        return 'Medya';
      case 'config':
        return 'Konfigürasyon';
      default:
        return type;
    }
  }

  // Helper: Get cloud destination label
  getDestinationLabel(destination: CloudDestination): string {
    switch (destination) {
      case 'aws_s3':
        return 'AWS S3';
      case 'google_drive':
        return 'Google Drive';
      case 'onedrive':
        return 'OneDrive';
      case 'dropbox':
        return 'Dropbox';
      case 'ftp':
        return 'FTP/SFTP';
      default:
        return destination;
    }
  }
}

export const backupService = new BackupService();
export default backupService;

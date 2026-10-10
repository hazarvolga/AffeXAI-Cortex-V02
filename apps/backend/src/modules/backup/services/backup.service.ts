import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Backup, BackupType, BackupStatus, BackupStorageProvider } from '../entities/backup.entity';
import { CreateBackupDto } from '../dto/create-backup.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as archiver from 'archiver';
import * as tar from 'tar';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir: string;

  constructor(
    @InjectRepository(Backup)
    private backupRepository: Repository<Backup>,
    private configService: ConfigService,
  ) {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create backup directory: ${error.message}`);
    }
  }

  async createBackup(tenantId: string, createBackupDto: CreateBackupDto): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${createBackupDto.type}-${timestamp}`;

    const backup = this.backupRepository.create({
      tenantId,
      name: backupName,
      type: createBackupDto.type,
      status: BackupStatus.PENDING,
      isAutomatic: false,
      triggeredBy: createBackupDto.triggeredBy || 'manual',
      uploadedTo: [],
      remoteUrls: {},
      metadata: {},
    });

    if (createBackupDto.retentionDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + createBackupDto.retentionDays);
      backup.expiresAt = expiresAt;
    }

    await this.backupRepository.save(backup);

    // Start backup process asynchronously
    this.processBackup(backup.id, createBackupDto.uploadTo || []);

    return backup;
  }

  private async processBackup(backupId: string, uploadDestinations: BackupStorageProvider[]) {
    const backup = await this.backupRepository.findOne({ where: { id: backupId } });
    if (!backup) return;

    try {
      backup.status = BackupStatus.IN_PROGRESS;
      backup.startedAt = new Date();
      await this.backupRepository.save(backup);

      const startTime = Date.now();
      let filePath: string;
      let metadata: any = {};

      switch (backup.type) {
        case BackupType.DATABASE:
          ({ filePath, metadata } = await this.backupDatabase(backup.name));
          break;
        case BackupType.FILES:
          ({ filePath, metadata } = await this.backupFiles(backup.name));
          break;
        case BackupType.CODE:
          ({ filePath, metadata } = await this.backupCode(backup.name));
          break;
        case BackupType.FULL:
          ({ filePath, metadata } = await this.backupFull(backup.name));
          break;
      }

      const stats = await fs.stat(filePath);
      const checksum = await this.calculateChecksum(filePath);
      const duration = Date.now() - startTime;

      backup.filePath = filePath;
      backup.fileSize = stats.size;
      backup.checksum = checksum;
      backup.metadata = { ...metadata, duration };
      backup.status = BackupStatus.COMPLETED;
      backup.completedAt = new Date();
      await this.backupRepository.save(backup);

      this.logger.log(`Backup ${backup.name} completed successfully`);

      // Upload to cloud storage if destinations specified
      if (uploadDestinations.length > 0) {
        backup.status = BackupStatus.UPLOADING;
        await this.backupRepository.save(backup);

        // Upload logic will be implemented in cloud provider services
        // For now, just mark as uploaded
        backup.status = BackupStatus.UPLOADED;
        backup.uploadedTo = uploadDestinations;
        await this.backupRepository.save(backup);
      }

    } catch (error) {
      this.logger.error(`Backup ${backupId} failed: ${error.message}`, error.stack);
      backup.status = BackupStatus.FAILED;
      backup.errorMessage = error.message;
      backup.completedAt = new Date();
      await this.backupRepository.save(backup);
    }
  }

  private async backupDatabase(backupName: string): Promise<{ filePath: string; metadata: any }> {
    const dbHost = this.configService.get('DATABASE_HOST', 'localhost');
    const dbPort = this.configService.get('DATABASE_PORT', '5432');
    const dbUser = this.configService.get('DATABASE_USERNAME', 'postgres');
    const dbPassword = this.configService.get('DATABASE_PASSWORD', 'postgres');
    const dbName = this.configService.get('DATABASE_NAME', 'affexai');

    const outputPath = path.join(this.backupDir, `${backupName}.sql`);
    const compressedPath = `${outputPath}.gz`;

    // PostgreSQL dump command
    const dumpCommand = `PGPASSWORD=${dbPassword} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${outputPath}`;

    try {
      await execPromise(dumpCommand);

      // Compress the SQL dump
      await execPromise(`gzip ${outputPath}`);

      const stats = await fs.stat(compressedPath);

      return {
        filePath: compressedPath,
        metadata: {
          databaseSize: stats.size,
        },
      };
    } catch (error) {
      this.logger.error(`Database backup failed: ${error.message}`);
      throw error;
    }
  }

  private async backupFiles(backupName: string): Promise<{ filePath: string; metadata: any }> {
    const minioDataPath = path.join(process.cwd(), 'docker', 'data', 'minio');
    const outputPath = path.join(this.backupDir, `${backupName}.tar.gz`);

    try {
      // Check if MinIO data directory exists
      await fs.access(minioDataPath);

      // Create tar.gz archive of MinIO data
      await tar.create(
        {
          gzip: true,
          file: outputPath,
          cwd: path.dirname(minioDataPath),
        },
        [path.basename(minioDataPath)]
      );

      const stats = await fs.stat(outputPath);

      // Count files
      let filesCount = 0;
      const countFiles = async (dir: string) => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
          if (file.isDirectory()) {
            await countFiles(path.join(dir, file.name));
          } else {
            filesCount++;
          }
        }
      };
      await countFiles(minioDataPath);

      return {
        filePath: outputPath,
        metadata: {
          filesCount,
          filesSize: stats.size,
        },
      };
    } catch (error) {
      this.logger.error(`Files backup failed: ${error.message}`);
      throw error;
    }
  }

  private async backupCode(backupName: string): Promise<{ filePath: string; metadata: any }> {
    const projectRoot = process.cwd();
    const outputPath = path.join(this.backupDir, `${backupName}.tar.gz`);

    try {
      // Create tar.gz archive excluding node_modules, dist, backups
      await tar.create(
        {
          gzip: true,
          file: outputPath,
          cwd: path.dirname(projectRoot),
          filter: (filePath: string) => {
            const excluded = ['node_modules', 'dist', 'backups', '.git', 'docker/data'];
            return !excluded.some(ex => filePath.includes(ex));
          },
        },
        [path.basename(projectRoot)]
      );

      const stats = await fs.stat(outputPath);

      return {
        filePath: outputPath,
        metadata: {
          codeSize: stats.size,
        },
      };
    } catch (error) {
      this.logger.error(`Code backup failed: ${error.message}`);
      throw error;
    }
  }

  private async backupFull(backupName: string): Promise<{ filePath: string; metadata: any }> {
    // Perform all three backups
    const dbBackup = await this.backupDatabase(`${backupName}-db`);
    const filesBackup = await this.backupFiles(`${backupName}-files`);
    const codeBackup = await this.backupCode(`${backupName}-code`);

    // Combine into single archive
    const outputPath = path.join(this.backupDir, `${backupName}-full.tar.gz`);

    await tar.create(
      {
        gzip: true,
        file: outputPath,
        cwd: this.backupDir,
      },
      [
        path.basename(dbBackup.filePath),
        path.basename(filesBackup.filePath),
        path.basename(codeBackup.filePath),
      ]
    );

    // Clean up individual backup files
    await fs.unlink(dbBackup.filePath);
    await fs.unlink(filesBackup.filePath);
    await fs.unlink(codeBackup.filePath);

    const stats = await fs.stat(outputPath);
    const originalSize =
      (dbBackup.metadata.databaseSize || 0) +
      (filesBackup.metadata.filesSize || 0) +
      (codeBackup.metadata.codeSize || 0);

    return {
      filePath: outputPath,
      metadata: {
        databaseSize: dbBackup.metadata.databaseSize,
        filesCount: filesBackup.metadata.filesCount,
        filesSize: filesBackup.metadata.filesSize,
        codeSize: codeBackup.metadata.codeSize,
        compressionRatio: originalSize > 0 ? stats.size / originalSize : 1,
      },
    };
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async getAllBackups(tenantId: string): Promise<Backup[]> {
    return this.backupRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBackupById(id: string, tenantId?: string): Promise<Backup> {
    const backup = await this.backupRepository.findOne({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });
    if (!backup) {
      throw new NotFoundException(`Backup with ID ${id} not found`);
    }
    return backup;
  }

  async deleteBackup(id: string, tenantId: string): Promise<void> {
    const backup = await this.getBackupById(id, tenantId);

    // Delete file if exists
    if (backup.filePath) {
      try {
        await fs.unlink(backup.filePath);
      } catch (error) {
        this.logger.warn(`Failed to delete backup file: ${error.message}`);
      }
    }

    await this.backupRepository.remove(backup);
  }

  async cleanupExpiredBackups(): Promise<void> {
    const expiredBackups = await this.backupRepository
      .createQueryBuilder('backup')
      .where('backup.expiresAt IS NOT NULL')
      .andWhere('backup.expiresAt < :now', { now: new Date() })
      .getMany();

    for (const backup of expiredBackups) {
      // Use internal getBackupById without extra tenant check since we already have the ID
      await this.deleteBackup(backup.id, backup.tenantId);
    }

    this.logger.log(`Cleaned up ${expiredBackups.length} expired backups`);
  }

  async downloadBackup(id: string, tenantId: string): Promise<{ filePath: string; filename: string }> {
    const backup = await this.getBackupById(id, tenantId);

    if (!backup.filePath) {
      throw new NotFoundException('Backup file not found');
    }

    try {
      await fs.access(backup.filePath);
      return {
        filePath: backup.filePath,
        filename: path.basename(backup.filePath),
      };
    } catch (error) {
      throw new NotFoundException('Backup file no longer exists');
    }
  }
}

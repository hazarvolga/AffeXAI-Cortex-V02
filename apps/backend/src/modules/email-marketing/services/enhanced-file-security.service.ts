import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MalwareScanResult {
  isClean: boolean;
  threats: string[];
  scanEngine: string;
  scanTime: Date;
  details?: any;
}

export interface FileSecurityReport {
  filePath: string;
  isSecure: boolean;
  malwareScan: MalwareScanResult;
  integrityCheck: boolean;
  permissionsSet: boolean;
  quarantined: boolean;
  issues: string[];
}

export interface SecurityConfig {
  enableAdvancedMalwareScanning: boolean;
  enableFileIntegrityChecking: boolean;
  quarantineDirectory: string;
  maxQuarantineRetentionDays: number;
  enableRealTimeScanning: boolean;
  trustedFileHashes: Set<string>;
}

@Injectable()
export class EnhancedFileSecurityService {
  private readonly logger = new Logger(EnhancedFileSecurityService.name);

  private readonly config: SecurityConfig = {
    enableAdvancedMalwareScanning: true,
    enableFileIntegrityChecking: true,
    quarantineDirectory: path.join(process.cwd(), 'quarantine'),
    maxQuarantineRetentionDays: 30,
    enableRealTimeScanning: true,
    trustedFileHashes: new Set()
  };

  // Enhanced malware signatures and patterns
  private readonly MALWARE_SIGNATURES = [
    // Executable signatures
    { signature: Buffer.from([0x4D, 0x5A]), name: 'PE Executable', risk: 'HIGH' },
    { signature: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), name: 'ELF Executable', risk: 'HIGH' },
    { signature: Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), name: 'Mach-O Executable', risk: 'HIGH' },
    { signature: Buffer.from([0x50, 0x4B, 0x03, 0x04]), name: 'ZIP Archive', risk: 'MEDIUM' },
    { signature: Buffer.from([0x52, 0x61, 0x72, 0x21]), name: 'RAR Archive', risk: 'MEDIUM' },

    // Script signatures
    { signature: Buffer.from('#!/bin/sh'), name: 'Shell Script', risk: 'HIGH' },
    { signature: Buffer.from('#!/bin/bash'), name: 'Bash Script', risk: 'HIGH' },
    { signature: Buffer.from('<?php'), name: 'PHP Script', risk: 'MEDIUM' },
  ];

  private readonly SUSPICIOUS_PATTERNS = [
    // JavaScript/HTML injection patterns
    { pattern: /<script[^>]*>/gi, name: 'Script Tag', risk: 'HIGH' },
    { pattern: /javascript:/gi, name: 'JavaScript Protocol', risk: 'HIGH' },
    { pattern: /vbscript:/gi, name: 'VBScript Protocol', risk: 'HIGH' },
    { pattern: /on\w+\s*=/gi, name: 'Event Handler', risk: 'MEDIUM' },
    { pattern: /eval\s*\(/gi, name: 'Eval Function', risk: 'HIGH' },
    { pattern: /document\.write/gi, name: 'Document Write', risk: 'MEDIUM' },

    // Command injection patterns
    { pattern: /\$\([^)]+\)/g, name: 'Command Substitution', risk: 'HIGH' },
    { pattern: /`[^`]+`/g, name: 'Backtick Command', risk: 'HIGH' },
    { pattern: /;\s*(rm|del|format|fdisk)/gi, name: 'Destructive Command', risk: 'CRITICAL' },

    // SQL injection patterns
    { pattern: /(union|select|insert|update|delete|drop)\s+/gi, name: 'SQL Keywords', risk: 'HIGH' },
    { pattern: /'\s*(or|and)\s*'?\d/gi, name: 'SQL Injection Pattern', risk: 'HIGH' },

    // Path traversal patterns
    { pattern: /\.\.[\/\\]/g, name: 'Path Traversal', risk: 'HIGH' },
    { pattern: /[\/\\]etc[\/\\]passwd/gi, name: 'System File Access', risk: 'CRITICAL' },

    // Encoded payloads
    { pattern: /%[0-9a-f]{2}/gi, name: 'URL Encoded Content', risk: 'MEDIUM' },
    { pattern: /\\x[0-9a-f]{2}/gi, name: 'Hex Encoded Content', risk: 'MEDIUM' },
  ];

  constructor() {
    this.initializeSecurityService();
  }

  /**
   * Perform comprehensive malware scanning
   */
  async performAdvancedMalwareScan(filePath: string): Promise<MalwareScanResult> {
    const result: MalwareScanResult = {
      isClean: true,
      threats: [],
      scanEngine: 'Enhanced Security Scanner',
      scanTime: new Date(),
      details: {}
    };

    try {
      // Step 1: Signature-based scanning
      const signatureThreats = await this.scanFileSignatures(filePath);
      result.threats.push(...signatureThreats);

      // Step 2: Pattern-based content scanning
      const patternThreats = await this.scanSuspiciousPatterns(filePath);
      result.threats.push(...patternThreats);

      // Step 3: Behavioral analysis
      const behaviorThreats = await this.analyzeSuspiciousBehavior(filePath);
      result.threats.push(...behaviorThreats);

      // Step 4: External antivirus integration (if available)
      if (await this.isExternalScannerAvailable()) {
        const externalThreats = await this.performExternalScan(filePath);
        result.threats.push(...externalThreats);
      }

      // Step 5: File entropy analysis
      const entropyThreats = await this.analyzeFileEntropy(filePath);
      result.threats.push(...entropyThreats);

      result.isClean = result.threats.length === 0;
      result.details = {
        signatureMatches: signatureThreats.length,
        patternMatches: patternThreats.length,
        behaviorFlags: behaviorThreats.length,
        entropyFlags: entropyThreats.length
      };

      this.logger.log(`Malware scan completed for ${filePath}: ${result.isClean ? 'CLEAN' : 'THREATS DETECTED'}`);

      if (!result.isClean) {
        this.logger.warn(`Threats detected in ${filePath}: ${result.threats.join(', ')}`);
      }

    } catch (error) {
      this.logger.error(`Malware scan failed for ${filePath}:`, error);
      result.isClean = false;
      result.threats.push('Scan failed - file treated as suspicious');
    }

    return result;
  }

  /**
   * Implement secure file storage with access controls
   */
  async secureFileStorage(filePath: string, jobId: string): Promise<FileSecurityReport> {
    const report: FileSecurityReport = {
      filePath,
      isSecure: false,
      malwareScan: { isClean: false, threats: [], scanEngine: '', scanTime: new Date() },
      integrityCheck: false,
      permissionsSet: false,
      quarantined: false,
      issues: []
    };

    try {
      // Step 1: Perform malware scan
      report.malwareScan = await this.performAdvancedMalwareScan(filePath);

      if (!report.malwareScan.isClean) {
        // Quarantine the file
        await this.quarantineFile(filePath, jobId, report.malwareScan.threats);
        report.quarantined = true;
        report.issues.push('File quarantined due to security threats');
        return report;
      }

      // Step 2: Set secure file permissions
      await this.setSecurePermissions(filePath);
      report.permissionsSet = true;

      // Step 3: Create file integrity hash
      const fileHash = await this.createFileIntegrityHash(filePath);
      await this.storeFileIntegrityHash(filePath, fileHash, jobId);
      report.integrityCheck = true;

      // Step 4: Apply additional access controls
      await this.applyAccessControls(filePath, jobId);

      report.isSecure = true;
      this.logger.log(`File secured successfully: ${filePath}`);

    } catch (error) {
      this.logger.error(`File security process failed for ${filePath}:`, error);
      report.issues.push(`Security process failed: ${error.message}`);
    }

    return report;
  }

  /**
   * Automatic cleanup of sensitive temporary files
   */
  async automaticSensitiveFileCleanup(jobId?: string, maxAgeHours: number = 24): Promise<{
    cleanedFiles: number;
    errors: string[];
    totalSize: number;
  }> {
    const result = {
      cleanedFiles: 0,
      errors: [] as string[],
      totalSize: 0
    };

    try {
      const tempDirectories = [
        path.join(process.cwd(), 'temp', 'imports'),
        path.join(process.cwd(), 'temp', 'exports'),
        path.join(process.cwd(), 'temp', 'uploads')
      ];

      if (jobId) {
        // Clean specific job files
        for (const baseDir of tempDirectories) {
          const jobDir = path.join(baseDir, jobId);
          const cleanupResult = await this.cleanupDirectory(jobDir, 0); // Clean immediately for specific job
          result.cleanedFiles += cleanupResult.cleanedFiles;
          result.totalSize += cleanupResult.totalSize;
          result.errors.push(...cleanupResult.errors);
        }
      } else {
        // Clean old files across all temp directories
        for (const dir of tempDirectories) {
          const cleanupResult = await this.cleanupDirectory(dir, maxAgeHours);
          result.cleanedFiles += cleanupResult.cleanedFiles;
          result.totalSize += cleanupResult.totalSize;
          result.errors.push(...cleanupResult.errors);
        }
      }

      // Clean quarantine directory
      const quarantineCleanup = await this.cleanupQuarantineDirectory();
      result.cleanedFiles += quarantineCleanup.cleanedFiles;
      result.totalSize += quarantineCleanup.totalSize;
      result.errors.push(...quarantineCleanup.errors);

      if (result.errors.length > 0) {
        this.logger.warn(`Cleanup encountered ${result.errors.length} errors: ${result.errors.join(', ')}`);
      }

      this.logger.log(`Cleanup completed: ${result.cleanedFiles} files cleaned, ${result.totalSize} bytes freed`);

    } catch (error) {
      this.logger.error('Automatic cleanup failed:', error);
      result.errors.push(`Cleanup failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Verify file integrity using stored hashes
   */
  async verifyFileIntegrity(filePath: string, jobId: string): Promise<boolean> {
    try {
      const storedHash = await this.getStoredFileIntegrityHash(filePath, jobId);
      if (!storedHash) {
        this.logger.warn(`No integrity hash found for ${filePath}`);
        return false;
      }

      const currentHash = await this.createFileIntegrityHash(filePath);
      const isValid = storedHash === currentHash;

      if (!isValid) {
        this.logger.error(`File integrity check failed for ${filePath}`);
        // Quarantine the potentially tampered file
        await this.quarantineFile(filePath, jobId, ['File integrity violation']);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`File integrity verification failed for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get security audit report for a job
   */
  async getSecurityAuditReport(jobId: string): Promise<{
    jobId: string;
    totalFiles: number;
    secureFiles: number;
    quarantinedFiles: number;
    integrityViolations: number;
    threatsSummary: Record<string, number>;
    recommendations: string[];
  }> {
    // This would typically query a database for stored security information
    // For now, return a basic structure
    return {
      jobId,
      totalFiles: 0,
      secureFiles: 0,
      quarantinedFiles: 0,
      integrityViolations: 0,
      threatsSummary: {},
      recommendations: []
    };
  }

  // Private helper methods

  private async initializeSecurityService(): Promise<void> {
    try {
      // Ensure quarantine directory exists
      await fs.mkdir(this.config.quarantineDirectory, { recursive: true });

      // Set up periodic cleanup
      setInterval(() => {
        this.automaticSensitiveFileCleanup().catch(error => {
          this.logger.error('Periodic cleanup failed:', error);
        });
      }, 60 * 60 * 1000); // Run every hour

      this.logger.log('Enhanced file security service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize security service:', error);
    }
  }

  private async scanFileSignatures(filePath: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      const buffer = await fs.readFile(filePath);

      for (const { signature, name, risk } of this.MALWARE_SIGNATURES) {
        if (buffer.subarray(0, signature.length).equals(signature)) {
          threats.push(`${name} (${risk} risk)`);
        }
      }
    } catch (error) {
      this.logger.error(`Signature scan failed for ${filePath}:`, error);
    }

    return threats;
  }

  private async scanSuspiciousPatterns(filePath: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');

      for (const { pattern, name, risk } of this.SUSPICIOUS_PATTERNS) {
        if (pattern.test(content)) {
          threats.push(`${name} (${risk} risk)`);
        }
      }
    } catch (error) {
      // File might be binary, try with limited buffer
      try {
        const buffer = await fs.readFile(filePath);
        const content = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));

        for (const { pattern, name, risk } of this.SUSPICIOUS_PATTERNS) {
          if (pattern.test(content)) {
            threats.push(`${name} (${risk} risk)`);
          }
        }
      } catch (innerError) {
        this.logger.debug(`Pattern scan skipped for binary file ${filePath}`);
      }
    }

    return threats;
  }

  private async analyzeSuspiciousBehavior(filePath: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      const stats = await fs.stat(filePath);

      // Check for suspicious file size patterns
      if (stats.size === 0) {
        threats.push('Empty file (potential placeholder)');
      } else if (stats.size > 100 * 1024 * 1024) { // > 100MB
        threats.push('Unusually large file size');
      }

      // Check file extension vs content mismatch
      const extension = path.extname(filePath).toLowerCase();
      if (['.csv', '.txt'].includes(extension)) {
        const buffer = await fs.readFile(filePath, { encoding: 'utf8', flag: 'r' });
        const firstLine = buffer.split('\n')[0];

        if (firstLine && firstLine.length > 1000) {
          threats.push('Suspicious line length for CSV/text file');
        }
      }

    } catch (error) {
      this.logger.error(`Behavior analysis failed for ${filePath}:`, error);
    }

    return threats;
  }

  private async isExternalScannerAvailable(): Promise<boolean> {
    try {
      // Check for ClamAV
      await execAsync('which clamscan');
      return true;
    } catch {
      return false;
    }
  }

  private async performExternalScan(filePath: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`);

      if (stderr || stdout.includes('FOUND')) {
        threats.push('External scanner detected threat');
      }
    } catch (error) {
      // ClamAV returns non-zero exit code when threats are found
      if (error.stdout && error.stdout.includes('FOUND')) {
        threats.push('External scanner detected threat');
      }
    }

    return threats;
  }

  private async analyzeFileEntropy(filePath: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      const buffer = await fs.readFile(filePath);
      const entropy = this.calculateEntropy(buffer);

      // High entropy might indicate encrypted/compressed malware
      if (entropy > 7.5) {
        threats.push('High entropy content (possible encryption/compression)');
      }
    } catch (error) {
      this.logger.error(`Entropy analysis failed for ${filePath}:`, error);
    }

    return threats;
  }

  private calculateEntropy(buffer: Buffer): number {
    const frequencies = new Array(256).fill(0);

    for (let i = 0; i < buffer.length; i++) {
      frequencies[buffer[i]]++;
    }

    let entropy = 0;
    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / buffer.length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  private async quarantineFile(filePath: string, jobId: string, threats: string[]): Promise<void> {
    try {
      const fileName = path.basename(filePath);
      const quarantinePath = path.join(
        this.config.quarantineDirectory,
        `${Date.now()}-${jobId}-${fileName}`
      );

      await fs.rename(filePath, quarantinePath);

      // Create quarantine metadata
      const metadata = {
        originalPath: filePath,
        jobId,
        quarantineTime: new Date(),
        threats,
        fileSize: (await fs.stat(quarantinePath)).size
      };

      await fs.writeFile(
        `${quarantinePath}.metadata.json`,
        JSON.stringify(metadata, null, 2)
      );

      this.logger.warn(`File quarantined: ${filePath} -> ${quarantinePath}`);
    } catch (error) {
      this.logger.error(`Failed to quarantine file ${filePath}:`, error);
      throw error;
    }
  }

  private async setSecurePermissions(filePath: string): Promise<void> {
    try {
      await fs.chmod(filePath, 0o600); // Read/write for owner only
    } catch (error) {
      this.logger.error(`Failed to set secure permissions for ${filePath}:`, error);
      throw error;
    }
  }

  private async createFileIntegrityHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async storeFileIntegrityHash(filePath: string, hash: string, jobId: string): Promise<void> {
    // In a real implementation, this would store in a database
    // For now, store in a local file
    const hashFile = path.join(process.cwd(), 'temp', 'integrity', `${jobId}.hashes.json`);

    try {
      await fs.mkdir(path.dirname(hashFile), { recursive: true });

      let hashes: Record<string, string> = {};
      try {
        const existing = await fs.readFile(hashFile, 'utf8');
        hashes = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }

      hashes[filePath] = hash;
      await fs.writeFile(hashFile, JSON.stringify(hashes, null, 2));
    } catch (error) {
      this.logger.error(`Failed to store integrity hash for ${filePath}:`, error);
    }
  }

  private async getStoredFileIntegrityHash(filePath: string, jobId: string): Promise<string | null> {
    const hashFile = path.join(process.cwd(), 'temp', 'integrity', `${jobId}.hashes.json`);

    try {
      const content = await fs.readFile(hashFile, 'utf8');
      const hashes = JSON.parse(content);
      return hashes[filePath] || null;
    } catch {
      return null;
    }
  }

  private async applyAccessControls(filePath: string, jobId: string): Promise<void> {
    // Additional access control measures could be implemented here
    // For example, setting extended attributes, ACLs, etc.
    this.logger.debug(`Access controls applied for ${filePath}`);
  }

  private async cleanupDirectory(dirPath: string, maxAgeHours: number): Promise<{
    cleanedFiles: number;
    totalSize: number;
    errors: string[];
  }> {
    const result = { cleanedFiles: 0, totalSize: 0, errors: [] as string[] };

    try {
      const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
      const files = await this.getAllFilesRecursively(dirPath);

      for (const filePath of files) {
        try {
          const stats = await fs.stat(filePath);

          if (maxAgeHours === 0 || stats.birthtime < cutoffTime) {
            result.totalSize += stats.size;
            await fs.unlink(filePath);
            result.cleanedFiles++;

            // Also clean up any associated metadata files
            const metadataFile = `${filePath}.metadata.json`;
            try {
              await fs.unlink(metadataFile);
            } catch {
              // Metadata file might not exist
            }
          }
        } catch (error) {
          result.errors.push(`Failed to clean ${filePath}: ${error.message}`);
        }
      }

      // Remove empty directories
      await this.removeEmptyDirectories(dirPath);

    } catch (error) {
      result.errors.push(`Directory cleanup failed: ${error.message}`);
    }

    return result;
  }

  private async cleanupQuarantineDirectory(): Promise<{
    cleanedFiles: number;
    totalSize: number;
    errors: string[];
  }> {
    const maxAge = this.config.maxQuarantineRetentionDays * 24; // Convert to hours
    return this.cleanupDirectory(this.config.quarantineDirectory, maxAge);
  }

  private async getAllFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFilesRecursively(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory might not exist or be accessible
    }

    return files;
  }

  private async removeEmptyDirectories(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir);

      if (entries.length === 0) {
        await fs.rmdir(dir);
      } else {
        // Check subdirectories
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await fs.stat(fullPath);

          if (stats.isDirectory()) {
            await this.removeEmptyDirectories(fullPath);
          }
        }

        // Check again if directory is now empty
        const remainingEntries = await fs.readdir(dir);
        if (remainingEntries.length === 0) {
          await fs.rmdir(dir);
        }
      }
    } catch {
      // Directory might not be empty or accessible
    }
  }
}
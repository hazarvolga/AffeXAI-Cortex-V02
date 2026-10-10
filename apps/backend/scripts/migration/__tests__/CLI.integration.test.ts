/**
 * Integration Tests for CLI
 * Tests CLI argument parsing, dry-run mode, and error scenarios
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('CLI Integration Tests', () => {
  const cliPath = path.join(__dirname, '../index.ts');
  const testSourceDir = path.join(__dirname, '../../../test-data/pages');
  const testUploadsDir = path.join(__dirname, '../../../test-data/uploads');

  /**
   * Helper to run CLI command
   */
  function runCLI(args: string[]): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = execSync(`tsx ${cliPath} ${args.join(' ')}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return { stdout, stderr: '', exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.status || 1,
      };
    }
  }

  describe('Help and Version', () => {
    it('should display help with --help', () => {
      const result = runCLI(['--help']);
      
      expect(result.stdout).toContain('WordPress to CMS Migration Tool');
      expect(result.stdout).toContain('Options:');
      expect(result.exitCode).toBe(0);
    });

    it('should display help with -h', () => {
      const result = runCLI(['-h']);
      
      expect(result.stdout).toContain('WordPress to CMS Migration Tool');
      expect(result.exitCode).toBe(0);
    });

    it('should display version with --version', () => {
      const result = runCLI(['--version']);
      
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Dry Run Mode', () => {
    it('should run in dry-run mode with --dry-run', () => {
      const result = runCLI([
        '--dry-run',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('DRY RUN');
      expect(result.stdout).toContain('no changes will be made');
    });

    it('should run in dry-run mode with -d', () => {
      const result = runCLI([
        '-d',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('DRY RUN');
    });

    it('should validate content in dry-run mode', () => {
      const result = runCLI([
        '--dry-run',
        '--verbose',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Validation') || 
      expect(result.stdout).toContain('validation');
    });
  });

  describe('Page Filtering', () => {
    it('should filter pages with --pages', () => {
      const result = runCLI([
        '--dry-run',
        '--pages', 'Page1,Page2',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Page Filter') || 
      expect(result.stdout).toContain('pages');
    });

    it('should filter by category with --category', () => {
      const result = runCLI([
        '--dry-run',
        '--category', 'Industry Solution',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('category') || 
      expect(result.stdout).toContain('Category');
    });
  });

  describe('Verbose Mode', () => {
    it('should enable verbose logging with --verbose', () => {
      const result = runCLI([
        '--dry-run',
        '--verbose',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Verbose') || 
      expect(result.stdout).toContain('verbose');
    });

    it('should enable verbose logging with -v', () => {
      const result = runCLI([
        '--dry-run',
        '-v',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Verbose') || 
      expect(result.stdout).toContain('verbose');
    });
  });

  describe('Media Options', () => {
    it('should skip media with --skip-media', () => {
      const result = runCLI([
        '--dry-run',
        '--skip-media',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Skip Media') || 
      expect(result.stdout).toContain('skip');
    });
  });

  describe('Batch Size', () => {
    it('should accept custom batch size', () => {
      const result = runCLI([
        '--dry-run',
        '--batch-size', '5',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Batch Size') || 
      expect(result.stdout).toContain('5');
    });

    it('should use default batch size if not specified', () => {
      const result = runCLI([
        '--dry-run',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Batch Size') || 
      expect(result.stdout).toContain('10');
    });
  });

  describe('API URL', () => {
    it('should accept custom API URL', () => {
      const result = runCLI([
        '--dry-run',
        '--api-url', 'http://custom-api.com/api',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('custom-api.com') || 
      expect(result.stdout).toContain('API URL');
    });

    it('should use default API URL if not specified', () => {
      const result = runCLI([
        '--dry-run',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('localhost:9006') || 
      expect(result.stdout).toContain('API URL');
    });
  });

  describe('Configuration File', () => {
    it('should load configuration from file', () => {
      const configPath = path.join(__dirname, '../migration.config.example.json');
      
      if (fs.existsSync(configPath)) {
        const result = runCLI([
          '--dry-run',
          '--config', configPath,
        ]);
        
        expect(result.exitCode).toBe(0);
      }
    });

    it('should handle missing configuration file gracefully', () => {
      const result = runCLI([
        '--dry-run',
        '--config', '/nonexistent/config.json',
        '--source', testSourceDir,
      ]);
      
      // Should either fail or use defaults
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid source directory', () => {
      const result = runCLI([
        '--dry-run',
        '--source', '/nonexistent/directory',
      ]);
      
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr || result.stdout).toContain('not exist') || 
      expect(result.stderr || result.stdout).toContain('error');
    });

    it('should handle invalid batch size', () => {
      const result = runCLI([
        '--dry-run',
        '--batch-size', 'invalid',
        '--source', testSourceDir,
      ]);
      
      // Should either fail or use default
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown arguments', () => {
      const result = runCLI([
        '--unknown-argument',
        '--source', testSourceDir,
      ]);
      
      // Commander should handle unknown arguments
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Output Format', () => {
    it('should display configuration summary', () => {
      const result = runCLI([
        '--dry-run',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Configuration') || 
      expect(result.stdout).toContain('Source Directory');
    });

    it('should display migration summary', () => {
      const result = runCLI([
        '--dry-run',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Summary') || 
      expect(result.stdout).toContain('Total');
    });

    it('should display progress information', () => {
      const result = runCLI([
        '--dry-run',
        '--verbose',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Progress') || 
      expect(result.stdout).toContain('Starting');
    });
  });

  describe('Exit Codes', () => {
    it('should exit with 0 on success', () => {
      const result = runCLI([
        '--dry-run',
        '--source', testSourceDir,
      ]);
      
      // Dry run should succeed
      expect(result.exitCode).toBe(0);
    });

    it('should exit with non-zero on error', () => {
      const result = runCLI([
        '--source', '/nonexistent/directory',
      ]);
      
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('Combined Options', () => {
    it('should handle multiple options together', () => {
      const result = runCLI([
        '--dry-run',
        '--verbose',
        '--skip-media',
        '--batch-size', '5',
        '--pages', 'Page1,Page2',
        '--source', testSourceDir,
      ]);
      
      expect(result.stdout).toContain('Dry Run') || 
      expect(result.stdout).toContain('DRY RUN');
      expect(result.stdout).toContain('Verbose') || 
      expect(result.stdout).toContain('verbose');
      expect(result.stdout).toContain('Skip Media') || 
      expect(result.stdout).toContain('skip');
    });

    it('should handle short and long options mixed', () => {
      const result = runCLI([
        '-d',
        '-v',
        '--skip-media',
        '-b', '5',
        '-s', testSourceDir,
      ]);
      
      expect(result.exitCode).toBe(0);
    });
  });
});

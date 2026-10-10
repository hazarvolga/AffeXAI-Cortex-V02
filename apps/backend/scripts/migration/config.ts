import * as path from 'path';

/**
 * Migration Configuration
 * Manages all configuration settings for the WordPress to CMS migration
 */

export interface MigrationConfig {
  source: {
    directory: string;
    uploadsDirectory: string;
    domain: string;
  };
  target: {
    domain: string;
    apiBaseUrl: string;
  };
  templates: {
    mappingFile: string;
    defaultTemplate: string;
  };
  processing: {
    batchSize: number;
    concurrentUploads: number;
    retryAttempts: number;
    retryDelay: number;
  };
  logging: {
    level: 'verbose' | 'normal' | 'quiet';
    outputDir: string;
  };
}

/**
 * Default configuration values
 */
// Find workspace root (go up from apps/backend/scripts/migration)
const workspaceRoot = path.resolve(__dirname, '../../../../');

const defaultConfig: MigrationConfig = {
  source: {
    directory: path.join(workspaceRoot, 'apps/backend/extracted_pages'),
    uploadsDirectory: path.join(workspaceRoot, 'apps/backend/extracted_pages/uploads'),
    domain: 'aluplan.com.tr',
  },
  target: {
    domain: 'aluplan.tr',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:9006/api',
  },
  templates: {
    mappingFile: path.join(workspaceRoot, 'extracted_pages/PAGE_MAPPING_REPORT.md'),
    defaultTemplate: 'default-page',
  },
  processing: {
    batchSize: 10,
    concurrentUploads: 5,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  logging: {
    level: 'normal',
    outputDir: path.join(process.cwd(), 'scripts/migration/logs'),
  },
};

/**
 * Load configuration from file or environment variables
 * @param configPath - Optional path to config file
 * @returns Merged configuration
 */
export function loadConfig(configPath?: string): MigrationConfig {
  let fileConfig: Partial<MigrationConfig> = {};
  
  // Try to load config file if provided
  if (configPath) {
    try {
      const fs = require('fs');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configContent);
      console.log(`✓ Loaded configuration from ${configPath}`);
    } catch (error) {
      console.warn(`⚠ Could not load config file from ${configPath}, using defaults`);
    }
  }
  
  // Merge with defaults
  const config: MigrationConfig = {
    source: {
      ...defaultConfig.source,
      ...fileConfig.source,
    },
    target: {
      ...defaultConfig.target,
      ...fileConfig.target,
    },
    templates: {
      ...defaultConfig.templates,
      ...fileConfig.templates,
    },
    processing: {
      ...defaultConfig.processing,
      ...fileConfig.processing,
    },
    logging: {
      ...defaultConfig.logging,
      ...fileConfig.logging,
    },
  };
  
  // Override with environment variables if present
  if (process.env.SOURCE_DIR) {
    config.source.directory = process.env.SOURCE_DIR;
  }
  if (process.env.UPLOADS_DIR) {
    config.source.uploadsDirectory = process.env.UPLOADS_DIR;
  }
  if (process.env.SOURCE_DOMAIN) {
    config.source.domain = process.env.SOURCE_DOMAIN;
  }
  if (process.env.TARGET_DOMAIN) {
    config.target.domain = process.env.TARGET_DOMAIN;
  }
  if (process.env.API_BASE_URL) {
    config.target.apiBaseUrl = process.env.API_BASE_URL;
  }
  if (process.env.LOG_LEVEL) {
    config.logging.level = process.env.LOG_LEVEL as 'verbose' | 'normal' | 'quiet';
  }
  
  return config;
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): MigrationConfig {
  return { ...defaultConfig };
}

/**
 * Validate configuration
 * @param config - Configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateConfig(config: MigrationConfig): string[] {
  const errors: string[] = [];
  
  // Validate source directory
  const fs = require('fs');
  if (!fs.existsSync(config.source.directory)) {
    errors.push(`Source directory does not exist: ${config.source.directory}`);
  }
  
  // Validate uploads directory
  if (!fs.existsSync(config.source.uploadsDirectory)) {
    errors.push(`Uploads directory does not exist: ${config.source.uploadsDirectory}`);
  }
  
  // Validate API URL
  if (!config.target.apiBaseUrl) {
    errors.push('Target API base URL is required');
  }
  
  // Validate batch size
  if (config.processing.batchSize < 1) {
    errors.push('Batch size must be at least 1');
  }
  
  // Validate concurrent uploads
  if (config.processing.concurrentUploads < 1) {
    errors.push('Concurrent uploads must be at least 1');
  }
  
  return errors;
}

/**
 * Create example configuration file
 */
export function createExampleConfig(outputPath: string): void {
  const fs = require('fs');
  const exampleConfig = {
    source: {
      directory: '../../extracted_pages',
      uploadsDirectory: '../../extracted_pages/uploads',
      domain: 'aluplan.com.tr',
    },
    target: {
      domain: 'aluplan.tr',
      apiBaseUrl: 'http://localhost:9006/api',
    },
    templates: {
      mappingFile: '../../extracted_pages/PAGE_MAPPING_REPORT.md',
      defaultTemplate: 'default-page',
    },
    processing: {
      batchSize: 10,
      concurrentUploads: 5,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    logging: {
      level: 'normal',
      outputDir: './logs',
    },
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');
  console.log(`✓ Created example configuration at ${outputPath}`);
}

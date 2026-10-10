/**
 * MigrationOrchestrator - Coordinates the entire WordPress to CMS migration
 * 
 * Orchestrates:
 * - Content parsing
 * - Media upload
 * - URL transformation
 * - Template mapping
 * - Page creation
 * - Progress tracking
 * - Error handling
 * - Report generation
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentParser } from './ContentParser';
import { IndustrySolutionParser } from './IndustrySolutionParser';
import { CorporateHomepageParser } from './CorporateHomepageParser';
import { ProductLandingParser } from './ProductLandingParser';
import { PricingPageParser } from './PricingPageParser';
import { ServicesPageParser } from './ServicesPageParser';
import { LeadMagnetParser } from './LeadMagnetParser';
import { ThankYouPageParser } from './ThankYouPageParser';
import { EventPageParser } from './EventPageParser';
import { MediaManager } from './MediaManager';
import { URLTransformer } from './URLTransformer';
import { TemplateMapper } from './TemplateMapper';
import { PageCreator } from './PageCreator';
import { Logger, LogLevel } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { ReportGenerator } from './ReportGenerator';
import {
  MigrationOptions,
  MigrationResult,
  ParsedContent,
  MediaMapping,
  TemplateMapping,
  PageCreationResult,
} from './types';

export class MigrationOrchestrator {
  private contentParser: ContentParser;
  private industrySolutionParser: IndustrySolutionParser;
  private corporateHomepageParser: CorporateHomepageParser;
  private productLandingParser: ProductLandingParser;
  private pricingPageParser: PricingPageParser;
  private servicesPageParser: ServicesPageParser;
  private leadMagnetParser: LeadMagnetParser;
  private thankYouPageParser: ThankYouPageParser;
  private eventPageParser: EventPageParser;
  private mediaManager: MediaManager;
  private urlTransformer: URLTransformer;
  private templateMapper: TemplateMapper;
  private pageCreator: PageCreator;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private reportGenerator: ReportGenerator;

  constructor(
    private options: MigrationOptions,
    apiBaseUrl: string,
  ) {
    // Initialize logger
    const logLevel = options.verbose
      ? LogLevel.VERBOSE
      : options.dryRun
        ? LogLevel.NORMAL
        : LogLevel.NORMAL;

    this.logger = new Logger(logLevel, 'logs/migration.log');

    // Initialize error handler
    this.errorHandler = new ErrorHandler(this.logger);

    // Initialize report generator
    this.reportGenerator = new ReportGenerator(this.logger, this.errorHandler);

    // Initialize parsers
    this.contentParser = new ContentParser();
    this.industrySolutionParser = new IndustrySolutionParser();
    this.corporateHomepageParser = new CorporateHomepageParser();
    this.productLandingParser = new ProductLandingParser();
    this.pricingPageParser = new PricingPageParser();
    this.servicesPageParser = new ServicesPageParser();
    this.leadMagnetParser = new LeadMagnetParser();
    this.thankYouPageParser = new ThankYouPageParser();
    this.eventPageParser = new EventPageParser();

    // Initialize media manager
    this.mediaManager = new MediaManager(apiBaseUrl, options.uploadsDir);

    // Initialize URL transformer
    this.urlTransformer = new URLTransformer();

    // Initialize template mapper
    this.templateMapper = new TemplateMapper(
      path.join(options.sourceDir, 'PAGE_MAPPING_REPORT.md'),
    );

    // Initialize page creator
    this.pageCreator = new PageCreator(
      apiBaseUrl,
      this.logger,
      this.errorHandler,
    );
  }

  /**
   * Run full migration
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();

    this.logger.info('MigrationOrchestrator', '🚀 Starting WordPress to CMS migration');
    this.logger.info('MigrationOrchestrator', `Source: ${this.options.sourceDir}`);
    this.logger.info('MigrationOrchestrator', `Dry run: ${this.options.dryRun}`);

    const result: MigrationResult = {
      totalPages: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      errors: [],
      mediaReport: {
        totalImages: 0,
        uploadedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        failures: [],
        mapping: {},
      },
      duration: 0,
    };

    try {
      // 1. Get list of pages to migrate
      const pageFiles = this.getPageFiles();
      result.totalPages = pageFiles.length;

      this.logger.info('MigrationOrchestrator', `Found ${pageFiles.length} pages to migrate`);

      // 2. Upload media (if not skipped)
      let mediaMapping: MediaMapping = {};
      if (!this.options.skipMedia) {
        this.logger.info('MigrationOrchestrator', '📸 Uploading media files...');
        mediaMapping = await this.mediaManager.uploadAllMedia();
        // TODO: Get media report from MediaManager
        result.mediaReport.mapping = mediaMapping;
        this.logger.success(
          'MigrationOrchestrator',
          `Media upload complete`,
        );
      } else {
        this.logger.info('MigrationOrchestrator', '⏭️  Skipping media upload');
      }

      // 3. Migrate pages
      this.logger.info('MigrationOrchestrator', '📄 Migrating pages...');

      for (let i = 0; i < pageFiles.length; i++) {
        const pageFile = pageFiles[i];
        const progress = `[${i + 1}/${pageFiles.length}]`;

        try {
          this.logger.info('MigrationOrchestrator', `${progress} Processing: ${pageFile}`);

          const pageResult = await this.migratePage(pageFile, mediaMapping);

          if (pageResult.success) {
            result.successCount++;
            this.logger.success(
              'MigrationOrchestrator',
              `${progress} ✓ ${pageFile} -> Page ID: ${pageResult.pageId}`,
            );
          } else {
            result.failureCount++;
            this.logger.error(
              'MigrationOrchestrator',
              `${progress} ✗ ${pageFile}`,
              new Error(pageResult.error || 'Unknown error'),
            );
          }
        } catch (error) {
          result.failureCount++;
          this.logger.error(
            'MigrationOrchestrator',
            `${progress} ✗ ${pageFile}`,
            error as Error,
          );
        }
      }

      // 4. Generate report
      result.duration = Date.now() - startTime;
      this.generateFinalReport(result);

      this.logger.success('MigrationOrchestrator', '✅ Migration complete!');
      this.logger.info(
        'MigrationOrchestrator',
        `Success: ${result.successCount}, Failed: ${result.failureCount}, Duration: ${(result.duration / 1000).toFixed(2)}s`,
      );

      return result;
    } catch (error) {
      this.logger.error('MigrationOrchestrator', 'Migration failed', error as Error);
      throw error;
    }
  }

  /**
   * Migrate a single page
   */
  async migratePage(
    filename: string,
    mediaMapping: MediaMapping,
  ): Promise<PageCreationResult> {
    try {
      // 1. Read file
      const filePath = path.join(this.options.sourceDir, filename);
      const htmlContent = fs.readFileSync(filePath, 'utf-8');

      // 2. Parse content
      const parsed = this.parseContent(htmlContent, filename);

      // 3. Transform URLs
      const transformedContent = this.urlTransformer.transformContent(
        parsed,
        mediaMapping,
      );

      // 4. Get template mapping
      const templateMapping = this.templateMapper.getTemplateForPage(filename);

      // 5. Create page (if not dry run)
      if (this.options.dryRun) {
        this.logger.info(
          'MigrationOrchestrator',
          `[DRY RUN] Would create page: ${parsed.title} with template: ${templateMapping.templateName}`,
        );
        return {
          success: true,
          pageId: 'dry-run-id',
          componentCount: 0,
        };
      }

      // 6. Create page via API
      return await this.pageCreator.createPage(
        transformedContent,
        templateMapping,
        mediaMapping,
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Parse content (use specialized parser based on template mapping)
   */
  private parseContent(htmlContent: string, filename: string): ParsedContent {
    // Get template mapping to determine parser
    const templateMapping = this.templateMapper.getTemplateForPage(filename);
    const templateName = templateMapping.templateName.toLowerCase();
    
    this.logger.debug('MigrationOrchestrator', `Using template: ${templateName} for ${filename}`);
    
    // Use specialized parser based on template
    if (templateName.includes('industry solution')) {
      return this.industrySolutionParser.parseIndustrySolution(htmlContent, filename);
    } else if (templateName.includes('corporate homepage') || templateName.includes('homepage')) {
      return this.corporateHomepageParser.parseCorporateHomepage(htmlContent, filename);
    } else if (templateName.includes('product landing') || templateName.includes('product page')) {
      return this.productLandingParser.parseProductPage(htmlContent, filename);
    } else if (templateName.includes('pricing') || templateName.includes('edition')) {
      return this.pricingPageParser.parsePricingPage(htmlContent, filename);
    } else if (templateName.includes('service') || templateName.includes('feature')) {
      return this.servicesPageParser.parseServicesPage(htmlContent, filename);
    } else if (templateName.includes('campaign') || templateName.includes('lead magnet')) {
      return this.leadMagnetParser.parseLeadMagnetPage(htmlContent, filename);
    } else if (templateName.includes('thank you') || templateName.includes('confirmation')) {
      return this.thankYouPageParser.parseThankYouPage(htmlContent, filename);
    } else if (templateName.includes('event') || templateName.includes('webinar')) {
      return this.eventPageParser.parseEventPage(htmlContent, filename);
    }

    // Fallback to generic parser
    this.logger.debug('MigrationOrchestrator', `Using generic parser for ${filename}`);
    return this.contentParser.parse(htmlContent, filename);
  }

  /**
   * Get list of page files to migrate
   */
  private getPageFiles(): string[] {
    const files = fs.readdirSync(this.options.sourceDir);

    // Filter .txt files
    let pageFiles = files.filter(
      (f) => f.endsWith('.txt') && f !== 'test.txt' && !f.startsWith('.'),
    );

    // Apply page filter if specified
    if (this.options.pageFilter && this.options.pageFilter.length > 0) {
      pageFiles = pageFiles.filter((f) =>
        this.options.pageFilter!.some((filter) => f.includes(filter)),
      );
    }

    // Sort by priority (high priority first)
    pageFiles.sort((a, b) => {
      const priorityA = this.getPagePriority(a);
      const priorityB = this.getPagePriority(b);

      if (priorityA === priorityB) return 0;
      if (priorityA === 'high') return -1;
      if (priorityB === 'high') return 1;
      if (priorityA === 'medium') return -1;
      return 1;
    });

    return pageFiles;
  }

  /**
   * Get page priority from template mapper
   */
  private getPagePriority(filename: string): 'high' | 'medium' | 'low' {
    try {
      const mapping = this.templateMapper.getTemplateForPage(filename);
      return mapping.priority;
    } catch {
      return 'low';
    }
  }

  /**
   * Generate final migration report
   */
  private generateFinalReport(result: MigrationResult): void {
    // Generate simple report
    const report = `
# WordPress to CMS Migration Report

**Date:** ${new Date().toISOString()}
**Duration:** ${(result.duration / 1000).toFixed(2)}s

## Summary

- **Total Pages:** ${result.totalPages}
- **Success:** ${result.successCount}
- **Failed:** ${result.failureCount}
- **Skipped:** ${result.skippedCount}

## Media

- **Total Images:** ${result.mediaReport.totalImages}
- **Uploaded:** ${result.mediaReport.uploadedCount}
- **Failed:** ${result.mediaReport.failedCount}

## Errors

${result.errors.length > 0 ? result.errors.map((e) => `- ${e.page}: ${e.error}`).join('\n') : 'No errors'}
`;

    // Write to file
    const reportPath = 'logs/migration-report.md';
    fs.writeFileSync(reportPath, report, 'utf-8');

    this.logger.info('MigrationOrchestrator', `📊 Report saved: ${reportPath}`);
  }

  /**
   * Migrate pages in batch
   */
  async migrateBatch(
    filenames: string[],
    mediaMapping: MediaMapping,
  ): Promise<PageCreationResult[]> {
    const results: PageCreationResult[] = [];

    for (const filename of filenames) {
      const result = await this.migratePage(filename, mediaMapping);
      results.push(result);
    }

    return results;
  }
}

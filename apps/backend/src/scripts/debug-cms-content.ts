import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CMS Content Debug Tool
 * 
 * Bu script CMS içeriğini analiz eder ve sorunları tespit eder:
 * - Component type'ları kontrol eder
 * - Media URL'lerini kontrol eder
 * - HTML içeriği kontrol eder
 * - Prebuild component kullanımını kontrol eder
 * 
 * PRODUCTION WARNING: Bu debug logları production'da temizlenmelidir!
 */

interface DebugReport {
  timestamp: string;
  summary: {
    totalPages: number;
    totalComponents: number;
    issues: {
      unknownComponentTypes: number;
      rawHtmlContent: number;
      brokenMediaUrls: number;
      missingPrebuilds: number;
    };
  };
  pages: Array<{
    id: string;
    slug: string;
    title: string;
    issues: string[];
    components: Array<{
      id: string;
      type: string;
      blockId: string;
      issues: string[];
      data: any;
    }>;
  }>;
  recommendations: string[];
}

async function debugCmsContent() {
  console.log('🔍 Starting CMS Content Debug...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const report: DebugReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: 0,
      totalComponents: 0,
      issues: {
        unknownComponentTypes: 0,
        rawHtmlContent: 0,
        brokenMediaUrls: 0,
        missingPrebuilds: 0,
      },
    },
    pages: [],
    recommendations: [],
  };

  try {
    // Get all pages with components
    const pages = await dataSource.query(`
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.status,
        p.content,
        COUNT(c.id) as component_count
      FROM cms_pages p
      LEFT JOIN cms_components c ON c."pageId" = p.id
      GROUP BY p.id
      ORDER BY p."createdAt" DESC
    `);

    report.summary.totalPages = pages.length;
    console.log(`📄 Found ${pages.length} pages\n`);

    for (const page of pages) {
      console.log(`\n📄 Analyzing page: ${page.title} (${page.slug})`);
      
      const pageReport = {
        id: page.id,
        slug: page.slug,
        title: page.title,
        issues: [],
        components: [],
      };

      // Get components for this page
      const components = await dataSource.query(`
        SELECT 
          id,
          type,
          "blockId",
          data,
          "order"
        FROM cms_components
        WHERE "pageId" = $1
        ORDER BY "order" ASC
      `, [page.id]);

      report.summary.totalComponents += components.length;
      console.log(`  └─ ${components.length} components`);

      for (const component of components) {
        const componentReport = {
          id: component.id,
          type: component.type,
          blockId: component.blockId,
          issues: [],
          data: component.data,
        };

        // Check 1: Unknown component types
        const validTypes = [
          'hero',
          'text',
          'image',
          'video',
          'carousel',
          'grid',
          'card',
          'button',
          'form',
          'accordion',
          'tabs',
          'testimonial',
          'stats',
          'cta',
          'features',
          'pricing',
          'team',
          'contact',
          'map',
          'social',
          'newsletter',
          'faq',
          'timeline',
          'gallery',
          'blog',
          'products',
          'services',
        ];

        if (!validTypes.includes(component.type)) {
          componentReport.issues.push(`❌ Unknown component type: ${component.type}`);
          report.summary.issues.unknownComponentTypes++;
        }

        // Check 2: Raw HTML content
        if (component.data) {
          const dataStr = JSON.stringify(component.data);
          if (dataStr.includes('<h1') || dataStr.includes('<h2') || dataStr.includes('<div') || dataStr.includes('<p>')) {
            componentReport.issues.push('⚠️  Contains raw HTML tags');
            report.summary.issues.rawHtmlContent++;
          }
        }

        // Check 3: Media URLs
        if (component.type === 'image' || component.type === 'video') {
          const mediaUrl = component.data?.src || component.data?.url || component.data?.imageUrl;
          
          if (!mediaUrl) {
            componentReport.issues.push('❌ Missing media URL');
            report.summary.issues.brokenMediaUrls++;
          } else if (!mediaUrl.startsWith('http') && !mediaUrl.startsWith('/')) {
            componentReport.issues.push(`⚠️  Invalid media URL: ${mediaUrl}`);
            report.summary.issues.brokenMediaUrls++;
          }
        }

        // Check 4: Prebuild component usage
        if (!component.blockId || component.blockId === 'custom') {
          componentReport.issues.push('⚠️  Not using prebuild component (blockId missing or custom)');
          report.summary.issues.missingPrebuilds++;
        }

        if (componentReport.issues.length > 0) {
          console.log(`    ⚠️  Component ${component.type} (${component.blockId}):`);
          componentReport.issues.forEach(issue => console.log(`       ${issue}`));
        }

        pageReport.components.push(componentReport);
      }

      // Page-level issues
      if (page.content && typeof page.content === 'string') {
        if (page.content.includes('<h1') || page.content.includes('<div')) {
          pageReport.issues.push('⚠️  Page content contains raw HTML');
        }
      }

      report.pages.push(pageReport);
    }

    // Generate recommendations
    console.log('\n\n📊 SUMMARY\n');
    console.log(`Total Pages: ${report.summary.totalPages}`);
    console.log(`Total Components: ${report.summary.totalComponents}`);
    console.log(`\nIssues Found:`);
    console.log(`  - Unknown Component Types: ${report.summary.issues.unknownComponentTypes}`);
    console.log(`  - Raw HTML Content: ${report.summary.issues.rawHtmlContent}`);
    console.log(`  - Broken Media URLs: ${report.summary.issues.brokenMediaUrls}`);
    console.log(`  - Missing Prebuilds: ${report.summary.issues.missingPrebuilds}`);

    // Recommendations
    if (report.summary.issues.unknownComponentTypes > 0) {
      report.recommendations.push(
        '🔧 Fix unknown component types: Update migration script to map to valid component types'
      );
    }

    if (report.summary.issues.rawHtmlContent > 0) {
      report.recommendations.push(
        '🔧 Fix raw HTML: Parse HTML and convert to structured component data'
      );
    }

    if (report.summary.issues.brokenMediaUrls > 0) {
      report.recommendations.push(
        '🔧 Fix media URLs: Ensure all media is uploaded to MinIO and URLs are updated'
      );
    }

    if (report.summary.issues.missingPrebuilds > 0) {
      report.recommendations.push(
        '🔧 Fix prebuild components: Map migrated components to existing prebuild blockIds'
      );
    }

    console.log('\n\n💡 RECOMMENDATIONS\n');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    // Save report
    const reportPath = path.join(__dirname, '../../CMS_DEBUG_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Debug report saved to: ${reportPath}`);

    // Check reusable sections
    console.log('\n\n🔍 Checking Reusable Sections...\n');
    const sections = await dataSource.query(`
      SELECT id, name, type, "blockId"
      FROM cms_reusable_sections
    `);

    console.log(`Found ${sections.length} reusable sections`);
    sections.forEach(section => {
      console.log(`  - ${section.name} (type: ${section.type}, blockId: ${section.blockId})`);
    });

  } catch (error) {
    console.error('❌ Error during debug:', error);
    throw error;
  } finally {
    await app.close();
  }

  return report;
}

// Run debug
debugCmsContent()
  .then(() => {
    console.log('\n✅ Debug completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error);
    process.exit(1);
  });

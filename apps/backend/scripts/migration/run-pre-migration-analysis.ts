#!/usr/bin/env ts-node
/**
 * Pre-Migration Analysis Script
 * 
 * Runs comprehensive analysis before database migration
 * Generates report with findings and recommendations
 */

import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface AnalysisResult {
  section: string;
  query: string;
  results: any[];
  summary: string;
  concerns: string[];
}

class PreMigrationAnalyzer {
  private dataSource: DataSource;
  private results: AnalysisResult[] = [];

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'affexai_db',
    });
  }

  async connect() {
    await this.dataSource.initialize();
    console.log('✅ Database connected');
  }

  async disconnect() {
    await this.dataSource.destroy();
    console.log('✅ Database disconnected');
  }

  async runQuery(query: string): Promise<any[]> {
    return await this.dataSource.query(query);
  }

  async analyze() {
    console.log('\n🔍 Starting Pre-Migration Analysis...\n');

    await this.analyzeComponentDistribution();
    await this.analyzePropsStructure();
    await this.analyzeSampleProps();
    await this.analyzePageRelationships();
    await this.analyzeComponentHierarchy();
    await this.analyzeMigrationTarget();
    await this.analyzeNonMigrationTarget();
    await this.analyzeDuplicateBlockTypes();
    await this.analyzePropsVariations();
    await this.analyzeTableSize();
    await this.analyzeComponentTypes();

    console.log('\n✅ Analysis Complete!\n');
  }

  async analyzeComponentDistribution() {
    console.log('📊 1. Component Distribution Analysis...');
    
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(DISTINCT page_id) as used_in_pages,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM cms_components 
      GROUP BY type
      ORDER BY count DESC;
    `;

    const results = await this.runQuery(query);
    const totalComponents = results.reduce((sum, r) => sum + parseInt(r.count), 0);
    
    console.log(`   Total components: ${totalComponents}`);
    results.forEach(r => {
      console.log(`   - ${r.type}: ${r.count} (${r.percentage}%) in ${r.used_in_pages} pages`);
    });

    const concerns: string[] = [];
    const componentType = results.find(r => r.type === 'Component');
    if (componentType && parseInt(componentType.count) > 100) {
      concerns.push(`High number of 'Component' type (${componentType.count}) - migration may take time`);
    }

    this.results.push({
      section: '1. Component Distribution',
      query,
      results,
      summary: `Total: ${totalComponents} components across ${results.length} types`,
      concerns,
    });
  }

  async analyzePropsStructure() {
    console.log('📊 2. Props Structure Analysis...');
    
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN props ? 'blockType' THEN 1 END) as has_block_type,
        COUNT(CASE WHEN props ? 'blockCategory' THEN 1 END) as has_block_category,
        COUNT(CASE WHEN props ? 'blockId' THEN 1 END) as has_block_id
      FROM cms_components 
      GROUP BY type;
    `;

    const results = await this.runQuery(query);
    
    results.forEach(r => {
      console.log(`   ${r.type}:`);
      console.log(`     - blockType: ${r.has_block_type}/${r.count}`);
      console.log(`     - blockCategory: ${r.has_block_category}/${r.count}`);
      console.log(`     - blockId: ${r.has_block_id}/${r.count}`);
    });

    const concerns: string[] = [];
    results.forEach(r => {
      if (parseInt(r.has_block_type) > 0 && r.type !== 'Component') {
        concerns.push(`Type '${r.type}' has blockType in props but is not 'Component' type`);
      }
    });

    this.results.push({
      section: '2. Props Structure',
      query,
      results,
      summary: `Analyzed props structure across ${results.length} component types`,
      concerns,
    });
  }

  async analyzeSampleProps() {
    console.log('📊 3. Sample Props Inspection...');
    
    const query = `
      SELECT 
        id,
        type,
        props
      FROM cms_components 
      WHERE type = 'Component'
      LIMIT 5;
    `;

    const results = await this.runQuery(query);
    
    console.log(`   Found ${results.length} sample components`);
    results.forEach((r, i) => {
      console.log(`   Sample ${i + 1}:`);
      console.log(`     ID: ${r.id}`);
      console.log(`     Props keys: ${Object.keys(r.props || {}).join(', ')}`);
    });

    this.results.push({
      section: '3. Sample Props',
      query,
      results,
      summary: `Inspected ${results.length} sample components`,
      concerns: [],
    });
  }

  async analyzePageRelationships() {
    console.log('📊 4. Page-Component Relationships...');
    
    const query = `
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.status,
        COUNT(c.id) as component_count,
        COUNT(CASE WHEN c.type = 'Component' THEN 1 END) as generic_components
      FROM cms_pages p
      LEFT JOIN cms_components c ON c.page_id = p.id
      GROUP BY p.id, p.slug, p.title, p.status
      HAVING COUNT(CASE WHEN c.type = 'Component' THEN 1 END) > 0
      ORDER BY generic_components DESC;
    `;

    const results = await this.runQuery(query);
    
    const publishedPages = results.filter(r => r.status === 'published').length;
    const draftPages = results.filter(r => r.status === 'draft').length;
    
    console.log(`   Total pages affected: ${results.length}`);
    console.log(`   - Published: ${publishedPages}`);
    console.log(`   - Draft: ${draftPages}`);

    const concerns: string[] = [];
    if (publishedPages > 0) {
      concerns.push(`${publishedPages} published pages will be affected - requires careful testing`);
    }

    this.results.push({
      section: '4. Page Relationships',
      query,
      results,
      summary: `${results.length} pages affected (${publishedPages} published, ${draftPages} draft)`,
      concerns,
    });
  }

  async analyzeComponentHierarchy() {
    console.log('📊 5. Component Hierarchy Analysis...');
    
    const query = `
      SELECT 
        parent_id IS NULL as is_root,
        type,
        COUNT(*) as count
      FROM cms_components
      GROUP BY parent_id IS NULL, type
      ORDER BY is_root DESC, count DESC;
    `;

    const results = await this.runQuery(query);
    
    const rootComponents = results.filter(r => r.is_root).reduce((sum, r) => sum + parseInt(r.count), 0);
    const nestedComponents = results.filter(r => !r.is_root).reduce((sum, r) => sum + parseInt(r.count), 0);
    
    console.log(`   Root components: ${rootComponents}`);
    console.log(`   Nested components: ${nestedComponents}`);

    this.results.push({
      section: '5. Component Hierarchy',
      query,
      results,
      summary: `${rootComponents} root, ${nestedComponents} nested components`,
      concerns: [],
    });
  }

  async analyzeMigrationTarget() {
    console.log('📊 6. Migration Target Analysis...');
    
    const query = `
      SELECT 
        id,
        page_id,
        type,
        props->>'blockType' as block_type,
        props->>'blockCategory' as block_category,
        props->>'blockId' as block_id
      FROM cms_components
      WHERE type = 'Component' 
        AND props ? 'blockType';
    `;

    const results = await this.runQuery(query);
    
    const uniqueBlockTypes = new Set(results.map(r => r.block_type)).size;
    const uniqueBlockCategories = new Set(results.map(r => r.block_category)).size;
    
    console.log(`   Components to migrate: ${results.length}`);
    console.log(`   Unique blockTypes: ${uniqueBlockTypes}`);
    console.log(`   Unique blockCategories: ${uniqueBlockCategories}`);

    const concerns: string[] = [];
    if (results.length === 0) {
      concerns.push('⚠️  No components found with blockType - migration may not be necessary');
    }

    this.results.push({
      section: '6. Migration Target',
      query,
      results,
      summary: `${results.length} components will be migrated`,
      concerns,
    });
  }

  async analyzeNonMigrationTarget() {
    console.log('📊 7. Non-Migration Target Analysis...');
    
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN props ? 'blockType' THEN 1 END) as has_block_type
      FROM cms_components
      WHERE type != 'Component' OR (props->>'blockType' IS NULL)
      GROUP BY type;
    `;

    const results = await this.runQuery(query);
    
    const unchangedCount = results.reduce((sum, r) => sum + parseInt(r.count), 0);
    
    console.log(`   Unchanged components: ${unchangedCount}`);
    results.forEach(r => {
      console.log(`   - ${r.type}: ${r.count}`);
    });

    this.results.push({
      section: '7. Non-Migration Target',
      query,
      results,
      summary: `${unchangedCount} components will remain unchanged`,
      concerns: [],
    });
  }

  async analyzeDuplicateBlockTypes() {
    console.log('📊 8. Duplicate BlockType Analysis...');
    
    const query = `
      SELECT 
        props->>'blockType' as block_type,
        COUNT(*) as count
      FROM cms_components
      WHERE props ? 'blockType'
      GROUP BY props->>'blockType'
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;

    const results = await this.runQuery(query);
    
    console.log(`   Duplicate blockTypes: ${results.length}`);
    results.slice(0, 5).forEach(r => {
      console.log(`   - ${r.block_type}: ${r.count} occurrences`);
    });

    const concerns: string[] = [];
    if (results.length > 0) {
      concerns.push(`${results.length} blockTypes used multiple times - this is expected for reusable blocks`);
    }

    this.results.push({
      section: '8. Duplicate BlockTypes',
      query,
      results,
      summary: `${results.length} blockTypes used multiple times`,
      concerns,
    });
  }

  async analyzePropsVariations() {
    console.log('📊 9. Props Variations Analysis...');
    
    const query = `
      SELECT DISTINCT
        jsonb_object_keys(props) as prop_key,
        COUNT(*) as usage_count
      FROM cms_components
      WHERE type = 'Component'
      GROUP BY prop_key
      ORDER BY usage_count DESC;
    `;

    const results = await this.runQuery(query);
    
    console.log(`   Unique prop keys: ${results.length}`);
    results.slice(0, 10).forEach(r => {
      console.log(`   - ${r.prop_key}: ${r.usage_count} uses`);
    });

    this.results.push({
      section: '9. Props Variations',
      query,
      results,
      summary: `${results.length} unique prop keys found`,
      concerns: [],
    });
  }

  async analyzeTableSize() {
    console.log('📊 10. Table Size Analysis...');
    
    const query = `
      SELECT 
        pg_size_pretty(pg_total_relation_size('cms_components')) as total_size,
        pg_size_pretty(pg_relation_size('cms_components')) as table_size,
        pg_size_pretty(pg_indexes_size('cms_components')) as indexes_size,
        (SELECT COUNT(*) FROM cms_components) as row_count;
    `;

    const results = await this.runQuery(query);
    const result = results[0];
    
    console.log(`   Table size: ${result.table_size}`);
    console.log(`   Indexes size: ${result.indexes_size}`);
    console.log(`   Total size: ${result.total_size}`);
    console.log(`   Row count: ${result.row_count}`);

    const concerns: string[] = [];
    if (parseInt(result.row_count) > 10000) {
      concerns.push('Large table - migration may take several minutes');
    }

    this.results.push({
      section: '10. Table Size',
      query,
      results,
      summary: `${result.row_count} rows, ${result.total_size} total`,
      concerns,
    });
  }

  async analyzeComponentTypes() {
    console.log('📊 11. Component Type Enum Analysis...');
    
    const query = `
      SELECT DISTINCT type, COUNT(*) as count
      FROM cms_components
      GROUP BY type
      ORDER BY count DESC;
    `;

    const results = await this.runQuery(query);
    
    console.log(`   Component types in use: ${results.length}`);
    results.forEach(r => {
      console.log(`   - ${r.type}: ${r.count}`);
    });

    this.results.push({
      section: '11. Component Types',
      query,
      results,
      summary: `${results.length} component types in use`,
      concerns: [],
    });
  }

  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# Pre-Migration Analysis Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `---\n\n`;

    // Executive Summary
    report += `## Executive Summary\n\n`;
    
    const totalConcerns = this.results.reduce((sum, r) => sum + r.concerns.length, 0);
    const criticalConcerns = this.results.filter(r => 
      r.concerns.some(c => c.includes('⚠️'))
    ).length;

    report += `- **Total Analysis Sections:** ${this.results.length}\n`;
    report += `- **Total Concerns:** ${totalConcerns}\n`;
    report += `- **Critical Concerns:** ${criticalConcerns}\n\n`;

    if (totalConcerns === 0) {
      report += `✅ **Status:** READY FOR MIGRATION\n\n`;
    } else if (criticalConcerns > 0) {
      report += `⚠️  **Status:** REVIEW REQUIRED\n\n`;
    } else {
      report += `⚡ **Status:** PROCEED WITH CAUTION\n\n`;
    }

    report += `---\n\n`;

    // Detailed Results
    report += `## Detailed Analysis Results\n\n`;

    this.results.forEach((result, index) => {
      report += `### ${result.section}\n\n`;
      report += `**Summary:** ${result.summary}\n\n`;

      if (result.concerns.length > 0) {
        report += `**Concerns:**\n`;
        result.concerns.forEach(concern => {
          report += `- ${concern}\n`;
        });
        report += `\n`;
      }

      report += `**Query:**\n\`\`\`sql\n${result.query.trim()}\n\`\`\`\n\n`;

      if (result.results.length > 0 && result.results.length <= 20) {
        report += `**Results:**\n\`\`\`json\n${JSON.stringify(result.results, null, 2)}\n\`\`\`\n\n`;
      } else if (result.results.length > 20) {
        report += `**Results:** ${result.results.length} rows (too many to display)\n\n`;
      }

      report += `---\n\n`;
    });

    // Recommendations
    report += `## Recommendations\n\n`;

    const migrationTarget = this.results.find(r => r.section.includes('Migration Target'));
    if (migrationTarget && migrationTarget.results.length === 0) {
      report += `⚠️  **No components found with blockType** - Consider if migration is necessary\n\n`;
    } else if (migrationTarget) {
      report += `✅ **Proceed with migration** - ${migrationTarget.results.length} components will be migrated\n\n`;
    }

    const pageRelationships = this.results.find(r => r.section.includes('Page Relationships'));
    if (pageRelationships) {
      const publishedPages = pageRelationships.results.filter((r: any) => r.status === 'published').length;
      if (publishedPages > 0) {
        report += `⚠️  **${publishedPages} published pages affected** - Thorough testing required\n\n`;
      }
    }

    report += `## Next Steps\n\n`;
    report += `1. Review all concerns above\n`;
    report += `2. Create database backup\n`;
    report += `3. Test migration on staging\n`;
    report += `4. Run migration on production\n`;
    report += `5. Verify results\n`;
    report += `6. Monitor for issues\n\n`;

    return report;
  }

  async saveReport(report: string) {
    const filename = `PRE_MIGRATION_ANALYSIS_REPORT_${new Date().toISOString().split('T')[0]}.md`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, report);
    console.log(`\n📄 Report saved to: ${filepath}`);
  }
}

// Main execution
async function main() {
  const analyzer = new PreMigrationAnalyzer();

  try {
    await analyzer.connect();
    await analyzer.analyze();
    
    const report = analyzer.generateReport();
    await analyzer.saveReport(report);
    
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(60));
    console.log('\nReview the generated report before proceeding with migration.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await analyzer.disconnect();
  }
}

if (require.main === module) {
  main();
}

import * as fs from 'fs';
import * as path from 'path';

async function testMigration() {
  console.log('🚀 Testing migration files...\n');

  const extractedDir = path.join(__dirname, '../../extracted_pages');
  
  // Read mapping files
  const pageMappingPath = path.join(extractedDir, 'PAGE_MAPPING_REPORT.md');
  const imageAnalysisPath = path.join(extractedDir, 'IMAGE_ANALYSIS_REPORT.json');
  const migrationMappingPath = path.join(extractedDir, 'MIGRATION_MAPPING.json');

  console.log('📁 Checking files:');
  console.log(`   PAGE_MAPPING_REPORT.md: ${fs.existsSync(pageMappingPath) ? '✅' : '❌'}`);
  console.log(`   IMAGE_ANALYSIS_REPORT.json: ${fs.existsSync(imageAnalysisPath) ? '✅' : '❌'}`);
  console.log(`   MIGRATION_MAPPING.json: ${fs.existsSync(migrationMappingPath) ? '✅' : '❌'}`);

  if (!fs.existsSync(pageMappingPath)) {
    console.error('\n❌ PAGE_MAPPING_REPORT.md not found!');
    return;
  }

  // Parse page mapping
  const pageMappingContent = fs.readFileSync(pageMappingPath, 'utf-8');
  const mappingRegex = /\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g;
  const mappings: Array<{ file: string; template: string; confidence: string }> = [];
  
  let match;
  while ((match = mappingRegex.exec(pageMappingContent)) !== null) {
    const [, file, template, confidence] = match;
    if (file !== 'Dosya Adı' && template.trim() !== '-') {
      mappings.push({
        file: file.trim(),
        template: template.trim(),
        confidence: confidence.trim()
      });
    }
  }

  console.log(`\n📊 Found ${mappings.length} page mappings`);
  console.log('\nFirst 5 mappings:');
  mappings.slice(0, 5).forEach(m => {
    console.log(`   ${m.file} → ${m.template} (${m.confidence})`);
  });

  // Check HTML files
  const htmlDir = path.join(extractedDir, 'html');
  if (fs.existsSync(htmlDir)) {
    const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
    console.log(`\n📄 Found ${htmlFiles.length} HTML files`);
  } else {
    console.log('\n❌ HTML directory not found!');
  }

  console.log('\n✅ Test complete!');
}

testMigration().catch(console.error);

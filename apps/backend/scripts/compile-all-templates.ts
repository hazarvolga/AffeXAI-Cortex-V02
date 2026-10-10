import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { EmailTemplate } from '../src/modules/email-marketing/entities/email-template.entity';

// Load .env
dotenv.config({ path: '/Users/hazarekiz/Projects/v06/Affexai/apps/backend/.env' });

// MJML 4 import
import mjml2html from 'mjml';

// Parse DATABASE_URL from .env
const dbUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5434/affexai_dev';
const url = new URL(dbUrl);

const AppDataSource = new DataSource({
  type: 'postgres',
  host: url.hostname,
  port: parseInt(url.port),
  username: url.username,
  password: url.password,
  database: url.pathname.slice(1), // Remove leading /
  entities: [EmailTemplate],
  synchronize: false,
});

/**
 * Helper functions for MJML rendering (copied from MjmlRendererService)
 */

function buildAttributes(attrs: Record<string, string>): string[] {
  return Object.entries(attrs)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${value}"`);
}

function renderSectionAttributes(settings: Record<string, any>): string {
  const attrs: string[] = [];

  if (settings.backgroundColor) {
    attrs.push(`background-color="${settings.backgroundColor}"`);
  }
  if (settings.padding) {
    // Parse padding like "32px 24px" into paddingTop/paddingBottom
    const padding = settings.padding;
    attrs.push(`padding="${padding}"`);
  } else {
    if (settings.paddingTop) {
      attrs.push(`padding-top="${settings.paddingTop}"`);
    }
    if (settings.paddingBottom) {
      attrs.push(`padding-bottom="${settings.paddingBottom}"`);
    }
  }

  return attrs.join(' ');
}

function renderBlock(block: any): string {
  const { type, properties, styles } = block;

  switch (type) {
    case 'heading':
      return renderHeading(properties, styles);
    case 'text':
      return renderText(properties, styles);
    case 'button':
      return renderButton(properties, styles);
    case 'image':
      return renderImage(properties, styles);
    case 'divider':
      return renderDivider(properties, styles);
    case 'spacer':
      return renderSpacer(properties, styles);
    case 'html':
      return renderHtml(properties);
    default:
      console.warn(`Unknown block type: ${type}`);
      return '';
  }
}

function renderHeading(props: Record<string, any>, styles: Record<string, any>): string {
  const attrs = buildAttributes({
    'font-size': styles.fontSize || '24px',
    'font-weight': styles.fontWeight || 'bold',
    'color': styles.color || '#333333',
    'align': styles.textAlign || props.align || 'left',
    'padding': styles.padding || '10px 0',
  });

  // Support both 'content' (Email Builder) and 'text' (legacy)
  const text = props.content || props.text || '';
  return `<mj-text ${attrs.join(' ')}>${text}</mj-text>`;
}

function renderText(props: Record<string, any>, styles: Record<string, any>): string {
  const attrs = buildAttributes({
    'font-size': styles.fontSize || '14px',
    'color': styles.color || '#333333',
    'align': styles.textAlign || props.align || 'left',
    'padding': styles.padding || '10px 0',
    'line-height': styles.lineHeight || '1.6',
  });

  // Support both 'content' (Email Builder) and 'text' (legacy)
  const text = props.content || props.text || '';
  return `<mj-text ${attrs.join(' ')}>${text}</mj-text>`;
}

function renderButton(props: Record<string, any>, styles: Record<string, any>): string {
  const attrs = buildAttributes({
    'background-color': styles.backgroundColor || '#0066cc',
    'color': styles.color || '#ffffff',
    'font-size': styles.fontSize || '14px',
    'font-weight': styles.fontWeight || 'bold',
    'border-radius': styles.borderRadius || '4px',
    'padding': styles.padding || '12px 24px',
    'align': styles.textAlign || props.align || 'center',
    'href': props.href || props.url || '#',
  });

  // Support both 'content' (Email Builder) and 'text' (legacy)
  const text = props.content || props.text || 'Click here';
  return `<mj-button ${attrs.join(' ')}>${text}</mj-button>`;
}

function renderImage(props: Record<string, any>, styles: Record<string, any>): string {
  const attrs = buildAttributes({
    'src': props.src || '',
    'alt': props.alt || '',
    'width': styles.width || 'auto',
    'align': props.align || 'center',
    'padding': styles.padding || '10px 0',
  });

  if (props.href) {
    attrs.push(`href="${props.href}"`);
  }

  return `<mj-image ${attrs.join(' ')} />`;
}

function renderDivider(props: Record<string, any>, styles: Record<string, any>): string {
  const attrs = buildAttributes({
    'border-color': styles.borderColor || '#dddddd',
    'border-width': styles.borderWidth || '1px',
    'padding': styles.padding || '10px 0',
  });

  return `<mj-divider ${attrs.join(' ')} />`;
}

function renderSpacer(props: Record<string, any>, styles: Record<string, any>): string {
  const height = styles.height || '20px';
  return `<mj-spacer height="${height}" />`;
}

function renderHtml(props: Record<string, any>): string {
  return `<mj-raw>${props.html || ''}</mj-raw>`;
}

function renderColumn(column: any): string {
  const { width, blocks } = column;

  return `
    <mj-column width="${width}">
      ${blocks.map((block) => renderBlock(block)).join('\n')}
    </mj-column>
  `;
}

function renderRow(row: any): string {
  const { columns, settings } = row;

  const sectionAttrs = renderSectionAttributes(settings);

  return `
    <mj-section ${sectionAttrs}>
      ${columns.map((col) => renderColumn(col)).join('\n')}
    </mj-section>
  `;
}

function renderHead(settings: any): string {
  const fonts = settings.fonts || ['Inter'];
  const fontImports = fonts
    .map((font: string) => `<mj-font name="${font}" href="https://fonts.googleapis.com/css2?family=${font}:wght@400;500;600;700&display=swap" />`)
    .join('\n');

  return `
    ${fontImports}
    <mj-style>
      body { font-family: ${fonts[0]}, sans-serif; }
      .link { color: #0066cc; text-decoration: none; }
      .link:hover { text-decoration: underline; }
    </mj-style>
  `;
}

function renderBodyAttributes(settings: any): string {
  const attrs: string[] = [];

  if (settings.backgroundColor) {
    attrs.push(`background-color="${settings.backgroundColor}"`);
  }
  if (settings.contentWidth) {
    attrs.push(`width="${settings.contentWidth}"`);
  }

  return attrs.join(' ');
}

function structureToMjml(structure: any): string {
  const { rows, settings } = structure;
  const mjmlContent = `
    <mjml>
      <mj-head>${renderHead(settings)}</mj-head>
      <mj-body ${renderBodyAttributes(settings)}>
        ${rows.map((row) => renderRow(row)).join('\n')}
      </mj-body>
    </mjml>
  `;
  return mjmlContent;
}

function mjmlToHtml(mjml: string): { html: string; errors: any[] } {
  const result = mjml2html(mjml, {
    validationLevel: 'soft',
    minify: false,
  });
  return {
    html: result.html,
    errors: result.errors || [],
  };
}

/**
 * Main script
 */
async function main() {
  console.log('🔧 Connecting to database...');
  await AppDataSource.initialize();

  const templateRepo = AppDataSource.getRepository(EmailTemplate);

  // Get all templates with structure
  const templates = await templateRepo.find({
    where: {
      structure: {} as any, // JSONB not null check
    },
  });

  console.log(`\n📧 Found ${templates.length} templates with structure\n`);

  let compiled = 0;
  let skipped = 0;
  let failed = 0;

  for (const template of templates) {
    // Skip if already compiled
    if (template.compiledHtml && template.compiledMjml) {
      console.log(`⏭️  SKIP: ${template.name} (already compiled)`);
      skipped++;
      continue;
    }

    try {
      // Compile structure → MJML → HTML
      const mjml = structureToMjml(template.structure);
      const { html, errors } = mjmlToHtml(mjml);

      if (errors.length > 0) {
        console.log(`⚠️  WARN: ${template.name} - ${errors.length} MJML errors`);
        errors.forEach((err) => console.log(`    ${err.message}`));
      }

      if (!html || html.trim() === '') {
        console.log(`❌ FAIL: ${template.name} - Empty HTML generated`);
        failed++;
        continue;
      }

      // Save to database
      await templateRepo.update(template.id, {
        compiledHtml: html,
        compiledMjml: mjml,
      });

      console.log(`✅ OK: ${template.name} (${html.length} chars)`);
      compiled++;
    } catch (error) {
      console.log(`❌ ERROR: ${template.name} - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Compiled: ${compiled}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);

  await AppDataSource.destroy();
  console.log('\n✨ Done!\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

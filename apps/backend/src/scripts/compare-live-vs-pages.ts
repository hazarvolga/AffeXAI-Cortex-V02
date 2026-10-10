/**
 * Compare Live vs Pages Script
 * 
 * Compares the live site (aluplan.com.tr) with the migrated content in the database.
 * Focuses on the pages defined in SLUG_WHITELIST.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { XMLParser } from '../scripts/wordpress-xml-migration/parsers/xml-parser';
import { HTMLParser } from '../scripts/wordpress-xml-migration/parsers/html-parser';
import { ComponentMapper } from '../scripts/wordpress-xml-migration/mappers/component-mapper';

// Load env vars
dotenv.config({ path: 'apps/backend/.env' });

const LIVE_BASE_URL = 'https://aluplan.com.tr';
const JSON_MODE = process.argv.includes('--json');
const WRITE_MODE = process.argv.includes('--write');
const UPDATE_MODE = process.argv.includes('--update');
const AUGMENT_MODE = process.argv.includes('--augment');
const xmlArgIndex = process.argv.indexOf('--xml-file');
const XML_FILE_PATH = xmlArgIndex >= 0 ? (process.argv[xmlArgIndex + 1] || '').trim() : '';

// Optional single slug override via CLI: --slug <slug>
const slugArgIndex = process.argv.indexOf('--slug');
const SINGLE_SLUG = slugArgIndex >= 0 ? (process.argv[slugArgIndex + 1] || '').trim() : '';
const HAS_SINGLE_SLUG = !!SINGLE_SLUG;

function loadWhitelist(): string[] {
  // Try local JSON list first
  const jsonPath = 'apps/backend/src/scripts/pages-list.json';
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  // Fallback minimal list
  return ['2025-ana-sayfa'];
}

let SLUG_WHITELIST = loadWhitelist();
if (SINGLE_SLUG) {
  SLUG_WHITELIST = [SINGLE_SLUG];
}

// Map live site slugs to local CMS slugs where they differ
function mapLiveSlugToLocal(slug: string): string {
  if (!slug) return slug;
  // Homepage aliasing: live "2025-ana-sayfa" corresponds to local "home"
  if (slug === '2025-ana-sayfa') return 'home';
  return slug;
}

interface PageComparison {
  slug: string;
  live: {
    status: number;
    sections: number;
    images: number;
    headings: number;
    videos: number;
    icons: number;
    links: number;
    headingWeighted: number;
  };
  local: {
    exists: boolean;
    components: number;
    images: number; // Components with imageMediaId
    type: string; // 'Rich' (pattern matched) or 'Fallback'
    videos: number;
    icons: number;
    links: number;
    headingWeighted: number;
  };
  suggested?: {
    template?: string;
    blocks: string[];
  };
}

async function compareLiveVsPages() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
    entities: [],
    synchronize: false,
  });

  try {
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected!');

    const comparisons: PageComparison[] = [];

    // If whitelist seems minimal, try to auto-discover from live navigation
    if (!HAS_SINGLE_SLUG && (!SLUG_WHITELIST || SLUG_WHITELIST.length <= 1)) {
      try {
        const resp = await axios.get(LIVE_BASE_URL, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AffexaiMigrationBot/1.0)' },
          validateStatus: () => true,
        });
        if (resp.status === 200) {
          const $nav = cheerio.load(resp.data);
          const candidates = new Set<string>();
          $nav('nav a, .elementor-nav-menu a, .menu-item a, a[href^="/"], a[href^="http"]').each((_, el) => {
            const href = $nav(el).attr('href') || '';
            if (!href) return;
            let path = href;
            if (href.startsWith('http')) {
              try {
                const u = new URL(href);
                if (!u.hostname.includes('aluplan.com.tr')) return;
                path = u.pathname;
              } catch { return; }
            }
            if (!path.startsWith('/')) return;
            // normalize
            path = path.split('#')[0].split('?')[0];
            if (path === '/' || path.trim() === '') return;
            path = path.replace(/^\//, '');
            // avoid asset/content paths
            if (path.startsWith('wp-') || path.startsWith('wp-content') || path.startsWith('wp-json')) return;
            // limit depth to first segment or two
            const segments = path.split('/').filter(Boolean);
            const slug = segments.join('/');
            candidates.add(slug);
          });
          const list = Array.from(candidates);
          // Simple heuristic: prefer short slugs (<= 40 chars)
          const discovered = list.filter(s => s.length <= 40);
          SLUG_WHITELIST = discovered.length > 0 ? discovered : SLUG_WHITELIST;
        }
      } catch {}
    }

    console.log(`Analyzing ${SLUG_WHITELIST.length} pages...`);

    for (const slug of SLUG_WHITELIST) {
      const comparison: PageComparison = {
        slug,
        live: {
          status: 0,
          sections: 0,
          images: 0,
          headings: 0,
          videos: 0,
          icons: 0,
          links: 0,
          headingWeighted: 0,
        },
        local: {
          exists: false,
          components: 0,
          images: 0,
          type: 'Unknown',
          videos: 0,
          icons: 0,
          links: 0,
          headingWeighted: 0,
        }
      };

      // 1. Analyze Live Site
      try {
        const url = slug === 'home' || slug === '2025-ana-sayfa' ? LIVE_BASE_URL : `${LIVE_BASE_URL}/${slug}`;
        // console.log(`Fetching live: ${url}`);
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AffexaiMigrationBot/1.0)' },
          validateStatus: () => true
        });
        
        comparison.live.status = response.status;

        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          comparison.live.sections = $('.elementor-section').length;
          comparison.live.images = $('img').length;
          comparison.live.headings = $('h1, h2, h3, h4, h5, h6').length;
          comparison.live.videos = $('video').length + $('iframe[src*="youtube"], iframe[src*="vimeo"]').length;
          comparison.live.icons = $('i[class*="icon"], i[class*="fa"], svg').length;
          comparison.live.links = $('a').length;
          const h1 = $('h1').length;
          const h2 = $('h2').length;
          const h3 = $('h3').length;
          const h4 = $('h4').length;
          const h5 = $('h5').length;
          const h6 = $('h6').length;
          comparison.live.headingWeighted = (h1 * 5) + (h2 * 3) + (h3 * 2) + (h4 * 1) + (h5 * 1) + (h6 * 1);
          // Suggest blocks/templates from live metrics
          comparison.suggested = suggestFromLive($, comparison.live);
        }
      } catch (error) {
        // console.error(`Error fetching live ${slug}:`, error.message);
      }

      // 2. Analyze Local Database
      const localSlug = mapLiveSlugToLocal(slug);
      const pages = await dataSource.query(
        `SELECT id FROM cms_pages WHERE slug = $1`,
        [localSlug]
      );

      if (pages.length > 0) {
        comparison.local.exists = true;
        const pageId = pages[0].id;
        process.stdout.write(` [DB:pageId=${pageId}]`);

        const components = await dataSource.query(
          `SELECT block_id, props FROM cms_components WHERE page_id = $1`,
          [pageId]
        );

        comparison.local.components = components.length;
        process.stdout.write(` [DB:components=${components.length}]`);
        
        // Count images (components with image props)
        comparison.local.images = components.filter((c: any) => {
          const props = c.props; // TypeORM returns JSON automatically for jsonb columns
          return props && (props.imageMediaId || props.imageUrl || props.backgroundImage);
        }).length;

        // Count videos (video blocks or props with videoUrl)
        comparison.local.videos = components.filter((c: any) => {
          const props = c.props;
          return c.block_id === 'video-embed-section' || (props && (props.videoUrl || props.provider));
        }).length;

        // Count icons heuristically
        comparison.local.icons = components.reduce((acc: number, c: any) => {
          const props = c.props || {};
          const count = countIconOccurrences(props);
          return acc + count;
        }, 0);

        // Count links heuristically (href in buttons or url fields)
        comparison.local.links = components.reduce((acc: number, c: any) => {
          const props = c.props || {};
          let count = 0;
          if (Array.isArray(props.buttons)) {
            count += props.buttons.filter((b: any) => !!b?.href).length;
          }
          if (props.href) count += 1;
          if (props.url) count += 1;
          // Common nested lists
          if (Array.isArray(props.items)) {
            count += props.items.filter((it: any) => !!it?.href || !!it?.url).length;
          }
          return acc + count;
        }, 0);

        // Weighted headings based on titleVariant
        comparison.local.headingWeighted = components.reduce((score: number, c: any) => {
          const props = c.props || {};
          const v = (props.titleVariant || props.variant || '').toLowerCase();
          if (!props.title) return score;
          const weight = v.includes('heading1') ? 5
            : v.includes('heading2') ? 3
            : v.includes('heading3') ? 2
            : 1;
          return score + weight;
        }, 0);

        // Determine type
        const hasRichComponents = components.some((c: any) => 
          ['content-with-image-two-column', 'content-three-column-grid', 'hero-with-background-image'].includes(c.block_id)
        );
        comparison.local.type = hasRichComponents ? 'Rich' : 'Fallback';
      }

      comparisons.push(comparison);
      // Optional write mode: create page + components if missing
      if (WRITE_MODE && !comparison.local.exists && comparison.live.status === 200) {
        try {
          const url = slug === 'home' || slug === '2025-ana-sayfa' ? LIVE_BASE_URL : `${LIVE_BASE_URL}/${slug}`;
          const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AffexaiMigrationBot/1.0)' },
            validateStatus: () => true
          });
          const $ = cheerio.load(response.data);
          const blocks = (comparison.suggested && comparison.suggested.blocks.length > 0)
            ? comparison.suggested.blocks
            : buildFallbackBlocks($, comparison.live);
          if (blocks.length > 0) {
            await createPageWithBlocks(dataSource, slug, blocks, $);
            process.stdout.write(' [WRITE]');
          } else {
            process.stdout.write(' [SKIP]');
          }
        } catch (e: any) {
          process.stdout.write(' [WRITE-ERR]');
        }
      }
      // Optional update mode: enrich props for existing pages
      if (UPDATE_MODE && comparison.local.exists && comparison.live.status === 200) {
        try {
          const url = slug === 'home' || slug === '2025-ana-sayfa' ? LIVE_BASE_URL : `${LIVE_BASE_URL}/${slug}`;
          const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AffexaiMigrationBot/1.0)' },
            validateStatus: () => true
          });
          const $ = cheerio.load(response.data);
          const page = await dataSource.query(`SELECT id FROM cms_pages WHERE slug = $1`, [localSlug]);
          const pageId = page[0]?.id;
          if (pageId) {
            const existing = await dataSource.query(`SELECT id, block_id FROM cms_components WHERE page_id = $1 ORDER BY order_index ASC`, [pageId]);
            for (const row of existing) {
              const enriched = buildDefaultProps(row.block_id, $);
              if (Object.keys(enriched).length > 0) {
                await dataSource.query(
                  `UPDATE cms_components SET props = $2::jsonb, updated_at = NOW() WHERE id = $1`,
                  [row.id, JSON.stringify(enriched)]
                );
              }
            }
            process.stdout.write(' [UPDATE]');
          }
        } catch (e: any) {
          process.stdout.write(' [UPDATE-ERR]');
        }
      }

      // Optional augment mode: add suggested/fallback blocks to existing page if missing
  if (AUGMENT_MODE && comparison.local.exists && comparison.live.status === 200) {
    try {
      let $: cheerio.CheerioAPI;
      if (XML_FILE_PATH && fs.existsSync(XML_FILE_PATH)) {
        const xmlParser = new XMLParser();
        const htmlParser = new HTMLParser();
        const mapper = new ComponentMapper();
        const pages = await xmlParser.parseWordPressXML(XML_FILE_PATH);
        const wpPage = pages.find(p => p.slug === slug || p.slug === mapLiveSlugToLocal(slug));
        if (wpPage) {
          const parsed = htmlParser.parse(wpPage.content);
          // Build mapped components from XML elements
          const mapped = mapper.mapElements(parsed.elements);
          const page = await dataSource.query(`SELECT id FROM cms_pages WHERE slug = $1`, [localSlug]);
          const pageId = page[0]?.id;
          if (pageId) {
            const existing = await dataSource.query(`SELECT id, block_id, order_index FROM cms_components WHERE page_id = $1 ORDER BY order_index ASC`, [pageId]);
            const existingIds = new Set<string>(existing.map((r: any) => r.block_id));
            let orderIndex = existing.reduce((max: number, r: any) => Math.max(max, r.order_index ?? 0), -1) + 1;
            for (const m of mapped) {
              const props = normalizeXmlProps(m.props);
              if (!existingIds.has(m.blockId)) {
                await dataSource.query(
                  `INSERT INTO cms_components (page_id, parent_id, type, block_type, block_category, block_id, reusable_component_id, props, order_index, created_at, updated_at)
                   VALUES ($1, NULL, 'block', NULL, NULL, $2, NULL, $3::jsonb, $4, NOW(), NOW())`,
                  [pageId, m.blockId, JSON.stringify(props), orderIndex]
                );
                orderIndex += 1;
              } else {
                // Merge props into existing component if fields are missing
                const row = existing.find((r: any) => r.block_id === m.blockId);
                if (row) {
                  const current = await dataSource.query(`SELECT props FROM cms_components WHERE id = $1`, [row.id]);
                  const merged = mergeProps(current[0]?.props || {}, props);
                  await dataSource.query(
                    `UPDATE cms_components SET props = $2::jsonb, updated_at = NOW() WHERE id = $1`,
                    [row.id, JSON.stringify(merged)]
                  );
                }
              }
            }
            process.stdout.write(' [AUGMENT-XML]');
          }
          // Continue to next slug
          continue;
        }
      }
      const url = slug === 'home' || slug === '2025-ana-sayfa' ? LIVE_BASE_URL : `${LIVE_BASE_URL}/${slug}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AffexaiMigrationBot/1.0)' },
        validateStatus: () => true
      });
      $ = cheerio.load(response.data);
      const page = await dataSource.query(`SELECT id FROM cms_pages WHERE slug = $1`, [localSlug]);
      const pageId = page[0]?.id;
      if (pageId) {
        const existing = await dataSource.query(`SELECT id, block_id, order_index FROM cms_components WHERE page_id = $1 ORDER BY order_index ASC`, [pageId]);
        const existingIds = new Set<string>(existing.map((r: any) => r.block_id));
            const lastOrder = existing.reduce((max: number, r: any) => Math.max(max, r.order_index ?? 0), -1);
            let suggested = (comparison.suggested && comparison.suggested.blocks.length > 0)
              ? [...comparison.suggested.blocks]
              : buildFallbackBlocks($, comparison.live);
            // Ensure hero present when there is a main heading
            const firstHeading = $('h1, h2').first().text().trim();
            if (firstHeading && !suggested.includes('hero-with-background-image')) {
              suggested.unshift('hero-with-background-image');
            }
            let orderIndex = lastOrder + 1;
            for (const blockId of suggested) {
              if (existingIds.has(blockId)) continue;
              const props = buildDefaultProps(blockId, $);
              await dataSource.query(
                `INSERT INTO cms_components (page_id, parent_id, type, block_type, block_category, block_id, reusable_component_id, props, order_index, created_at, updated_at)
                 VALUES ($1, NULL, 'block', NULL, NULL, $2, NULL, $3::jsonb, $4, NOW(), NOW())`,
                [pageId, blockId, JSON.stringify(props), orderIndex]
              );
              orderIndex += 1;
            }
            process.stdout.write(' [AUGMENT]');
          }
        } catch (e: any) {
          process.stdout.write(' [AUGMENT-ERR]');
        }
      }
      process.stdout.write('.'); // Progress indicator
    }

    if (JSON_MODE) {
      const payload = comparisons.map(c => ({
        slug: c.slug,
        live: c.live,
        local: c.local,
        suggested: c.suggested,
      }));
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log('\n\n--- Comparison Report ---');
      console.log('Slug'.padEnd(35) + ' | Live (Sec/Img) | Local (Comp/Img) | Status');
      console.log('-'.repeat(90));

      comparisons.forEach(c => {
        const liveStr = `${c.live.sections}/${c.live.images}`;
        const localStr = `${c.local.components}/${c.local.images}`;
        let status = '';

        if (!c.local.exists) status = 'MISSING LOCALLY';
        else if (c.live.status !== 200) status = `LIVE ERROR (${c.live.status})`;
        else if (c.local.components === 0) status = 'EMPTY LOCALLY';
        else status = c.local.type;

        console.log(`${c.slug.padEnd(35)} | ${liveStr.padEnd(14)} | ${localStr.padEnd(16)} | ${status}`);
      });

      console.log('\n--- Heuristic Details (Icons/Videos/Links/HeadingWeighted) ---');
      comparisons.forEach(c => {
        console.log(`[Heuristic] /${c.slug}`);
        console.log(`Live: sections=${c.live.sections}, images=${c.live.images}, videos=${c.live.videos}, icons=${c.live.icons}, links=${c.live.links}, headingWeighted=${c.live.headingWeighted}`);
        console.log(`Local: components=${c.local.components}, images=${c.local.images}, videos=${c.local.videos}, icons=${c.local.icons}, links=${c.local.links}, headingWeighted=${c.local.headingWeighted}`);
        if (c.suggested) {
          console.log(`Suggested: template=${c.suggested.template || 'N/A'}, blocks=${c.suggested.blocks.join(', ') || 'N/A'}`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

compareLiveVsPages();

// Helper: count icon occurrences in props deeply
function countIconOccurrences(obj: any): number {
  if (!obj) return 0;
  let count = 0;
  const keysToCheck = ['icon', 'iconName', 'iconUrl'];
  try {
    const stack = [obj];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (Array.isArray(current)) {
        for (const item of current) stack.push(item);
      } else if (typeof current === 'object') {
        for (const [k, v] of Object.entries(current)) {
          if (keysToCheck.includes(k) && v) count += 1;
          if (v && (typeof v === 'object')) stack.push(v);
        }
      }
    }
  } catch (_) {}
  return count;
}

// Suggest blocks/templates using live metrics and DOM
function suggestFromLive($: cheerio.CheerioAPI, live: PageComparison['live']): { template?: string; blocks: string[] } {
  const blocks: string[] = [];
  let template: string | undefined = undefined;

  // Hero detection: large heading near top + background image
  const firstHeading = $('h1, h2').first().text().trim();
  const hasTopHeroImage = $('.elementor-section:first img').length > 0 || $('header img').length > 0;
  if (firstHeading && hasTopHeroImage) {
    blocks.push('hero-with-background-image');
    template = 'Hero + Content';
  }

  // Video sections
  if (live.videos > 0) blocks.push('video-embed-section');

  // Icon-heavy pages
  if (live.icons >= 200) blocks.push('icon-grid');

  // Content grids
  if (live.sections >= 20 && live.images >= 8) blocks.push('content-three-column-grid');

  // Legal/policy pages: few images, many links, headings low-to-mid
  if (live.images <= 2 && live.links >= 100) {
    blocks.push('content-rich-text');
    template = template || 'Legal';
  }

  // Always include a content section if headings exist
  if (live.headings > 5) blocks.push('content-section-with-title');

  // Newsletter detection (Turkish phrases)
  const hasNewsletter = $('body').text().toLowerCase().includes('e-bültenimize üye olun')
    || $('body').text().toLowerCase().includes('allplan hakkındaki yenilikleri ilk öğrenen ol');
  if (hasNewsletter) blocks.push('newsletter-signup');

  // CTA banner detection (trial text)
  const hasTrialCta = $('body').text().toUpperCase().includes("ALLPLAN'I 14 GÜN ÜCRETSİZ DENEYİN");
  if (hasTrialCta) blocks.push('cta-banner');

  // Solutions trio detection
  const solutionsHeadings = ['BİNA TASARIMI', 'ALTYAPI TASARIMI', 'İNŞAAT PLANLAMASI'];
  const foundCount = solutionsHeadings.filter(h => $('body').text().toUpperCase().includes(h)).length;
  if (foundCount >= 2) blocks.push('special-feature-trio');

  // De-duplicate
  const uniqueBlocks = Array.from(new Set(blocks));
  return { template, blocks: uniqueBlocks };
}

async function createPageWithBlocks(dataSource: DataSource, slug: string, blocks: string[], $: cheerio.CheerioAPI): Promise<void> {
  const title = $('h1').first().text().trim() || slug;
  const pageRes = await dataSource.query(
    `INSERT INTO cms_pages (title, slug, description, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'draft', NOW(), NOW()) RETURNING id`,
    [title, slug, null]
  );
  const pageId = pageRes[0]?.id;
  if (!pageId) return;

  let orderIndex = 0;
  for (const blockId of blocks) {
    const props = buildDefaultProps(blockId, $);
    await dataSource.query(
      `INSERT INTO cms_components (page_id, parent_id, type, block_type, block_category, block_id, reusable_component_id, props, order_index, created_at, updated_at)
       VALUES ($1, NULL, 'block', NULL, NULL, $2, NULL, $3::jsonb, $4, NOW(), NOW())`,
      [pageId, blockId, JSON.stringify(props), orderIndex]
    );
    orderIndex += 1;
  }
}

function buildDefaultProps(blockId: string, $: cheerio.CheerioAPI): Record<string, any> {
  switch (blockId) {
    case 'hero-with-background-image': {
      const title = $('h1').first().text().trim();
      const subtitleCandidate = $('h1').first().nextAll('p').first().text().trim();
      const rawBgImg = $('header img').first().attr('src') || $('.elementor-section:first img').first().attr('src') || '';
      const bgImg = mapToMinioUrl(rawBgImg);
      return {
        title: title || 'Welcome',
        titleVariant: 'heading1',
        subtitle: subtitleCandidate || '',
        backgroundMediaType: bgImg ? 'image' : 'none',
        backgroundMediaUrl: bgImg || '',
      };
    }
    case 'video-embed-section': {
      const vUrl = extractVideoUrl($);
      return { videoUrl: vUrl || '', provider: vUrl?.includes('vimeo') ? 'vimeo' : (vUrl ? 'youtube' : 'unknown') };
    }
    case 'icon-grid': {
      return { items: [] };
    }
    case 'content-three-column-grid': {
      const items = extractThreeColumnItems($);
      return { title: $('h2').first().text().trim() || '', items: items.length ? items : [{ title: '', content: '' }, { title: '', content: '' }, { title: '', content: '' }] };
    }
    case 'content-single-fullwidth': {
      const firstP = $('p').first().text().trim();
      return { title: '', content: firstP || '' };
    }
    case 'content-section-with-title': {
      const h = $('h2').first().text().trim() || $('h1').first().text().trim();
      const p = $('h2').first().nextAll('p').first().text().trim() || $('h1').first().nextAll('p').first().text().trim() || '';
      return { title: h || 'Section', content: p };
    }
    case 'content-rich-text': {
      let html = $('main').html() || $('article').html() || $('body').html() || '';
      if (html) {
        html = html.replace(/https?:\/\/[^\s"']*aluplan\.com\.tr\/wp-content\/uploads\//g, '/api/media/wordpress-images/');
      }
      return { htmlContent: html };
    }
    case 'newsletter-signup': {
      const title = ($('body').text().match(/E-bültenimize üye olun/i)?.[0]) || 'E-bültenimize üye olun';
      const description = ($('body').text().match(/ALLPLAN HAKKINDAKİ YENİLİKLERİ İLK ÖĞRENEN OL/i)?.[0]) || '';
      return { title, description };
    }
    case 'cta-banner': {
      const title = "ALLPLAN'I 14 GÜN ÜCRETSİZ DENEYİN";
      const ctaText = 'Hemen Dene';
      // Try find a nearby link
      const link = $('a:contains("14 GÜN")').first().attr('href') || '#';
      return { title, ctaText, ctaLink: link };
    }
    case 'special-feature-trio': {
      const items = [
        { title: 'Bina Tasarımı', description: '' },
        { title: 'Altyapı Tasarımı', description: '' },
        { title: 'İnşaat Planlaması', description: '' },
      ];
      return { title: 'Allplan Çözümleri', items };
    }
    default:
      return {};
  }
}

function normalizeXmlProps(props: Record<string, any>): Record<string, any> {
  const out = { ...props };
  if (out.imageUrl) out.backgroundImageUrl = mapToMinioUrl(out.imageUrl);
  if (out.image) out.imageUrl = mapToMinioUrl(out.image);
  if (Array.isArray(out.items)) {
    out.items = out.items.map((it: any) => ({
      ...it,
      image: it?.image ? mapToMinioUrl(it.image) : it?.image,
    }));
  }
  return out;
}

function mergeProps(current: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  const out = { ...current };
  for (const [k, v] of Object.entries(incoming)) {
    const cur = out[k];
    if (cur === undefined || cur === null || cur === '' || (Array.isArray(cur) && cur.length === 0)) {
      out[k] = v;
    }
  }
  return out;
}

// Fallback block builder when no suggestions are found
function buildFallbackBlocks($: cheerio.CheerioAPI, live: PageComparison['live']): string[] {
  const blocks: string[] = [];
  const hasMainHtml = !!($('main').html() || $('article').html() || $('body').html());
  // Prefer rich-text if we can capture page HTML
  if (hasMainHtml) {
    blocks.push('content-rich-text');
  }
  // Add a simple titled section if there are headings
  if (live.headings > 0) {
    blocks.push('content-section-with-title');
  }
  return Array.from(new Set(blocks));
}

function extractVideoUrl($: cheerio.CheerioAPI): string | null {
  const iframe = $('iframe[src*="youtube"], iframe[src*="vimeo"]').first().attr('src');
  if (iframe) return iframe;
  const a = $('a[href*="youtube"], a[href*="youtu.be"], a[href*="vimeo"]').first().attr('href');
  return a || null;
}

function extractThreeColumnItems($: cheerio.CheerioAPI): Array<{ title: string; content: string }> {
  const section = $('.elementor-section').filter((_, el) => $(el).find('.elementor-column').length >= 3).first();
  const cols = section.length ? section.find('.elementor-column').slice(0, 3) : $('.elementor-column').slice(0, 3);
  const items: Array<{ title: string; content: string }> = [];
  cols.each((_, col) => {
    const $col = $(col);
    const title = ($col.find('h3, h4, h5').first().text().trim()) || '';
    const content = ($col.find('p').first().text().trim()) || '';
    items.push({ title, content });
  });
  return items;
}

// Map WordPress uploads to MinIO media URLs
function mapToMinioUrl(src: string | undefined | null): string {
  if (!src) return '';
  try {
    const url = src.toString();
    const match = url.match(/\/wp-content\/uploads\/(.+)$/);
    if (match && match[1]) {
      return `/api/media/wordpress-images/${match[1]}`;
    }
    return url;
  } catch {
    return src as string;
  }
}

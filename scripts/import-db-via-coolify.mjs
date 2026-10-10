import { chromium } from 'playwright';
import fs from 'fs';

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';

async function importDatabase() {
  console.log('🚀 Starting database import via Coolify Terminal...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // Login
    console.log('🔐 Logging into Coolify...');
    await page.goto(COOLIFY_URL, { timeout: 30000 });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Logged in\n');

    // Navigate to backend application
    console.log('📍 Navigating to backend application...');
    const backendUrl = `${COOLIFY_URL}/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/BACKEND_APP_ID`;

    // First go to environment to find backend
    await page.goto(`${COOLIFY_URL}/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w`);
    await page.waitForTimeout(3000);

    // Find backend app by looking for "backend", "api", or "nest"
    const appCards = await page.locator('[class*="application"], [data-application], a[href*="application"]').all();
    let backendAppUrl = null;

    for (const card of appCards) {
      const text = await card.textContent();
      if (text && (text.toLowerCase().includes('backend') || text.toLowerCase().includes('api') || text.toLowerCase().includes('nest'))) {
        const href = await card.getAttribute('href');
        if (href) {
          backendAppUrl = href.startsWith('http') ? href : `${COOLIFY_URL}${href}`;
          break;
        }
      }
    }

    if (backendAppUrl) {
      console.log(`✅ Found backend app: ${backendAppUrl}\n`);
      await page.goto(backendAppUrl);
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  Could not auto-detect backend app, trying manual navigation...');
    }

    // Click Terminal tab
    console.log('💻 Opening Terminal...');
    const terminalTab = page.locator('text=/terminal/i, a:has-text("Terminal"), button:has-text("Terminal")').first();
    if (await terminalTab.isVisible({ timeout: 5000 })) {
      await terminalTab.click();
      await page.waitForTimeout(3000);
      console.log('✅ Terminal opened\n');
    } else {
      console.log('❌ Could not find Terminal tab');
      await page.screenshot({ path: '/tmp/coolify-terminal-error.png' });
      throw new Error('Terminal tab not found');
    }

    // Read SQL file
    console.log('📦 Reading SQL dump file...');
    const sqlContent = fs.readFileSync('/tmp/affexai-production-import.sql', 'utf-8');
    console.log(`✅ SQL file read (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);

    // Split into chunks for safer transmission
    const chunkSize = 10000;
    const chunks = [];
    for (let i = 0; i < sqlContent.length; i += chunkSize) {
      chunks.push(sqlContent.substring(i, i + chunkSize));
    }
    console.log(`📦 Split into ${chunks.length} chunks\n`);

    // Find terminal textarea
    console.log('🔍 Finding terminal input...');
    await page.waitForTimeout(2000);

    // Try multiple selectors for terminal input
    const terminalInput = await page.locator('textarea, .xterm-helper-textarea, input[type="text"]').first();

    if (await terminalInput.isVisible({ timeout: 5000 })) {
      console.log('✅ Terminal input found\n');

      // Create temp file and write chunks
      console.log('📝 Creating SQL file in container...');

      // Clear any existing file
      await terminalInput.fill('rm -f /tmp/import.sql');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Write SQL content in chunks
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Writing chunk ${i + 1}/${chunks.length}...`);
        const escapedChunk = chunks[i].replace(/'/g, "'\\''").replace(/\n/g, '\\n');
        await terminalInput.fill(`printf '%s' '${escapedChunk}' >> /tmp/import.sql`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
      console.log('✅ SQL file created in container\n');

      // Import to database
      console.log('📥 Importing to PostgreSQL...');
      await terminalInput.fill('psql "$DATABASE_URL" < /tmp/import.sql');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000);
      console.log('✅ Import command executed\n');

      // Verify
      console.log('🔍 Verifying import...');
      await terminalInput.fill('psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pages;"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      await terminalInput.fill('psql "$DATABASE_URL" -c "SELECT slug, title FROM pages LIMIT 5;"');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      console.log('✅ Verification queries executed\n');

      console.log('🎉 Database import process completed!');
      console.log('📺 Browser will stay open for 30 seconds so you can see the results...\n');

      await page.waitForTimeout(30000);
    } else {
      console.log('❌ Could not find terminal input');
      await page.screenshot({ path: '/tmp/coolify-terminal-input-error.png' });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/coolify-error.png' });
    console.log('📸 Screenshot saved to /tmp/coolify-error.png');
  } finally {
    await browser.close();
  }
}

importDatabase();

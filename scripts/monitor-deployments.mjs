import { chromium } from 'playwright';

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';

async function monitorDeployments() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    console.log('🔐 Logging into Coolify...');
    await page.goto(COOLIFY_URL, { timeout: 30000 });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    console.log('✅ Logged in successfully!\n');

    // Go to project environment
    await page.goto(`${COOLIFY_URL}/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w`);
    await page.waitForTimeout(3000);

    console.log('📊 Fetching deployment statuses...\n');

    // Get all application cards
    const appCards = await page.locator('[data-state], .application, [class*="app"]').all();

    for (const card of appCards) {
      const text = await card.textContent();
      if (text.toLowerCase().includes('backend') || text.toLowerCase().includes('api')) {
        console.log('🔵 BACKEND:');
        console.log(text.substring(0, 200));
        console.log('---\n');
      }
      if (text.toLowerCase().includes('frontend') || text.toLowerCase().includes('aluplan')) {
        console.log('🟢 FRONTEND:');
        console.log(text.substring(0, 200));
        console.log('---\n');
      }
    }

    console.log('✅ Monitoring complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

monitorDeployments();

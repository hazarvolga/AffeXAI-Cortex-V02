const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';
const DEPLOYMENT_URL = 'https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw/deployment/u8w8404os88cgg0kg4sos0g4';

const screenshotsDir = path.join(__dirname, '..', 'deployment-screenshots');

async function getLogs() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1200 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  try {
    console.log('🔐 Logging in...');
    await page.goto(COOLIFY_URL);
    await page.waitForTimeout(2000);

    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/coolify\.aluplan\.tr\/(?!login)/);
    await page.waitForTimeout(2000);

    console.log('✅ Logged in, navigating directly to deployment...');
    await page.goto(DEPLOYMENT_URL);
    await page.waitForTimeout(5000);

    // Take screenshot
    const screenshot = path.join(screenshotsDir, 'deployment-direct.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`📸 Screenshot: ${screenshot}`);

    // Extract all visible text
    const fullText = await page.textContent('body');
    const textPath = path.join(screenshotsDir, 'deployment-text.txt');
    fs.writeFileSync(textPath, fullText);
    console.log(`💾 Full text saved: ${textPath}`);

    // Print a preview
    console.log('\n📜 TEXT PREVIEW (first 3000 chars):');
    console.log('='.repeat(80));
    console.log(fullText.substring(0, 3000));
    console.log('='.repeat(80));

    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

getLogs().catch(console.error);

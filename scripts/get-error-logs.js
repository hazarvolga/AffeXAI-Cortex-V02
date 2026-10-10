const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';
const APP_URL = 'https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw';

const screenshotsDir = path.join(__dirname, '..', 'deployment-screenshots');

async function getErrorLogs() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
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

    console.log('✅ Logged in');
    console.log('📂 Navigating to application...');
    await page.goto(APP_URL);
    await page.waitForTimeout(3000);

    // Click Deployments tab
    await page.locator('a:has-text("Deployments")').first().click();
    await page.waitForTimeout(2000);

    // Click on the first (failed) deployment
    console.log('🖱️  Clicking on failed deployment...');
    const firstDeployment = await page.locator('a[href*="/deployment/"]').first();
    await firstDeployment.click();
    await page.waitForTimeout(3000);

    // Take screenshot
    const screenshot = path.join(screenshotsDir, 'error-logs-page.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`📸 Screenshot: ${screenshot}`);

    // Try to find logs - look for the Logs tab
    console.log('🔍 Looking for Logs tab...');
    const logsTab = await page.locator('button:has-text("Logs"), a:has-text("Logs")').first();
    if (await logsTab.isVisible({ timeout: 5000 })) {
      await logsTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked Logs tab');
    }

    // Take another screenshot
    const logsScreenshot = path.join(screenshotsDir, 'error-logs-detail.png');
    await page.screenshot({ path: logsScreenshot, fullPage: true });

    // Extract all text from the page
    console.log('📋 Extracting page content...');
    const fullText = await page.textContent('body');

    // Save full page text
    const textPath = path.join(screenshotsDir, 'error-page-text.txt');
    fs.writeFileSync(textPath, fullText);
    console.log(`💾 Full page text saved: ${textPath}`);

    // Look for pre/code elements with logs
    const logElements = await page.locator('pre, code, [class*="terminal"], [class*="console"]').all();
    console.log(`Found ${logElements.length} potential log elements`);

    let allLogs = [];
    for (let i = 0; i < logElements.length; i++) {
      const text = await logElements[i].textContent();
      if (text && text.trim().length > 50) {
        allLogs.push(`\n=== Log Element ${i + 1} ===\n${text}\n`);
      }
    }

    if (allLogs.length > 0) {
      const logsPath = path.join(screenshotsDir, 'extracted-logs.txt');
      fs.writeFileSync(logsPath, allLogs.join('\n'));
      console.log(`✅ Extracted ${allLogs.length} log sections to: ${logsPath}`);

      // Print first 2000 characters
      console.log('\n📜 LOG PREVIEW (first 2000 chars):');
      console.log('='.repeat(80));
      console.log(allLogs.join('\n').substring(0, 2000));
      console.log('='.repeat(80));
    } else {
      console.log('⚠️  No logs found in standard elements');
    }

    // Keep browser open
    console.log('\n🔍 Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

getErrorLogs().catch(console.error);

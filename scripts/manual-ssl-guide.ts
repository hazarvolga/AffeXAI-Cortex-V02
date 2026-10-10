import { chromium, Page, Browser } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const COOLIFY_URL = 'https://coolify.aluplan.tr/';
const USERNAME = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';

const screenshotsDir = path.join(__dirname, '../screenshots/ssl-manual');

// Create screenshots directory
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${name}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  return filepath;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔧 MANUAL SSL CERTIFICATE GENERATION GUIDE');
  console.log('═══════════════════════════════════════════════════════\n');

  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('\n📍 STEP 1: Logging in...');
    await page.goto(COOLIFY_URL, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'step1-login-page');

    await page.fill('input[type="email"], input[name="email"]', USERNAME);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.click('button[type="submit"], button:has-text("Login")');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'step2-dashboard');
    console.log('✅ Logged in successfully');

    // Step 2: Explore the UI
    console.log('\n📍 STEP 2: Exploring Coolify UI...');
    console.log('📋 Looking for navigation elements...\n');

    // Get all links and buttons
    const links = await page.locator('a').allTextContents();
    const buttons = await page.locator('button').allTextContents();

    console.log('📌 Available Navigation Links:');
    links.forEach((link, index) => {
      if (link.trim()) {
        console.log(`   ${index + 1}. ${link.trim()}`);
      }
    });

    console.log('\n📌 Available Buttons:');
    buttons.forEach((button, index) => {
      if (button.trim()) {
        console.log(`   ${index + 1}. ${button.trim()}`);
      }
    });

    // Try to scroll down to see if there are more elements
    console.log('\n📍 STEP 3: Scrolling to reveal more content...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'step3-scrolled-down');

    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'step4-scrolled-more');

    // Step 4: Try clicking on "AffexAI Aluplan" project
    console.log('\n📍 STEP 4: Attempting to click on AffexAI Aluplan project...');
    try {
      // Try clicking the project title/card
      const projectElement = await page.locator('text="AffexAI Aluplan"').first();
      await projectElement.click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, 'step5-clicked-project');
      console.log('✅ Clicked on project');
    } catch (error) {
      console.log('⚠️ Could not click project directly');
    }

    // Step 5: Look for "+ Add Resource" or application list
    console.log('\n📍 STEP 5: Looking for resources/applications...');
    await page.waitForTimeout(2000);

    // Get current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Take full page screenshot
    await takeScreenshot(page, 'step6-current-state');

    // Try to find resources
    const resourceButtons = await page.locator('button, a').allTextContents();
    console.log('\n📌 All clickable elements:');
    resourceButtons.forEach((text, index) => {
      if (text.trim()) {
        console.log(`   ${index + 1}. ${text.trim()}`);
      }
    });

    // Step 6: Pause for manual interaction
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('⏸️  PAUSED FOR MANUAL INTERACTION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📋 MANUAL STEPS TO PERFORM:\n');
    console.log('1. Locate your backend application (api.aluplan.tr)');
    console.log('2. Click on it to open application settings');
    console.log('3. Find "Domains" or "Network" tab');
    console.log('4. Click "Generate Certificate" or "SSL" button');
    console.log('5. Wait for certificate generation (~60 seconds)');
    console.log('6. Verify certificate is valid (green checkmark)');
    console.log('7. Repeat for frontend application (aluplan.tr)');
    console.log('\n💡 TIP: Look for:');
    console.log('   - "Applications" or "Resources" section');
    console.log('   - Domain names: api.aluplan.tr, aluplan.tr');
    console.log('   - SSL/Certificate buttons');
    console.log('\n⏱️  Browser will stay open for 5 minutes for manual work...\n');

    // Keep browser open for 5 minutes
    await page.waitForTimeout(300000);

    console.log('\n✅ Manual interaction time completed');

  } catch (error) {
    console.error('\n❌ Error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    console.log('\n📸 All screenshots saved to:', screenshotsDir);
    console.log('\n🔍 Review the screenshots to understand the UI structure');
    await browser.close();
  }
}

main().catch(console.error);

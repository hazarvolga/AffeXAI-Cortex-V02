import { chromium, Page, Browser } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const COOLIFY_URL = 'https://coolify.aluplan.tr/';
const USERNAME = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';

const screenshotsDir = path.join(__dirname, '../screenshots/ssl-generation');

// Create screenshots directory
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${name}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

async function login(page: Page) {
  console.log('🔐 Logging into Coolify...');

  await page.goto(COOLIFY_URL, { waitUntil: 'networkidle' });
  await takeScreenshot(page, '01-login-page');

  // Fill in login credentials
  await page.fill('input[type="email"], input[name="email"]', USERNAME);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);
  await takeScreenshot(page, '02-credentials-filled');

  // Click login button
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

  // Wait for navigation after login
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await takeScreenshot(page, '03-dashboard-after-login');

  console.log('✅ Successfully logged in');
}

async function findAndProcessApplication(page: Page, searchText: string, domain: string, appType: string) {
  console.log(`\n========================================`);
  console.log(`🔧 Processing ${appType} SSL Certificate`);
  console.log(`========================================\n`);

  // Navigate to Projects in sidebar
  console.log('🔍 Clicking on Projects in sidebar...');
  try {
    await page.click('a:has-text("Projects")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, `04-${appType}-projects-sidebar`);
  } catch (error) {
    console.log('⚠️ Already on projects page or sidebar not found');
  }

  // Wait for page to load and take screenshot
  await page.waitForTimeout(2000);
  await takeScreenshot(page, `05-${appType}-looking-for-app`);

  // Try to find any element containing the search text
  console.log(`🔍 Looking for elements containing: "${searchText}"`);

  // Get all visible text on page
  const pageContent = await page.content();
  await takeScreenshot(page, `06-${appType}-page-content`);

  // Try multiple strategies to find and click the application
  const strategies = [
    // Strategy 1: Look for links/divs with the text
    async () => {
      const elements = await page.locator(`a, div, span, button`).all();
      for (const element of elements) {
        try {
          const text = await element.textContent();
          if (text && text.toLowerCase().includes(searchText.toLowerCase())) {
            console.log(`✅ Found element with text: "${text}"`);
            await element.click();
            await page.waitForTimeout(2000);
            return true;
          }
        } catch (error) {
          // Continue
        }
      }
      return false;
    },

    // Strategy 2: Click anywhere on the page that contains the domain name
    async () => {
      try {
        const domainElement = await page.locator(`text=${domain}`).first();
        if (await domainElement.isVisible({ timeout: 3000 })) {
          console.log(`✅ Found domain: ${domain}`);
          await domainElement.click();
          await page.waitForTimeout(2000);
          return true;
        }
      } catch (error) {
        return false;
      }
      return false;
    },

    // Strategy 3: Look for application cards/containers
    async () => {
      const containers = await page.locator('[class*="application"], [class*="resource"], [class*="service"], [class*="card"]').all();
      for (const container of containers) {
        try {
          const text = await container.textContent();
          if (text && (text.toLowerCase().includes(searchText.toLowerCase()) || text.includes(domain))) {
            console.log(`✅ Found container with matching text`);
            await container.click();
            await page.waitForTimeout(2000);
            return true;
          }
        } catch (error) {
          // Continue
        }
      }
      return false;
    }
  ];

  // Try all strategies
  for (let i = 0; i < strategies.length; i++) {
    console.log(`📋 Trying strategy ${i + 1}...`);
    const success = await strategies[i]();
    if (success) {
      await takeScreenshot(page, `07-${appType}-app-found`);
      break;
    }
  }

  // Now look for domains/SSL section
  console.log('🔍 Looking for Domains/SSL section...');
  await page.waitForTimeout(2000);
  await takeScreenshot(page, `08-${appType}-looking-for-ssl`);

  // Try to find and click SSL/Domain buttons
  const sslButtons = [
    'button:has-text("Generate")',
    'button:has-text("Certificate")',
    'button:has-text("SSL")',
    'a:has-text("Generate")',
    'a:has-text("Certificate")',
    'text=Generate Certificate',
    '[title*="Certificate"]',
    '[title*="SSL"]'
  ];

  for (const selector of sslButtons) {
    try {
      const button = await page.locator(selector).first();
      if (await button.isVisible({ timeout: 3000 })) {
        console.log(`✅ Found SSL button: ${selector}`);
        await button.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, `09-${appType}-ssl-clicked`);

        // Wait for generation
        console.log('⏳ Waiting for certificate generation (60 seconds)...');
        await page.waitForTimeout(60000);
        await takeScreenshot(page, `10-${appType}-ssl-complete`);

        return true;
      }
    } catch (error) {
      // Continue
    }
  }

  console.log(`⚠️ Could not complete SSL generation for ${appType}`);
  return false;
}

async function main() {
  console.log('🚀 Starting Simplified SSL Certificate Generation Process...\n');

  const browser: Browser = await chromium.launch({
    headless: false, // Show browser
    slowMo: 50
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    // Login
    await login(page);

    // Process backend - try to find by "backend", "api", or domain "api.aluplan.tr"
    await findAndProcessApplication(page, 'backend', 'api.aluplan.tr', 'backend');

    // Go back to dashboard
    await page.goto(COOLIFY_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Process frontend - try to find by "frontend" or domain "aluplan.tr"
    await findAndProcessApplication(page, 'frontend', 'aluplan.tr', 'frontend');

    console.log('\n========================================');
    console.log('🎉 SSL Certificate Generation Process Completed!');
    console.log('========================================\n');
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
    console.log('\n⚠️  Please manually verify:');
    console.log('   1. Check the screenshots folder');
    console.log('   2. Verify certificates in Coolify dashboard');
    console.log('   3. Test https://api.aluplan.tr/api/health');
    console.log('   4. Test https://aluplan.tr\n');

  } catch (error) {
    console.error('❌ Error occurred:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);

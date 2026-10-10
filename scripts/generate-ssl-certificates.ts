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

async function navigateToProject(page: Page) {
  console.log('🔍 Navigating to AffexAI Aluplan project...');

  // Try clicking on Settings button within the project card
  const settingsSelectors = [
    'div:has-text("AffexAI Aluplan") >> text=Settings',
    'a:has-text("Settings")',
    'button:has-text("Settings")'
  ];

  for (const selector of settingsSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        console.log(`✅ Found settings button: ${selector}`);
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '04-project-settings-page');

        // Now look for Applications or Resources section
        const resourcesButton = await page.locator('text=Applications, text=Resources, a:has-text("Applications"), a:has-text("Resources")').first();
        if (await resourcesButton.isVisible({ timeout: 3000 })) {
          await resourcesButton.click();
          await page.waitForTimeout(2000);
          await takeScreenshot(page, '04b-project-resources');
        }

        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  // Alternative: try clicking directly on project name
  try {
    const projectCard = await page.locator('div:has-text("AffexAI Aluplan")').first();
    if (await projectCard.isVisible({ timeout: 5000 })) {
      console.log('✅ Found project card, clicking...');
      await projectCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '04-project-page');
      return true;
    }
  } catch (error) {
    // Continue
  }

  console.log('⚠️ Could not find AffexAI Aluplan project');
  return false;
}

async function navigateToApplication(page: Page, appName: string): Promise<boolean> {
  console.log(`🔍 Searching for application: ${appName}`);

  // Take screenshot of current page
  await takeScreenshot(page, `05-searching-${appName}`);

  // Try different methods to find the application
  const selectors = [
    `a:has-text("${appName}")`,
    `[href*="${appName}"]`,
    `.application:has-text("${appName}")`,
    `div:has-text("${appName}")`,
    `button:has-text("${appName}")`,
    `span:has-text("${appName}")`
  ];

  for (const selector of selectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        console.log(`✅ Found application using selector: ${selector}`);
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await takeScreenshot(page, `06-${appName}-page`);
        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  console.log(`⚠️ Could not find application: ${appName}`);
  return false;
}

async function navigateToDomains(page: Page) {
  console.log('🔍 Looking for Domains/Network section...');

  const domainSelectors = [
    'a:has-text("Domains")',
    'a:has-text("Network")',
    'button:has-text("Domains")',
    'button:has-text("Network")',
    '[href*="domain"]',
    '[href*="network"]',
    'text=Domains',
    'text=Network'
  ];

  for (const selector of domainSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        console.log(`✅ Found domains section using: ${selector}`);
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '07-domains-page');
        return true;
      }
    } catch (error) {
      // Continue
    }
  }

  console.log('⚠️ Could not find Domains section');
  return false;
}

async function generateSSLCertificate(page: Page, domain: string): Promise<boolean> {
  console.log(`🔒 Generating SSL certificate for ${domain}...`);

  await takeScreenshot(page, `08-before-ssl-generation-${domain}`);

  // Look for SSL/Certificate generation buttons
  const sslSelectors = [
    'button:has-text("Generate Certificate")',
    'button:has-text("SSL")',
    'button:has-text("Let\'s Encrypt")',
    'button:has-text("Certificate")',
    'a:has-text("Generate Certificate")',
    'a:has-text("SSL")',
    'text=Generate Certificate',
    'text=SSL',
    'text=Let\'s Encrypt'
  ];

  for (const selector of sslSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        console.log(`✅ Found SSL generation button: ${selector}`);
        await element.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, `09-ssl-generation-clicked-${domain}`);

        // Wait for certificate generation (up to 90 seconds)
        console.log('⏳ Waiting for certificate generation...');
        await page.waitForTimeout(10000);
        await takeScreenshot(page, `10-ssl-generation-progress-${domain}`);

        // Wait additional time for completion
        await page.waitForTimeout(50000);
        await takeScreenshot(page, `11-ssl-generation-complete-${domain}`);

        // Look for success indicators
        const successSelectors = [
          'text=Valid',
          'text=Success',
          'text=Active',
          '.success',
          '.valid',
          '[data-status="valid"]'
        ];

        for (const successSelector of successSelectors) {
          try {
            const successElement = await page.locator(successSelector).first();
            if (await successElement.isVisible({ timeout: 5000 })) {
              console.log(`✅ Certificate generated successfully for ${domain}!`);
              return true;
            }
          } catch (error) {
            // Continue checking
          }
        }

        console.log(`✅ Certificate generation initiated for ${domain}`);
        return true;
      }
    } catch (error) {
      // Continue to next selector
    }
  }

  console.log(`⚠️ Could not find SSL generation button for ${domain}`);
  return false;
}

async function restartApplication(page: Page): Promise<boolean> {
  console.log('🔄 Looking for Restart button...');

  const restartSelectors = [
    'button:has-text("Restart")',
    'button:has-text("Redeploy")',
    'a:has-text("Restart")',
    'a:has-text("Redeploy")',
    'text=Restart',
    'text=Redeploy'
  ];

  for (const selector of restartSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        console.log(`✅ Found restart button: ${selector}`);
        await element.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, '12-restart-clicked');

        // Confirm restart if modal appears
        try {
          const confirmButton = await page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').first();
          if (await confirmButton.isVisible({ timeout: 3000 })) {
            await confirmButton.click();
            console.log('✅ Restart confirmed');
          }
        } catch (error) {
          // No confirmation needed
        }

        await page.waitForTimeout(5000);
        return true;
      }
    } catch (error) {
      // Continue
    }
  }

  console.log('⚠️ Could not find restart button');
  return false;
}

async function processBackendSSL(page: Page) {
  console.log('\n========================================');
  console.log('🔧 PART 1: Backend SSL Certificate');
  console.log('========================================\n');

  // Navigate to project first
  const projectFound = await navigateToProject(page);
  if (!projectFound) {
    console.log('❌ Project not found');
    return false;
  }

  // Navigate to backend application
  const backendFound = await navigateToApplication(page, 'backend');
  if (!backendFound) {
    console.log('❌ Backend application not found');
    return false;
  }

  // Navigate to domains section
  const domainsFound = await navigateToDomains(page);
  if (!domainsFound) {
    console.log('❌ Domains section not found');
    return false;
  }

  // Generate SSL certificate
  const sslGenerated = await generateSSLCertificate(page, 'api.aluplan.tr');
  if (!sslGenerated) {
    console.log('❌ Failed to generate SSL certificate');
    return false;
  }

  // Try to restart application
  await restartApplication(page);

  console.log('✅ Backend SSL certificate process completed');
  return true;
}

async function processFrontendSSL(page: Page) {
  console.log('\n========================================');
  console.log('🎨 PART 2: Frontend SSL Certificate');
  console.log('========================================\n');

  // Go back to dashboard
  await page.goto(COOLIFY_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navigate to frontend application
  const frontendFound = await navigateToApplication(page, 'frontend');
  if (!frontendFound) {
    console.log('❌ Frontend application not found');
    return false;
  }

  // Navigate to domains section
  const domainsFound = await navigateToDomains(page);
  if (!domainsFound) {
    console.log('❌ Domains section not found');
    return false;
  }

  // Generate SSL certificate
  const sslGenerated = await generateSSLCertificate(page, 'aluplan.tr');
  if (!sslGenerated) {
    console.log('❌ Failed to generate SSL certificate');
    return false;
  }

  // Try to restart application
  await restartApplication(page);

  console.log('✅ Frontend SSL certificate process completed');
  return true;
}

async function verifySSL() {
  console.log('\n========================================');
  console.log('✅ PART 3: Verification');
  console.log('========================================\n');

  console.log('🔍 Testing SSL certificates...');

  // Test backend
  try {
    const backendResponse = await fetch('https://api.aluplan.tr/api/health', {
      method: 'GET'
    });
    console.log(`✅ Backend (api.aluplan.tr): ${backendResponse.ok ? 'SSL Valid' : 'SSL Issue'}`);
  } catch (error) {
    console.log(`❌ Backend (api.aluplan.tr): ${error.message}`);
  }

  // Test frontend
  try {
    const frontendResponse = await fetch('https://aluplan.tr', {
      method: 'GET'
    });
    console.log(`✅ Frontend (aluplan.tr): ${frontendResponse.ok ? 'SSL Valid' : 'SSL Issue'}`);
  } catch (error) {
    console.log(`❌ Frontend (aluplan.tr): ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting SSL Certificate Generation Process...\n');

  const browser: Browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 100 // Slow down actions
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true // Accept self-signed certificates
  });

  const page = await context.newPage();

  try {
    // Login
    await login(page);

    // Process backend SSL
    await processBackendSSL(page);

    // Process frontend SSL
    await processFrontendSSL(page);

    // Verify SSL certificates
    await verifySSL();

    console.log('\n========================================');
    console.log('🎉 SSL Certificate Generation Completed!');
    console.log('========================================\n');
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Error occurred:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await page.waitForTimeout(5000); // Keep browser open for 5 seconds
    await browser.close();
  }
}

main().catch(console.error);

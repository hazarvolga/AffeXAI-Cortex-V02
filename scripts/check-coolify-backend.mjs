import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const COOLIFY_URL = 'https://coolify.aluplan.tr/';
const USERNAME = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';
const PROJECT_ID = 'mgccww0k04gkg0s0g8w4cw08';
const ENVIRONMENT_ID = 'ic4g4kc880ocwscg800g440w';

async function checkCoolifyBackend() {
  console.log('🚀 Starting Coolify backend inspection...');

  const browser = await chromium.launch({
    headless: false, // Set to true for automation
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true
  });

  const page = await context.newPage();

  const report = {
    timestamp: new Date().toISOString(),
    backendStatus: null,
    containerStatus: null,
    deploymentStatus: null,
    healthcheck: null,
    logs: [],
    errors: [],
    screenshots: []
  };

  try {
    // Step 1: Login to Coolify
    console.log('📝 Step 1: Logging into Coolify...');
    await page.goto(COOLIFY_URL, { waitUntil: 'networkidle' });

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    await page.fill('input[type="email"], input[name="email"]', USERNAME);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);

    // Take screenshot of login page
    const loginScreenshot = join(process.cwd(), 'claudedocs/coolify-login.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    report.screenshots.push('coolify-login.png');
    console.log('📸 Screenshot saved: coolify-login.png');

    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('✅ Logged in successfully');

    // Step 2: Navigate to dashboard and find project
    console.log('📂 Step 2: Finding AffexAI Aluplan project...');
    await page.goto(`${COOLIFY_URL}dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of dashboard
    const dashboardScreenshot = join(process.cwd(), 'claudedocs/coolify-dashboard.png');
    await page.screenshot({ path: dashboardScreenshot, fullPage: true });
    report.screenshots.push('coolify-dashboard.png');
    console.log('📸 Screenshot saved: coolify-dashboard.png');

    // Navigate directly to project environment URL (found from Playwright debug)
    console.log('Navigating directly to project environment...');
    const envUrl = `${COOLIFY_URL}project/${PROJECT_ID}/environment/${ENVIRONMENT_ID}`;
    await page.goto(envUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of project page
    const projectScreenshot = join(process.cwd(), 'claudedocs/coolify-project.png');
    await page.screenshot({ path: projectScreenshot, fullPage: true });
    report.screenshots.push('coolify-project.png');
    console.log('📸 Screenshot saved: coolify-project.png');

    // Step 3: Find backend application
    console.log('🔍 Step 3: Looking for BACKEND application...');

    // Debug: Print all visible links
    const allLinks = await page.locator('a').all();
    console.log(`\nDEBUG: Found ${allLinks.length} total links on page`);
    for (let i = 0; i < Math.min(allLinks.length, 30); i++) {
      const link = allLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href) {
        console.log(`  [${i}] ${text?.trim() || '(no text)'} -> ${href}`);
      }
    }

    // Look for all application cards or links
    const applications = await page.locator('a[href*="/application/"], div[class*="resource"], [data-resource-type="application"]').all();
    console.log(`\nFound ${applications.length} application links`);

    let backendLink = null;
    for (const app of applications) {
      const text = await app.textContent();
      const href = await app.getAttribute('href');
      console.log(`- Application: "${text?.trim()}" -> ${href}`);

      if (text && (
        text.toLowerCase().includes('backend') ||
        text.toLowerCase().includes('api') ||
        text.toLowerCase().includes('nest')
      )) {
        backendLink = app;
        console.log('✅ Found BACKEND application!');
        break;
      }
    }

    if (!backendLink) {
      // If not found by text, try to get all application links and check their URLs
      const allLinks = await page.locator('a[href*="/application/"]').all();
      console.log(`Checking ${allLinks.length} application links by URL...`);

      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        console.log(`- Link: ${href}`);

        // Take the first application link if we can't identify by name
        if (href && href.includes('/application/')) {
          backendLink = link;
          console.log('⚠️ Using first application link (couldn\'t identify by name)');
          break;
        }
      }
    }

    if (!backendLink) {
      throw new Error('❌ Could not find backend application in environment');
    }

    // Click on backend application
    await backendLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of backend overview
    const backendScreenshot = join(process.cwd(), 'claudedocs/coolify-backend-overview.png');
    await page.screenshot({ path: backendScreenshot, fullPage: true });
    report.screenshots.push('coolify-backend-overview.png');
    console.log('📸 Screenshot saved: coolify-backend-overview.png');

    // Step 4: Extract backend status information
    console.log('📊 Step 4: Extracting backend status...');

    // Container status
    const statusIndicators = await page.locator('[data-status], .status, [class*="status"]').all();
    for (const indicator of statusIndicators) {
      const statusText = await indicator.textContent();
      console.log(`Status indicator: ${statusText}`);
      report.backendStatus = statusText;
    }

    // Look for "Running", "Exited", "Restarting" badges
    const statusBadges = await page.locator('.badge, [class*="badge"], [class*="pill"]').all();
    for (const badge of statusBadges) {
      const badgeText = await badge.textContent();
      if (badgeText && (
        badgeText.toLowerCase().includes('running') ||
        badgeText.toLowerCase().includes('exited') ||
        badgeText.toLowerCase().includes('stopped') ||
        badgeText.toLowerCase().includes('restarting')
      )) {
        report.containerStatus = badgeText.trim();
        console.log(`Container status: ${badgeText}`);
      }
    }

    // Deployment status
    const deploymentInfo = await page.locator('[data-deployment], [class*="deployment"]').all();
    for (const info of deploymentInfo) {
      const text = await info.textContent();
      console.log(`Deployment info: ${text}`);
      report.deploymentStatus = text;
    }

    // Check for healthcheck status
    const healthcheckElements = await page.locator('[class*="health"], [data-health]').all();
    for (const element of healthcheckElements) {
      const text = await element.textContent();
      console.log(`Healthcheck: ${text}`);
      report.healthcheck = text;
    }

    // Step 5: Check logs
    console.log('📜 Step 5: Checking application logs...');

    // Look for logs tab or button
    const logsButton = await page.locator('a[href*="logs"], button:has-text("Logs"), [data-tab="logs"]').first();
    if (await logsButton.isVisible()) {
      await logsButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot of logs
      const logsScreenshot = join(process.cwd(), 'claudedocs/coolify-backend-logs.png');
      await page.screenshot({ path: logsScreenshot, fullPage: true });
      report.screenshots.push('coolify-backend-logs.png');
      console.log('📸 Screenshot saved: coolify-backend-logs.png');

      // Extract log content
      const logContainer = await page.locator('pre, code, [class*="log"], [data-logs]').first();
      if (await logContainer.isVisible()) {
        const logText = await logContainer.textContent();
        const logLines = logText.split('\n').slice(-100); // Last 100 lines
        report.logs = logLines;

        // Look for errors
        const errorLines = logLines.filter(line =>
          line.toLowerCase().includes('error') ||
          line.toLowerCase().includes('failed') ||
          line.toLowerCase().includes('exception') ||
          line.toLowerCase().includes('crash')
        );
        report.errors = errorLines;

        console.log(`📝 Extracted ${logLines.length} log lines`);
        console.log(`❌ Found ${errorLines.length} error lines`);
      }
    } else {
      console.log('⚠️ Could not find logs tab/button');
    }

    // Step 6: Check configuration
    console.log('⚙️ Step 6: Checking configuration...');

    // Look for environment variables or configuration tab
    const configButton = await page.locator('a[href*="configuration"], button:has-text("Configuration"), a[href*="environment"]').first();
    if (await configButton.isVisible()) {
      await configButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot of configuration
      const configScreenshot = join(process.cwd(), 'claudedocs/coolify-backend-config.png');
      await page.screenshot({ path: configScreenshot, fullPage: true });
      report.screenshots.push('coolify-backend-config.png');
      console.log('📸 Screenshot saved: coolify-backend-config.png');
    }

    console.log('✅ Inspection complete!');

  } catch (error) {
    console.error('❌ Error during inspection:', error.message);
    report.errors.push(`Inspection error: ${error.message}`);

    // Take error screenshot
    const errorScreenshot = join(process.cwd(), 'claudedocs/coolify-error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    report.screenshots.push('coolify-error.png');
  } finally {
    await browser.close();
  }

  // Save report
  const reportPath = join(process.cwd(), 'claudedocs/coolify-backend-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${reportPath}`);

  return report;
}

// Run inspection
checkCoolifyBackend().then(report => {
  console.log('\n📊 INSPECTION SUMMARY:');
  console.log('─'.repeat(60));
  console.log(`Backend Status: ${report.backendStatus || 'Unknown'}`);
  console.log(`Container Status: ${report.containerStatus || 'Unknown'}`);
  console.log(`Deployment Status: ${report.deploymentStatus || 'Unknown'}`);
  console.log(`Healthcheck: ${report.healthcheck || 'Unknown'}`);
  console.log(`Errors Found: ${report.errors.length}`);
  console.log(`Screenshots: ${report.screenshots.length}`);
  console.log('─'.repeat(60));

  if (report.errors.length > 0) {
    console.log('\n❌ ERRORS DETECTED:');
    report.errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  process.exit(0);
}).catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});

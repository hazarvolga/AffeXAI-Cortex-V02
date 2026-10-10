import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const LOGIN_EMAIL = 'hazarvolga@gmail.com';
const LOGIN_PASSWORD = 'MERc90md?*1907!';
const DEPLOYMENT_URL = `${COOLIFY_URL}/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw`;
const SCREENSHOTS_DIR = path.join(__dirname, '../claudedocs/coolify-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page: any, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  return filepath;
}

async function checkDeployment() {
  console.log('🚀 Checking Coolify Deployment Status\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto(COOLIFY_URL);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    await page.waitForLoadState('networkidle');
    await sleep(2000);
    console.log('✅ Logged in\n');

    // Navigate to application
    console.log('🔍 Navigating to application...');
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');
    await sleep(2000);

    // Click on Deployments tab
    console.log('📋 Opening Deployments tab...');
    const deploymentsTab = page.locator('text="Deployments"').first();
    await deploymentsTab.click();
    await sleep(3000);
    await takeScreenshot(page, 'deployments-list');
    console.log('✅ Deployments tab opened\n');

    // Get all deployments
    console.log('📊 Analyzing deployments...\n');
    const pageContent = await page.content();

    // Look for deployment entries - try to find the latest one
    const deploymentRows = await page.locator('[class*="deployment"], [class*="card"]').all();
    console.log(`Found ${deploymentRows.length} deployment elements\n`);

    // Extract page text for analysis
    const bodyText = await page.textContent('body');

    // Look for key indicators
    const hasSuccess = bodyText?.toLowerCase().includes('success');
    const hasFailed = bodyText?.toLowerCase().includes('failed');
    const hasError = bodyText?.toLowerCase().includes('error');
    const hasRunning = bodyText?.toLowerCase().includes('running');
    const hasCommit = bodyText?.includes('d4f53bc');

    console.log('🔍 Status Indicators:');
    console.log(`   Commit d4f53bc found: ${hasCommit ? '✅' : '❌'}`);
    console.log(`   Success status: ${hasSuccess ? '✅' : '❌'}`);
    console.log(`   Failed status: ${hasFailed ? '⚠️' : '✅'}`);
    console.log(`   Error status: ${hasError ? '⚠️' : '✅'}`);
    console.log(`   Running status: ${hasRunning ? '🔄' : '❌'}`);
    console.log('');

    // Try to click on the first/latest deployment
    if (deploymentRows.length > 0) {
      console.log('📂 Opening latest deployment details...');
      await deploymentRows[0].click();
      await sleep(3000);
      await takeScreenshot(page, 'deployment-details');

      // Extract logs if visible
      const logsText = await page.textContent('body');

      // Save logs to file
      const logsPath = path.join(SCREENSHOTS_DIR, 'latest-deployment-logs.txt');
      fs.writeFileSync(logsPath, logsText || 'No logs found');
      console.log(`📄 Logs saved to: latest-deployment-logs.txt\n`);

      // Check for specific errors/success messages
      console.log('🔍 Log Analysis:');
      const logLower = logsText?.toLowerCase() || '';

      const checkpoints = [
        { name: 'Build started', found: logLower.includes('building') || logLower.includes('build') },
        { name: 'npm install', found: logLower.includes('npm install') },
        { name: 'TypeScript compile', found: logLower.includes('tsc') || logLower.includes('typescript') },
        { name: 'Next.js build', found: logLower.includes('next build') },
        { name: 'Bundle analyzer error', found: logLower.includes('@next/bundle-analyzer'), isError: true },
        { name: 'Static params error', found: logLower.includes('generatestaticparams') || logLower.includes('static params'), isError: true },
        { name: 'Build success', found: logLower.includes('successfully built') || logLower.includes('build completed') },
        { name: 'Container started', found: logLower.includes('container') && logLower.includes('start') },
        { name: 'Healthcheck', found: logLower.includes('healthcheck') || logLower.includes('health') },
        { name: 'Healthcheck failed', found: logLower.includes('healthcheck failed'), isError: true },
      ];

      checkpoints.forEach(check => {
        const icon = check.isError
          ? (check.found ? '❌' : '✅')
          : (check.found ? '✅' : '⏳');
        console.log(`   ${icon} ${check.name}`);
      });
    }

    console.log('\n🏁 Analysis complete. Keeping browser open for 30 seconds...');
    await sleep(30000);

  } catch (error) {
    console.error('❌ Error:', error);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

checkDeployment().catch(console.error);

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const LOGIN_EMAIL = 'hazarvolga@gmail.com';
const LOGIN_PASSWORD = 'MERc90md?*1907!';
const DEPLOYMENT_URL = `${COOLIFY_URL}/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw`;
const SCREENSHOTS_DIR = path.join(__dirname, '../claudedocs/coolify-screenshots');
const TARGET_COMMIT = 'd4f53bc';

interface DeploymentInfo {
  status: string;
  commitHash?: string;
  startTime?: string;
  duration?: string;
  logs: string[];
  errors: string[];
  containerStatus?: string;
  healthcheckStatus?: string;
}

// Create screenshots directory
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
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

async function extractLogs(page: any): Promise<string[]> {
  try {
    // Try to find log container or pre elements
    const logElements = await page.locator('pre, code, .log-container, .console').all();
    const logs: string[] = [];

    for (const element of logElements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        logs.push(text.trim());
      }
    }

    return logs;
  } catch (error) {
    console.log('Could not extract logs:', error);
    return [];
  }
}

async function monitorDeployment() {
  console.log('🚀 Starting Coolify Deployment Monitor');
  console.log(`📍 Target URL: ${DEPLOYMENT_URL}`);
  console.log(`🎯 Looking for commit: ${TARGET_COMMIT}`);
  console.log('');

  const browser = await chromium.launch({
    headless: false, // Show browser for monitoring
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in to Coolify...');
    await page.goto(COOLIFY_URL);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '01-login-page');

    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);
    await takeScreenshot(page, '02-credentials-filled');

    // Click login button
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    await page.waitForLoadState('networkidle');
    await sleep(2000);
    await takeScreenshot(page, '03-logged-in');
    console.log('✅ Logged in successfully');
    console.log('');

    // Step 2: Navigate to deployments
    console.log('🔍 Step 2: Navigating to deployments page...');
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');
    await sleep(2000);
    await takeScreenshot(page, '04-deployments-page');
    console.log('✅ Reached deployments page');
    console.log('');

    // Step 3: Find latest deployment
    console.log('🔍 Step 3: Finding latest deployment...');
    await sleep(2000);

    // Try to find deployment with target commit
    const deploymentInfo: DeploymentInfo = {
      status: 'Unknown',
      logs: [],
      errors: []
    };

    // Look for deployment elements - try multiple selectors
    const possibleSelectors = [
      `text=${TARGET_COMMIT}`,
      `[data-commit="${TARGET_COMMIT}"]`,
      `.deployment:has-text("${TARGET_COMMIT}")`,
      '.deployment-item',
      '[class*="deployment"]'
    ];

    let foundDeployment = false;
    for (const selector of possibleSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} deployment(s) with selector: ${selector}`);
          foundDeployment = true;

          // Click first deployment to see details
          await elements[0].click();
          await sleep(2000);
          await takeScreenshot(page, '05-deployment-details');
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!foundDeployment) {
      console.log('⚠️  Could not find specific deployment, checking page content...');
      await takeScreenshot(page, '05-deployments-overview');

      // Extract any visible text that might contain deployment info
      const pageText = await page.textContent('body');
      if (pageText?.includes(TARGET_COMMIT)) {
        console.log(`✅ Found commit ${TARGET_COMMIT} in page content`);
        deploymentInfo.commitHash = TARGET_COMMIT;
      }
    }

    // Step 4: Monitor deployment status
    console.log('📊 Step 4: Monitoring deployment status...');
    console.log('');

    // Check for status indicators
    const statusKeywords = [
      'success', 'failed', 'running', 'in progress', 'queued',
      'building', 'deploying', 'completed', 'error'
    ];

    let monitoringRounds = 0;
    const maxRounds = 10; // Monitor for up to 5 minutes (30s intervals)

    while (monitoringRounds < maxRounds) {
      monitoringRounds++;
      console.log(`📡 Monitoring Round ${monitoringRounds}/${maxRounds}`);

      await page.reload();
      await page.waitForLoadState('networkidle');
      await sleep(2000);

      const currentPageText = (await page.textContent('body'))?.toLowerCase() || '';

      // Check for status
      for (const keyword of statusKeywords) {
        if (currentPageText.includes(keyword)) {
          deploymentInfo.status = keyword;
          console.log(`   Status: ${keyword}`);
        }
      }

      // Take periodic screenshot
      await takeScreenshot(page, `06-monitoring-round-${monitoringRounds}`);

      // Extract logs
      const currentLogs = await extractLogs(page);
      if (currentLogs.length > 0) {
        deploymentInfo.logs = currentLogs;
        console.log(`   Extracted ${currentLogs.length} log entries`);

        // Check for key checkpoints
        const logsText = currentLogs.join('\n').toLowerCase();

        const checkpoints = {
          'npm install': logsText.includes('npm install'),
          'typescript compile': logsText.includes('tsc') || logsText.includes('typescript'),
          'next.js build': logsText.includes('next build'),
          'bundle analyzer error': logsText.includes('@next/bundle-analyzer'),
          'static params error': logsText.includes('generatestaticparams') || logsText.includes('static params'),
          'docker image': logsText.includes('docker') && logsText.includes('image'),
          'healthcheck': logsText.includes('healthcheck') || logsText.includes('/api/health'),
        };

        console.log('   Checkpoints:');
        for (const [checkpoint, passed] of Object.entries(checkpoints)) {
          console.log(`     ${passed ? '✅' : '⏳'} ${checkpoint}`);
        }

        // Detect errors
        const errorKeywords = ['error:', 'failed:', 'exception:', 'cannot find module', 'econnrefused'];
        for (const keyword of errorKeywords) {
          if (logsText.includes(keyword)) {
            // Extract error context
            const lines = logsText.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(keyword)) {
                const errorContext = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n');
                deploymentInfo.errors.push(errorContext);
              }
            }
          }
        }

        if (deploymentInfo.errors.length > 0) {
          console.log(`   ⚠️  Found ${deploymentInfo.errors.length} error(s)`);
        }
      }

      // Check if deployment is finished (success or failure)
      if (deploymentInfo.status.includes('success') ||
          deploymentInfo.status.includes('failed') ||
          deploymentInfo.status.includes('completed')) {
        console.log(`   ✅ Deployment finished with status: ${deploymentInfo.status}`);
        break;
      }

      if (monitoringRounds < maxRounds) {
        console.log('   ⏳ Waiting 30 seconds before next check...');
        console.log('');
        await sleep(30000);
      }
    }

    // Step 5: Final status report
    console.log('');
    console.log('📋 ============================================');
    console.log('📋 DEPLOYMENT MONITORING REPORT');
    console.log('📋 ============================================');
    console.log('');
    console.log(`🎯 Target Commit: ${TARGET_COMMIT}`);
    console.log(`📊 Final Status: ${deploymentInfo.status}`);
    console.log(`🕐 Monitoring Rounds: ${monitoringRounds}`);
    console.log(`📝 Log Entries: ${deploymentInfo.logs.length}`);
    console.log(`❌ Errors Found: ${deploymentInfo.errors.length}`);
    console.log('');

    if (deploymentInfo.errors.length > 0) {
      console.log('🚨 ERRORS DETECTED:');
      console.log('==================');
      deploymentInfo.errors.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log(error);
        console.log('---');
      });
    }

    // Take final screenshot
    await takeScreenshot(page, '07-final-status');

    // Check for specific fixes verification
    console.log('');
    console.log('🔧 FIX VERIFICATION:');
    console.log('==================');
    const allLogsText = deploymentInfo.logs.join('\n').toLowerCase();

    console.log(`1️⃣ Bundle Analyzer Fix: ${allLogsText.includes('@next/bundle-analyzer') ? '❌ STILL FAILING' : '✅ WORKING'}`);
    console.log(`2️⃣ Static Params Fix: ${allLogsText.includes('generatestaticparams') || allLogsText.includes('static params') ? '❌ STILL FAILING' : '✅ WORKING'}`);
    console.log(`3️⃣ Health Endpoint Fix: ${allLogsText.includes('healthcheck') && !allLogsText.includes('healthcheck failed') ? '✅ WORKING' : '⏳ PENDING'}`);
    console.log('');

    // Save report to file
    const reportPath = path.join(SCREENSHOTS_DIR, 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Error during monitoring:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    console.log('');
    console.log('🏁 Monitoring complete. Browser will close in 10 seconds...');
    await sleep(10000);
    await browser.close();
  }
}

// Run monitoring
monitorDeployment().catch(console.error);

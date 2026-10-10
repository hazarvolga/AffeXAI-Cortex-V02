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

async function checkLatestDeployment() {
  console.log('🚀 Checking Latest Deployment Logs\n');

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
    console.log('✅ Deployments tab opened\n');

    // Check for commit d4f53bc
    const bodyText = await page.textContent('body');
    const hasTargetCommit = bodyText?.includes('d4f53bc');

    console.log(`🎯 Looking for commit d4f53bc: ${hasTargetCommit ? '✅ FOUND' : '❌ NOT FOUND YET'}\n`);

    if (!hasTargetCommit) {
      console.log('⚠️  The latest commit (d4f53bc) has not triggered a deployment yet.');
      console.log('    This could mean:');
      console.log('    1. Git push did not reach the remote repository');
      console.log('    2. Coolify webhook not triggered');
      console.log('    3. Coolify is processing the deployment queue\n');

      console.log('📊 Checking the most recent deployment (commit 8e27a34)...\n');
    }

    // Click on the first (latest) deployment
    console.log('📂 Opening latest deployment...');
    const firstDeployment = page.locator('text="Failed"').first();
    await firstDeployment.click();
    await sleep(3000);
    await takeScreenshot(page, 'latest-deployment-overview');

    // Try to find and click "Logs" tab or expand logs
    console.log('📄 Looking for logs...');

    // Try multiple ways to get to logs
    const possibleLogTriggers = [
      'text="Logs"',
      'text="Build Logs"',
      'text="View Logs"',
      'button:has-text("Logs")',
      '[class*="log"]'
    ];

    for (const trigger of possibleLogTriggers) {
      try {
        const element = page.locator(trigger).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await sleep(2000);
          console.log(`   ✅ Clicked: ${trigger}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await sleep(2000);
    await takeScreenshot(page, 'deployment-logs-view');

    // Extract all text content
    const fullText = await page.textContent('body');

    // Save to file
    const logsPath = path.join(SCREENSHOTS_DIR, 'latest-deployment-full-logs.txt');
    fs.writeFileSync(logsPath, fullText || 'No content found');
    console.log(`📄 Full page content saved to: latest-deployment-full-logs.txt\n`);

    // Analyze logs
    console.log('🔍 LOG ANALYSIS\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const logLower = fullText?.toLowerCase() || '';

    // Extract commit info
    const commitMatch = fullText?.match(/commit[:\s]+([a-f0-9]{7,})/i);
    if (commitMatch) {
      console.log(`📌 Commit: ${commitMatch[1]}`);
    }

    // Extract timing
    const startMatch = fullText?.match(/started[:\s]+([\d-]+\s[\d:]+\s[A-Z]+)/i);
    const endMatch = fullText?.match(/ended[:\s]+([\d-]+\s[\d:]+\s[A-Z]+)/i);
    const durationMatch = fullText?.match(/duration[:\s]+([\d]+m\s[\d]+s)/i);

    if (startMatch) console.log(`⏰ Started: ${startMatch[1]}`);
    if (endMatch) console.log(`⏱️  Ended: ${endMatch[1]}`);
    if (durationMatch) console.log(`⏳ Duration: ${durationMatch[1]}`);
    console.log('');

    // Build checkpoints
    console.log('📊 BUILD CHECKPOINTS:\n');

    const checkpoints = [
      { name: 'Build started', pattern: /build.*start|starting.*build/i },
      { name: 'npm install completed', pattern: /npm install|added.*packages/i },
      { name: 'TypeScript compilation', pattern: /tsc|typescript.*compil/i },
      { name: 'Next.js build started', pattern: /next build/i },
      { name: 'Creating optimized production build', pattern: /creating.*optimized.*production/i },
      { name: 'Compiling pages', pattern: /compiling.*pages?/i },
      { name: 'Build completed successfully', pattern: /build.*success|successfully.*built/i },
      { name: 'Docker image created', pattern: /docker.*image|building.*image/i },
      { name: 'Container started', pattern: /container.*start|starting.*container/i },
      { name: 'Application ready', pattern: /ready|listening.*on.*port/i },
    ];

    checkpoints.forEach(check => {
      const found = check.pattern.test(fullText || '');
      console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
    });

    console.log('');

    // Error detection
    console.log('🚨 ERROR DETECTION:\n');

    const errorPatterns = [
      { name: 'Bundle Analyzer Error', pattern: /@next\/bundle-analyzer|cannot find module.*bundle-analyzer/i },
      { name: 'Static Params Error', pattern: /generatestaticparams|error.*generating.*static.*params/i },
      { name: 'API Connection Error', pattern: /econnrefused|connect.*econnrefused|connection.*refused/i },
      { name: 'Healthcheck Failed', pattern: /healthcheck.*failed|health.*check.*error/i },
      { name: 'Module Not Found', pattern: /cannot find module|module not found/i },
      { name: 'Build Error', pattern: /error:.*build|build.*failed|failed.*build/i },
      { name: 'Docker Error', pattern: /docker.*error|error.*docker/i },
    ];

    let errorsFound = 0;
    errorPatterns.forEach(check => {
      const found = check.pattern.test(fullText || '');
      if (found) {
        console.log(`   ❌ ${check.name} - DETECTED`);
        errorsFound++;

        // Try to extract error context
        const lines = fullText?.split('\n') || [];
        const errorLines = lines.filter(line => check.pattern.test(line));
        if (errorLines.length > 0) {
          console.log(`      "${errorLines[0].trim().substring(0, 100)}..."`);
        }
      } else {
        console.log(`   ✅ ${check.name} - Not found`);
      }
    });

    console.log('');
    console.log(`📊 Total errors detected: ${errorsFound}`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 SUMMARY:\n');

    if (!hasTargetCommit) {
      console.log('⚠️  DEPLOYMENT STATUS: Waiting for d4f53bc deployment');
      console.log('');
      console.log('RECOMMENDATION:');
      console.log('1. Verify git push succeeded: git log --oneline -5');
      console.log('2. Check Coolify webhook is configured');
      console.log('3. Manually trigger deployment from Coolify UI if needed');
      console.log('4. Re-run this script in 2-3 minutes');
    } else {
      console.log('✅ Target commit d4f53bc deployment found!');

      if (errorsFound === 0) {
        console.log('✅ No errors detected - deployment should be successful!');
      } else {
        console.log(`⚠️  ${errorsFound} error(s) detected - deployment failed`);
        console.log('');
        console.log('NEXT STEPS:');
        console.log('1. Review error details in latest-deployment-full-logs.txt');
        console.log('2. Fix identified issues');
        console.log('3. Commit and push fixes');
        console.log('4. Monitor next deployment');
      }
    }

    console.log('\n🏁 Analysis complete. Browser will stay open for 30 seconds...');
    await sleep(30000);

  } catch (error) {
    console.error('❌ Error:', error);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

checkLatestDeployment().catch(console.error);

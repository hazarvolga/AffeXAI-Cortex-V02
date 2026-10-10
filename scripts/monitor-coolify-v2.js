const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';
const APP_URL = 'https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw';
const TARGET_COMMIT = '8ee7a34';

// Create screenshots directory
const screenshotsDir = path.join(__dirname, '..', 'deployment-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().split('T')[1].split('.')[0];
}

async function monitorDeployment() {
  const browser = await chromium.launch({
    headless: false, // Use headed mode to see what's happening
    slowMo: 100
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  const report = {
    timestamp: new Date().toISOString(),
    targetCommit: TARGET_COMMIT,
    deploymentStatus: null,
    buildDuration: null,
    errors: [],
    successIndicators: [],
    containerStatus: null,
    screenshots: [],
    buildLogs: []
  };

  try {
    console.log(`[${timestamp()}] 🔐 Logging in to Coolify...`);
    await page.goto(COOLIFY_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take login page screenshot
    const loginScreenshot = path.join(screenshotsDir, '01-login-page.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    report.screenshots.push(loginScreenshot);

    // Try to find and fill email input
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(EMAIL);

    // Try to find and fill password input
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill(PASSWORD);

    await page.waitForTimeout(500);

    // Find and click login button
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await loginButton.click();

    console.log(`[${timestamp()}] ⏳ Waiting for login to complete...`);
    await page.waitForURL(/coolify\.aluplan\.tr\/(?!login)/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log(`[${timestamp()}] ✅ Logged in successfully`);

    // Navigate to application page
    console.log(`[${timestamp()}] 📂 Navigating to application page...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take application page screenshot
    const appScreenshot = path.join(screenshotsDir, '02-application-page.png');
    await page.screenshot({ path: appScreenshot, fullPage: true });
    report.screenshots.push(appScreenshot);

    // Look for "Deployments" tab/link
    console.log(`[${timestamp()}] 🔍 Looking for Deployments section...`);

    // Try to find deployments tab or section
    const deploymentsSectionSelectors = [
      'a:has-text("Deployments")',
      'button:has-text("Deployments")',
      '[href*="deployments"]',
      'text=Deployments'
    ];

    let deploymentsFound = false;
    for (const selector of deploymentsSectionSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`[${timestamp()}] ✅ Found deployments section: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);
          deploymentsFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Take screenshot after clicking deployments
    const deploymentsScreenshot = path.join(screenshotsDir, '03-deployments-list.png');
    await page.screenshot({ path: deploymentsScreenshot, fullPage: true });
    report.screenshots.push(deploymentsScreenshot);

    // Extract page text to find deployment information
    console.log(`[${timestamp()}] 📋 Extracting deployment information...`);
    const pageText = await page.textContent('body');

    // Look for deployment status indicators
    const statusPatterns = [
      /In Progress/i,
      /Queued/i,
      /Success/i,
      /Failed/i,
      /Running/i,
      /Deploying/i,
      /Building/i
    ];

    for (const pattern of statusPatterns) {
      if (pattern.test(pageText)) {
        const match = pageText.match(pattern);
        report.deploymentStatus = match[0];
        console.log(`[${timestamp()}] 📊 Deployment status: ${match[0]}`);
        break;
      }
    }

    // Look for commit SHA
    if (pageText.includes(TARGET_COMMIT)) {
      report.successIndicators.push(`✅ Target commit ${TARGET_COMMIT} found in deployments`);
      console.log(`[${timestamp()}] ✅ Target commit ${TARGET_COMMIT} found`);
    }

    // Try to find and click on the latest deployment
    console.log(`[${timestamp()}] 🖱️  Looking for deployment details...`);

    const deploymentLinkSelectors = [
      `a:has-text("${TARGET_COMMIT}")`,
      'a[href*="/deployment/"]',
      '.deployment-item a',
      '[data-deployment-id]'
    ];

    let clickedDeployment = false;
    for (const selector of deploymentLinkSelectors) {
      try {
        const link = await page.locator(selector).first();
        if (await link.isVisible({ timeout: 2000 })) {
          console.log(`[${timestamp()}] 🔗 Clicking deployment link: ${selector}`);
          await link.click();
          await page.waitForTimeout(3000);
          clickedDeployment = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (clickedDeployment) {
      // Take deployment detail screenshot
      const detailScreenshot = path.join(screenshotsDir, '04-deployment-detail.png');
      await page.screenshot({ path: detailScreenshot, fullPage: true });
      report.screenshots.push(detailScreenshot);

      // Look for build logs
      console.log(`[${timestamp()}] 📜 Searching for build logs...`);

      const logSelectors = [
        'pre',
        'code',
        '.logs',
        '[class*="log"]',
        '[data-logs]'
      ];

      for (const selector of logSelectors) {
        try {
          const logElements = await page.locator(selector).all();
          if (logElements.length > 0) {
            console.log(`[${timestamp()}] 📋 Found ${logElements.length} log elements`);

            for (let i = 0; i < Math.min(logElements.length, 5); i++) {
              const logText = await logElements[i].textContent();
              if (logText && logText.trim().length > 50) {
                report.buildLogs.push(logText.substring(0, 1000)); // First 1000 chars

                // Check for success indicators
                if (logText.includes('npm run build')) {
                  report.successIndicators.push('✅ npm run build found in logs');
                }
                if (logText.includes('Collecting page data')) {
                  report.successIndicators.push('✅ Collecting page data step found');
                }
                if (logText.includes('Generating static pages')) {
                  report.successIndicators.push('✅ Generating static pages found');
                }
                if (logText.includes('successfully') && logText.toLowerCase().includes('docker')) {
                  report.successIndicators.push('✅ Docker build successful');
                }
                if (logText.toLowerCase().includes('container') && logText.toLowerCase().includes('start')) {
                  report.successIndicators.push('✅ Container started');
                }

                // Check for errors
                if (logText.includes('@next/bundle-analyzer')) {
                  report.errors.push('❌ @next/bundle-analyzer error found');
                }
                if (logText.includes('no available server')) {
                  report.errors.push('❌ "no available server" API error found');
                }
                if (logText.toLowerCase().includes('error:') && !logText.includes('0 errors')) {
                  const errorLine = logText.split('\n').find(line =>
                    line.toLowerCase().includes('error:')
                  );
                  if (errorLine) {
                    report.errors.push(`❌ ${errorLine.substring(0, 150)}`);
                  }
                }
              }
            }
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
    }

    // Look for container status
    console.log(`[${timestamp()}] 🐳 Checking container status...`);
    const containerStatusPatterns = [
      /container.*running/i,
      /container.*stopped/i,
      /container.*exited/i,
      /healthy/i,
      /unhealthy/i
    ];

    const fullPageText = await page.textContent('body');
    for (const pattern of containerStatusPatterns) {
      if (pattern.test(fullPageText)) {
        const match = fullPageText.match(pattern);
        report.containerStatus = match[0];
        console.log(`[${timestamp()}] 🐳 Container status: ${match[0]}`);
        if (match[0].toLowerCase().includes('running') || match[0].toLowerCase().includes('healthy')) {
          report.successIndicators.push('✅ Container is running/healthy');
        }
        break;
      }
    }

    // Take final screenshot
    const finalScreenshot = path.join(screenshotsDir, '05-final-status.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    report.screenshots.push(finalScreenshot);

    console.log(`[${timestamp()}] ✅ Monitoring completed`);

  } catch (error) {
    console.error(`[${timestamp()}] ❌ Error during monitoring:`, error.message);
    report.errors.push(`Script error: ${error.message}`);

    // Take error screenshot
    const errorScreenshot = path.join(screenshotsDir, 'error-screenshot.png');
    try {
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      report.screenshots.push(errorScreenshot);
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    // Keep browser open for manual inspection
    console.log(`[${timestamp()}] 🔍 Keeping browser open for 10 seconds for manual inspection...`);
    await page.waitForTimeout(10000);
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COOLIFY DEPLOYMENT MONITORING REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Target Commit: ${report.targetCommit}`);
  console.log(`Deployment Status: ${report.deploymentStatus || 'Not found'}`);
  console.log(`Container Status: ${report.containerStatus || 'Not found'}`);

  console.log('\n✅ Success Indicators:');
  if (report.successIndicators.length > 0) {
    report.successIndicators.forEach(indicator => console.log(`  ${indicator}`));
  } else {
    console.log('  None found');
  }

  console.log('\n❌ Errors Found:');
  if (report.errors.length > 0) {
    report.errors.forEach(error => console.log(`  ${error}`));
  } else {
    console.log('  ✅ No errors found!');
  }

  if (report.buildLogs.length > 0) {
    console.log('\n📜 Build Logs Preview:');
    report.buildLogs.forEach((log, i) => {
      console.log(`\n--- Log ${i + 1} (first 500 chars) ---`);
      console.log(log.substring(0, 500));
    });
  }

  console.log('\n📸 Screenshots:');
  report.screenshots.forEach(screenshot => console.log(`  ${screenshot}`));

  console.log('\n' + '='.repeat(80));

  // Save report as JSON
  const reportPath = path.join(screenshotsDir, 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Determine overall success
  const hasErrors = report.errors.length > 0;
  const hasSuccessIndicators = report.successIndicators.length >= 3;
  const deploymentSuccess = report.deploymentStatus &&
    (report.deploymentStatus.toLowerCase().includes('success') ||
     report.deploymentStatus.toLowerCase().includes('running'));

  console.log('\n🎯 VERDICT:');
  if (!hasErrors && hasSuccessIndicators && deploymentSuccess) {
    console.log('✅ ✅ ✅ DEPLOYMENT APPEARS SUCCESSFUL! ✅ ✅ ✅');
    console.log('The fix for "no available server" error appears to be working!');
  } else if (hasErrors) {
    console.log('❌ DEPLOYMENT HAS ERRORS - Investigation needed');
  } else {
    console.log('⚠️  DEPLOYMENT STATUS UNCLEAR - Manual verification recommended');
  }

  return report;
}

monitorDeployment().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

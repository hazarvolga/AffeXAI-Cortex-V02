const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';
const DEPLOYMENT_URL = 'https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw';
const TARGET_COMMIT = '8ee7a34';

// Create screenshots directory
const screenshotsDir = path.join(__dirname, '..', 'deployment-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function monitorDeployment() {
  const browser = await chromium.launch({ headless: true });
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
    screenshots: []
  };

  try {
    console.log('🔐 Logging in to Coolify...');
    await page.goto(COOLIFY_URL);
    await page.waitForLoadState('networkidle');

    // Take login page screenshot
    const loginScreenshot = path.join(screenshotsDir, '01-login-page.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    report.screenshots.push(loginScreenshot);

    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);

    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Logged in successfully');

    // Navigate to deployments page
    console.log('📂 Navigating to application deployments...');
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take deployments list screenshot
    const deploymentsScreenshot = path.join(screenshotsDir, '02-deployments-list.png');
    await page.screenshot({ path: deploymentsScreenshot, fullPage: true });
    report.screenshots.push(deploymentsScreenshot);

    // Look for deployments (try multiple selectors)
    console.log('🔍 Checking for latest deployment...');

    // Try to find deployment items
    const deploymentSelectors = [
      '[data-testid="deployment-item"]',
      '.deployment-item',
      '[class*="deployment"]',
      'a[href*="/deployment/"]'
    ];

    let deploymentLinks = [];
    for (const selector of deploymentSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} deployments with selector: ${selector}`);
        deploymentLinks = elements;
        break;
      }
    }

    if (deploymentLinks.length === 0) {
      console.log('⚠️  No deployment elements found, checking page content...');
      const pageContent = await page.content();

      // Save page HTML for debugging
      const htmlPath = path.join(screenshotsDir, 'deployments-page.html');
      fs.writeFileSync(htmlPath, pageContent);
      console.log(`Saved page HTML to: ${htmlPath}`);

      // Check if we're on the right page
      const pageTitle = await page.title();
      console.log(`Page title: ${pageTitle}`);

      // Look for any text indicating deployments
      const bodyText = await page.textContent('body');
      if (bodyText.includes('deployment') || bodyText.includes('build')) {
        console.log('✅ Page contains deployment-related text');
      }
    }

    // Click on the first deployment to see details
    if (deploymentLinks.length > 0) {
      console.log('🖱️  Clicking on latest deployment...');
      await deploymentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take deployment detail screenshot
      const detailScreenshot = path.join(screenshotsDir, '03-deployment-detail.png');
      await page.screenshot({ path: detailScreenshot, fullPage: true });
      report.screenshots.push(detailScreenshot);
    }

    // Try to find deployment status
    const statusSelectors = [
      '[data-testid="deployment-status"]',
      '.deployment-status',
      '[class*="status"]',
      'text=/In Progress|Queued|Success|Failed|Running/'
    ];

    let statusText = 'Unknown';
    for (const selector of statusSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          statusText = await element.textContent();
          console.log(`Found status: ${statusText}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    report.deploymentStatus = statusText;

    // Look for build logs
    console.log('📋 Checking for build logs...');
    const logSelectors = [
      '[data-testid="build-logs"]',
      '.build-logs',
      'pre',
      'code',
      '[class*="log"]'
    ];

    let logsFound = false;
    for (const selector of logSelectors) {
      const logElements = await page.$$(selector);
      if (logElements.length > 0) {
        console.log(`Found ${logElements.length} log elements with selector: ${selector}`);

        // Get log content
        for (let i = 0; i < Math.min(logElements.length, 3); i++) {
          const logText = await logElements[i].textContent();

          // Check for success indicators
          if (logText.includes('npm run build')) {
            report.successIndicators.push('✅ npm run build command found');
          }
          if (logText.includes('Collecting page data')) {
            report.successIndicators.push('✅ Collecting page data step found');
          }
          if (logText.includes('Generating static pages')) {
            report.successIndicators.push('✅ Generating static pages found');
          }
          if (logText.includes('Docker') && logText.includes('successfully')) {
            report.successIndicators.push('✅ Docker image built successfully');
          }
          if (logText.includes('Container') && logText.includes('started')) {
            report.successIndicators.push('✅ Container started');
          }
          if (logText.includes('healthy')) {
            report.successIndicators.push('✅ Healthcheck passing');
          }

          // Check for errors
          if (logText.includes('@next/bundle-analyzer')) {
            report.errors.push('❌ @next/bundle-analyzer error found');
          }
          if (logText.includes('no available server')) {
            report.errors.push('❌ "no available server" error found');
          }
          if (logText.toLowerCase().includes('error') && !logText.includes('0 errors')) {
            report.errors.push(`❌ Error found in logs: ${logText.substring(0, 200)}`);
          }
        }

        logsFound = true;
        break;
      }
    }

    if (!logsFound) {
      console.log('⚠️  No build logs found on this page');
    }

    // Take final screenshot
    const finalScreenshot = path.join(screenshotsDir, '04-final-status.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    report.screenshots.push(finalScreenshot);

    // Check container status (if available)
    const containerStatusSelectors = [
      'text=/running|exited|stopped/i',
      '[data-testid="container-status"]'
    ];

    for (const selector of containerStatusSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const containerText = await element.textContent();
          report.containerStatus = containerText;
          console.log(`Container status: ${containerText}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

  } catch (error) {
    console.error('❌ Error during monitoring:', error.message);
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
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 DEPLOYMENT MONITORING REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Target Commit: ${report.targetCommit}`);
  console.log(`Deployment Status: ${report.deploymentStatus}`);
  console.log(`Container Status: ${report.containerStatus || 'Not found'}`);
  console.log(`Build Duration: ${report.buildDuration || 'Not available'}`);

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
    console.log('  None found ✅');
  }

  console.log('\n📸 Screenshots:');
  report.screenshots.forEach(screenshot => console.log(`  ${screenshot}`));

  console.log('\n' + '='.repeat(80));

  // Save report as JSON
  const reportPath = path.join(screenshotsDir, 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Exit with error code if deployment failed
  if (report.errors.length > 0 || report.deploymentStatus.toLowerCase().includes('fail')) {
    process.exit(1);
  }
}

monitorDeployment().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

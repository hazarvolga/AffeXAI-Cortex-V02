const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOLIFY_URL = 'https://coolify.aluplan.tr';
const EMAIL = 'hazarvolga@gmail.com';
const PASSWORD = 'MERc90md?*1907!';
const APP_URL = 'https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw';
const TARGET_COMMIT = '8ee7a34';

const screenshotsDir = path.join(__dirname, '..', 'deployment-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function timestamp() {
  return new Date().toISOString().split('T')[1].split('.')[0];
}

async function monitorLogs() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  const report = {
    timestamp: new Date().toISOString(),
    deploymentStatus: null,
    buildLogs: [],
    errors: [],
    successIndicators: [],
    screenshots: []
  };

  try {
    console.log(`[${timestamp()}] 🔐 Logging in...`);
    await page.goto(COOLIFY_URL);
    await page.waitForTimeout(2000);

    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(EMAIL);
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/coolify\.aluplan\.tr\/(?!login)/);
    await page.waitForTimeout(2000);

    console.log(`[${timestamp()}] ✅ Logged in`);

    // Navigate to app
    console.log(`[${timestamp()}] 📂 Opening application...`);
    await page.goto(APP_URL);
    await page.waitForTimeout(3000);

    // Click Deployments
    await page.locator('a:has-text("Deployments")').first().click();
    await page.waitForTimeout(2000);

    // Click on target commit
    console.log(`[${timestamp()}] 🔍 Opening deployment ${TARGET_COMMIT}...`);
    await page.locator(`a:has-text("${TARGET_COMMIT}")`).first().click();
    await page.waitForTimeout(3000);

    // Take screenshot
    const initialScreenshot = path.join(screenshotsDir, 'logs-01-initial.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    report.screenshots.push(initialScreenshot);

    console.log(`[${timestamp()}] 📜 Monitoring logs for 60 seconds...`);

    // Monitor logs for 60 seconds
    const endTime = Date.now() + 60000;
    let iteration = 0;

    while (Date.now() < endTime) {
      iteration++;

      // Get all pre/code elements that might contain logs
      const logElements = await page.locator('pre, code, [class*="log"]').all();

      if (logElements.length > 0) {
        let allLogs = [];

        for (const element of logElements) {
          const text = await element.textContent();
          if (text && text.trim().length > 100) {
            allLogs.push(text);
          }
        }

        if (allLogs.length > 0) {
          const combinedLogs = allLogs.join('\n\n');

          // Check for key indicators
          if (combinedLogs.includes('npm run build')) {
            if (!report.successIndicators.includes('✅ npm run build')) {
              report.successIndicators.push('✅ npm run build');
              console.log(`[${timestamp()}] ✅ npm run build found`);
            }
          }

          if (combinedLogs.includes('Collecting page data')) {
            if (!report.successIndicators.includes('✅ Collecting page data')) {
              report.successIndicators.push('✅ Collecting page data');
              console.log(`[${timestamp()}] ✅ Collecting page data found`);
            }
          }

          if (combinedLogs.includes('Generating static pages')) {
            if (!report.successIndicators.includes('✅ Generating static pages')) {
              report.successIndicators.push('✅ Generating static pages');
              console.log(`[${timestamp()}] ✅ Generating static pages found`);
            }
          }

          if (combinedLogs.match(/Created.*docker.*image/i)) {
            if (!report.successIndicators.includes('✅ Docker image created')) {
              report.successIndicators.push('✅ Docker image created');
              console.log(`[${timestamp()}] ✅ Docker image created`);
            }
          }

          if (combinedLogs.match(/Container.*started/i)) {
            if (!report.successIndicators.includes('✅ Container started')) {
              report.successIndicators.push('✅ Container started');
              console.log(`[${timestamp()}] ✅ Container started`);
            }
          }

          if (combinedLogs.match(/deployment.*successful|successfully.*deployed/i)) {
            if (!report.successIndicators.includes('✅ Deployment successful')) {
              report.successIndicators.push('✅ Deployment successful');
              console.log(`[${timestamp()}] ✅ Deployment successful!`);
            }
          }

          // Check for errors
          if (combinedLogs.includes('@next/bundle-analyzer')) {
            if (!report.errors.includes('❌ @next/bundle-analyzer error')) {
              report.errors.push('❌ @next/bundle-analyzer error');
              console.log(`[${timestamp()}] ❌ @next/bundle-analyzer error found`);
            }
          }

          if (combinedLogs.includes('no available server')) {
            if (!report.errors.includes('❌ no available server error')) {
              report.errors.push('❌ no available server error');
              console.log(`[${timestamp()}] ❌ no available server error found`);
            }
          }

          if (combinedLogs.match(/Error:/i) && !combinedLogs.includes('0 errors')) {
            const errorLines = combinedLogs.split('\n').filter(line =>
              line.toLowerCase().includes('error:') && !line.includes('0 errors')
            );
            errorLines.forEach(line => {
              const shortError = line.substring(0, 100);
              if (!report.errors.includes(shortError)) {
                report.errors.push(`❌ ${shortError}`);
                console.log(`[${timestamp()}] ❌ Error: ${shortError}`);
              }
            });
          }

          // Save logs every 10 iterations
          if (iteration % 10 === 0) {
            report.buildLogs = [combinedLogs];
            const logsPath = path.join(screenshotsDir, 'build-logs.txt');
            fs.writeFileSync(logsPath, combinedLogs);
            console.log(`[${timestamp()}] 💾 Logs saved to ${logsPath}`);
          }
        }
      }

      // Check deployment status
      const pageText = await page.textContent('body');
      if (pageText.match(/status.*success/i) || pageText.match(/deployment.*completed/i)) {
        report.deploymentStatus = 'Success';
        console.log(`[${timestamp()}] ✅ Deployment status: Success`);
        break;
      } else if (pageText.match(/status.*failed/i)) {
        report.deploymentStatus = 'Failed';
        console.log(`[${timestamp()}] ❌ Deployment status: Failed`);
        break;
      } else if (pageText.match(/status.*in progress/i)) {
        report.deploymentStatus = 'In Progress';
      }

      // Take screenshot every 15 seconds
      if (iteration % 3 === 0) {
        const screenshotPath = path.join(screenshotsDir, `logs-${String(iteration).padStart(2, '0')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        report.screenshots.push(screenshotPath);
        console.log(`[${timestamp()}] 📸 Screenshot taken: ${screenshotPath}`);
      }

      await page.waitForTimeout(5000); // Check every 5 seconds
    }

    // Final screenshot
    const finalScreenshot = path.join(screenshotsDir, 'logs-final.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    report.screenshots.push(finalScreenshot);

  } catch (error) {
    console.error(`[${timestamp()}] ❌ Error:`, error.message);
    report.errors.push(`Script error: ${error.message}`);
  } finally {
    console.log(`[${timestamp()}] 🔍 Keeping browser open for 5 seconds...`);
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 DEPLOYMENT LOGS MONITORING REPORT');
  console.log('='.repeat(80));
  console.log(`Deployment Status: ${report.deploymentStatus || 'Unknown'}`);

  console.log('\n✅ Success Indicators:');
  if (report.successIndicators.length > 0) {
    report.successIndicators.forEach(indicator => console.log(`  ${indicator}`));
  } else {
    console.log('  None detected');
  }

  console.log('\n❌ Errors:');
  if (report.errors.length > 0) {
    report.errors.forEach(error => console.log(`  ${error}`));
  } else {
    console.log('  ✅ No errors detected!');
  }

  console.log('\n📸 Screenshots:', report.screenshots.length);
  console.log('='.repeat(80));

  // Save report
  const reportPath = path.join(screenshotsDir, 'logs-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);

  // Verdict
  console.log('\n🎯 VERDICT:');
  if (report.deploymentStatus === 'Success' && report.errors.length === 0) {
    console.log('✅ ✅ ✅ DEPLOYMENT SUCCESSFUL! ✅ ✅ ✅');
    console.log('The "no available server" fix is working correctly!');
  } else if (report.errors.length > 0) {
    console.log('❌ DEPLOYMENT HAS ERRORS');
  } else if (report.deploymentStatus === 'In Progress') {
    console.log('⏳ DEPLOYMENT STILL IN PROGRESS - Check again later');
  } else {
    console.log('⚠️  UNCLEAR - Manual verification needed');
  }
}

monitorLogs().catch(console.error);

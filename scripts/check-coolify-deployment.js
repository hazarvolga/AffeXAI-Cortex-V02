const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('🚀 Navigating to Coolify deployment page...');

    // Navigate to the deployment page
    await page.goto('https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw/deployment/tcg440s8sswcc0gwk8k00c4c', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✅ Page loaded');

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(3000);

    // Take screenshot
    const screenshotPath = path.join(__dirname, '../claudedocs/coolify-deployment-screenshot.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    // Extract deployment status
    console.log('\n🔍 Extracting deployment information...\n');

    // Try to find deployment status
    const statusSelectors = [
      '[data-testid="deployment-status"]',
      '.deployment-status',
      '[class*="status"]',
      'h1', 'h2', 'h3'
    ];

    let deploymentStatus = 'Unknown';
    for (const selector of statusSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const text = await element.textContent();
          if (text && (text.toLowerCase().includes('success') ||
                       text.toLowerCase().includes('failed') ||
                       text.toLowerCase().includes('progress') ||
                       text.toLowerCase().includes('running'))) {
            deploymentStatus = text.trim();
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    console.log(`📊 Deployment Status: ${deploymentStatus}`);

    // Extract logs - try multiple common selectors
    const logSelectors = [
      'pre',
      'code',
      '[class*="log"]',
      '[class*="console"]',
      '[class*="output"]',
      'textarea',
      '[role="log"]'
    ];

    let logs = '';
    for (const selector of logSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible({ timeout: 1000 })) {
            const text = await element.textContent();
            if (text && text.length > 50) { // Likely a log block
              logs += text + '\n\n';
            }
          }
        }
        if (logs.length > 100) break; // Found logs
      } catch (e) {
        // Continue to next selector
      }
    }

    // If no logs found with specific selectors, get all text content
    if (logs.length < 100) {
      console.log('⚠️  Specific log selectors not found, extracting all visible text...');
      logs = await page.evaluate(() => document.body.innerText);
    }

    // Look for specific error messages
    const errorPatterns = [
      /error/i,
      /fail/i,
      /cannot find module/i,
      /@next\/bundle-analyzer/i,
      /build failed/i,
      /deployment failed/i
    ];

    const errors = [];
    const logLines = logs.split('\n');
    for (const line of logLines) {
      for (const pattern of errorPatterns) {
        if (pattern.test(line)) {
          errors.push(line.trim());
          break;
        }
      }
    }

    // Save full logs
    const logsPath = path.join(__dirname, '../claudedocs/coolify-deployment-logs.txt');
    const report = `
==========================================================
COOLIFY DEPLOYMENT LOG EXTRACTION
==========================================================
Timestamp: ${new Date().toISOString()}
URL: https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw/deployment/tcg440s8sswcc0gwk8k00c4c

Deployment Status: ${deploymentStatus}

==========================================================
DETECTED ERRORS/WARNINGS (${errors.length})
==========================================================
${errors.length > 0 ? errors.join('\n') : 'No errors detected with pattern matching'}

==========================================================
FULL LOGS
==========================================================
${logs}
`;

    fs.writeFileSync(logsPath, report);
    console.log(`\n💾 Full logs saved to: ${logsPath}`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${deploymentStatus}`);
    console.log(`Errors Found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('\nError/Warning Messages:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}${err.length > 100 ? '...' : ''}`);
      });
    }
    console.log('='.repeat(60));

    // Check for specific bundle analyzer error
    const hasBundleAnalyzerError = logs.toLowerCase().includes('@next/bundle-analyzer') &&
                                    logs.toLowerCase().includes('cannot find module');

    if (hasBundleAnalyzerError) {
      console.log('\n❌ BUNDLE ANALYZER ERROR STILL PRESENT');
    } else if (errors.length === 0) {
      console.log('\n✅ NO ERRORS DETECTED - DEPLOYMENT APPEARS SUCCESSFUL');
    } else {
      console.log('\n⚠️  ERRORS DETECTED - SEE LOGS FOR DETAILS');
    }

    // Wait for user to see the browser
    console.log('\n⏳ Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error during execution:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({
        path: path.join(__dirname, '../claudedocs/coolify-error-screenshot.png'),
        fullPage: true
      });
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed');
  }
})();

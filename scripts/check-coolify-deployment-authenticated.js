const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // Check for credentials in environment variables
  const COOLIFY_EMAIL = process.env.COOLIFY_EMAIL;
  const COOLIFY_PASSWORD = process.env.COOLIFY_PASSWORD;

  if (!COOLIFY_EMAIL || !COOLIFY_PASSWORD) {
    console.error('❌ ERROR: Missing Coolify credentials');
    console.error('Please set environment variables:');
    console.error('  COOLIFY_EMAIL=your-email@example.com');
    console.error('  COOLIFY_PASSWORD=your-password');
    console.error('\nUsage:');
    console.error('  COOLIFY_EMAIL=user@example.com COOLIFY_PASSWORD=pass node scripts/check-coolify-deployment-authenticated.js');
    process.exit(1);
  }

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
    console.log('🔐 Step 1: Navigating to Coolify login page...');

    // Go to login page first
    await page.goto('https://coolify.aluplan.tr/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✅ Login page loaded');

    // Fill in login credentials
    console.log('📝 Step 2: Entering credentials...');

    // Wait for email input
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.fill('input[type="email"], input[name="email"]', COOLIFY_EMAIL);

    // Wait for password input
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 10000 });
    await page.fill('input[type="password"], input[name="password"]', COOLIFY_PASSWORD);

    console.log('🔑 Step 3: Logging in...');

    // Click login button
    await page.click('button:has-text("Login"), button[type="submit"]');

    // Wait for navigation after login
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    console.log('✅ Login successful');

    // Now navigate to the deployment page
    console.log('🚀 Step 4: Navigating to deployment page...');

    const deploymentUrl = 'https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw/deployment/tcg440s8sswcc0gwk8k00c4c';

    await page.goto(deploymentUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('✅ Deployment page loaded');

    // Wait for dynamic content
    await page.waitForTimeout(5000);

    // Take screenshot
    const screenshotPath = path.join(__dirname, '../claudedocs/coolify-deployment-authenticated-screenshot.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    // Extract deployment status
    console.log('\n🔍 Step 5: Extracting deployment information...\n');

    // Look for deployment status
    const statusSelectors = [
      '[data-testid="deployment-status"]',
      '.deployment-status',
      '.status',
      'h1', 'h2', 'h3',
      '[class*="Status"]',
      'span:has-text("Success")',
      'span:has-text("Failed")',
      'span:has-text("Running")',
      'span:has-text("In Progress")'
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
                       text.toLowerCase().includes('running') ||
                       text.toLowerCase().includes('error'))) {
            deploymentStatus = text.trim();
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    console.log(`📊 Deployment Status: ${deploymentStatus}`);

    // Extract logs - comprehensive approach
    console.log('📜 Extracting deployment logs...');

    let logs = '';

    // Try specific log selectors
    const logSelectors = [
      'pre',
      'code',
      '[class*="log"]',
      '[class*="console"]',
      '[class*="output"]',
      '[class*="terminal"]',
      'textarea',
      '[role="log"]',
      '[data-testid*="log"]',
      '.monaco-editor', // Common code editor
      '[class*="Log"]'
    ];

    for (const selector of logSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible({ timeout: 1000 })) {
            const text = await element.textContent();
            if (text && text.length > 50) {
              logs += `\n--- ${selector} ---\n${text}\n`;
            }
          }
        }
      } catch (e) {
        // Continue
      }
    }

    // If no logs found, get all text
    if (logs.length < 100) {
      console.log('⚠️  Specific log selectors not found, extracting all visible text...');
      logs = await page.evaluate(() => document.body.innerText);
    }

    // Look for error patterns
    const errorPatterns = [
      /error/i,
      /fail/i,
      /cannot find module/i,
      /@next\/bundle-analyzer/i,
      /build failed/i,
      /deployment failed/i,
      /npm ERR!/i,
      /TypeError/i,
      /ReferenceError/i,
      /ModuleNotFoundError/i
    ];

    const errors = [];
    const warnings = [];
    const logLines = logs.split('\n');

    for (const line of logLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      for (const pattern of errorPatterns) {
        if (pattern.test(trimmedLine)) {
          if (trimmedLine.toLowerCase().includes('error') ||
              trimmedLine.toLowerCase().includes('fail')) {
            errors.push(trimmedLine);
          } else {
            warnings.push(trimmedLine);
          }
          break;
        }
      }
    }

    // Save full logs
    const logsPath = path.join(__dirname, '../claudedocs/coolify-deployment-authenticated-logs.txt');
    const report = `
==========================================================
COOLIFY DEPLOYMENT LOG EXTRACTION (AUTHENTICATED)
==========================================================
Timestamp: ${new Date().toISOString()}
URL: ${deploymentUrl}

Deployment Status: ${deploymentStatus}

==========================================================
DETECTED ERRORS (${errors.length})
==========================================================
${errors.length > 0 ? errors.slice(0, 50).join('\n') : 'No errors detected'}

==========================================================
DETECTED WARNINGS (${warnings.length})
==========================================================
${warnings.length > 0 ? warnings.slice(0, 50).join('\n') : 'No warnings detected'}

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
    console.log(`Warnings Found: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n🚨 Error Messages (Top 10):');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 120)}${err.length > 120 ? '...' : ''}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warning Messages (Top 5):');
      warnings.slice(0, 5).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.substring(0, 120)}${warn.length > 120 ? '...' : ''}`);
      });
    }

    console.log('='.repeat(60));

    // Check for specific bundle analyzer error
    const hasBundleAnalyzerError = logs.toLowerCase().includes('@next/bundle-analyzer') &&
                                    logs.toLowerCase().includes('cannot find module');

    if (hasBundleAnalyzerError) {
      console.log('\n❌ BUNDLE ANALYZER ERROR STILL PRESENT');
      console.log('The fix in next.config.ts did not resolve the issue.');
    } else if (errors.length === 0) {
      console.log('\n✅ NO ERRORS DETECTED - DEPLOYMENT APPEARS SUCCESSFUL');
      console.log('The @next/bundle-analyzer fix appears to be working!');
    } else {
      console.log('\n⚠️  ERRORS DETECTED - SEE LOGS FOR DETAILS');
    }

    // Wait for user to see the browser
    console.log('\n⏳ Browser will close in 15 seconds (press Ctrl+C to keep open)...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Error during execution:', error.message);
    console.error('Stack:', error.stack);

    // Take error screenshot
    try {
      await page.screenshot({
        path: path.join(__dirname, '../claudedocs/coolify-error-authenticated-screenshot.png'),
        fullPage: true
      });
      console.log('📸 Error screenshot saved');
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed');
  }
})();

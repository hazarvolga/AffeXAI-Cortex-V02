const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkCoolifyBackend() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, '../claudedocs/coolify-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    findings: [],
    screenshots: [],
    issues: [],
    recommendations: []
  };

  try {
    console.log('🚀 Starting Coolify backend configuration check...');

    // Navigate to Coolify
    console.log('📍 Navigating to Coolify...');
    await page.goto('https://coolify.aluplan.tr/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });
    report.screenshots.push('01-login-page.png');

    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"], input[name="email"]', 'hazarvolga@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'MERc90md?*1907!');
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '02-after-login.png'), fullPage: true });
    report.screenshots.push('02-after-login.png');

    console.log('✅ Login successful');
    report.findings.push('Successfully logged into Coolify');

    // Wait a bit for dashboard to load
    await page.waitForTimeout(2000);

    // Look for projects/applications
    console.log('🔍 Looking for backend application...');

    // Try to find the backend project/application
    // Common selectors in Coolify
    const possibleSelectors = [
      'text=/.*backend.*/i',
      'text=/.*nestjs.*/i',
      'text=/.*api.*/i',
      '[href*="backend"]',
      '[href*="nestjs"]',
      '[href*="api"]'
    ];

    let backendFound = false;
    let backendElement = null;

    for (const selector of possibleSelectors) {
      try {
        backendElement = await page.locator(selector).first();
        if (await backendElement.count() > 0) {
          console.log(`✅ Found backend with selector: ${selector}`);
          backendFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!backendFound) {
      console.log('⚠️  Could not find backend application automatically');
      report.issues.push('Backend application not found automatically');

      // Take screenshot of current page
      await page.screenshot({ path: path.join(screenshotsDir, '03-applications-list.png'), fullPage: true });
      report.screenshots.push('03-applications-list.png');

      // Try to navigate to projects/applications page
      const navLinks = await page.locator('a').all();
      for (const link of navLinks) {
        const text = await link.textContent();
        if (text && (text.toLowerCase().includes('project') || text.toLowerCase().includes('application') || text.toLowerCase().includes('resource'))) {
          console.log(`📍 Clicking on: ${text}`);
          await link.click();
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: path.join(screenshotsDir, '04-navigation-attempt.png'), fullPage: true });
          report.screenshots.push('04-navigation-attempt.png');
          break;
        }
      }
    } else {
      // Click on backend application
      console.log('📍 Clicking on backend application...');
      await backendElement.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(screenshotsDir, '05-backend-overview.png'), fullPage: true });
      report.screenshots.push('05-backend-overview.png');
      report.findings.push('Navigated to backend application');

      // Wait for page to stabilize
      await page.waitForTimeout(2000);

      // Look for Domains tab/section
      console.log('🔍 Looking for Domains configuration...');
      const domainSelectors = [
        'text=/.*domain.*/i',
        '[href*="domain"]',
        'button:has-text("Domain")',
        'a:has-text("Domain")',
        'div:has-text("Domain")'
      ];

      let domainTabFound = false;
      for (const selector of domainSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`✅ Found domains section with: ${selector}`);
            await element.click();
            await page.waitForLoadState('networkidle');
            await page.screenshot({ path: path.join(screenshotsDir, '06-domains-tab.png'), fullPage: true });
            report.screenshots.push('06-domains-tab.png');
            domainTabFound = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (domainTabFound) {
        report.findings.push('Found domains configuration section');

        // Extract domain information
        const pageContent = await page.content();

        // Check for api.aluplan.tr
        if (pageContent.includes('api.aluplan.tr')) {
          console.log('✅ Domain api.aluplan.tr is configured');
          report.findings.push('Domain api.aluplan.tr is present in configuration');
        } else {
          console.log('❌ Domain api.aluplan.tr NOT found');
          report.issues.push('Domain api.aluplan.tr is NOT configured');
          report.recommendations.push('Add api.aluplan.tr to domains configuration');
        }

        // Look for port configuration
        if (pageContent.includes('9006') || pageContent.includes('3001')) {
          const port = pageContent.includes('9006') ? '9006' : '3001';
          console.log(`✅ Found port ${port} in configuration`);
          report.findings.push(`Port ${port} found in configuration`);
        } else {
          console.log('⚠️  No port 9006 or 3001 found');
          report.issues.push('Backend port (9006 or 3001) not visible in domain configuration');
        }
      } else {
        report.issues.push('Could not find domains configuration tab');
      }

      // Look for Network/General settings
      console.log('🔍 Looking for Network/General settings...');
      const settingsSelectors = [
        'text=/.*network.*/i',
        'text=/.*general.*/i',
        'text=/.*configuration.*/i',
        'text=/.*settings.*/i',
        '[href*="network"]',
        '[href*="general"]',
        '[href*="settings"]'
      ];

      for (const selector of settingsSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`✅ Found settings section with: ${selector}`);
            await element.click();
            await page.waitForLoadState('networkidle');
            await page.screenshot({ path: path.join(screenshotsDir, '07-network-settings.png'), fullPage: true });
            report.screenshots.push('07-network-settings.png');

            // Extract network information
            const networkContent = await page.content();

            // Check for port mappings
            const portPattern = /(\d+)[:\/](\d+)/g;
            const ports = [...networkContent.matchAll(portPattern)];
            if (ports.length > 0) {
              report.findings.push(`Found port mappings: ${ports.map(p => p[0]).join(', ')}`);
            }

            // Check for Docker network
            if (networkContent.includes('network') || networkContent.includes('bridge')) {
              report.findings.push('Docker network configuration found');
            }

            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // Take a final comprehensive screenshot
      await page.screenshot({ path: path.join(screenshotsDir, '08-final-state.png'), fullPage: true });
      report.screenshots.push('08-final-state.png');
    }

    // Generate recommendations based on findings
    if (report.issues.length === 0) {
      report.recommendations.push('Configuration appears correct. Issue may be with Traefik routing or DNS.');
    } else {
      if (report.issues.some(i => i.includes('api.aluplan.tr is NOT configured'))) {
        report.recommendations.push('CRITICAL: Add api.aluplan.tr to the domains configuration');
        report.recommendations.push('Ensure domain is set to expose port 9006 (or 3001)');
        report.recommendations.push('Enable HTTPS/SSL for the domain');
      }
      if (report.issues.some(i => i.includes('port'))) {
        report.recommendations.push('Verify port mapping: container port 9006 should be exposed');
        report.recommendations.push('Check if Traefik labels are correctly set for routing');
      }
    }

  } catch (error) {
    console.error('❌ Error during inspection:', error);
    report.issues.push(`Error: ${error.message}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png'), fullPage: true });
    report.screenshots.push('error-state.png');
  } finally {
    // Save report
    const reportPath = path.join(screenshotsDir, 'backend-config-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('COOLIFY BACKEND CONFIGURATION REPORT');
    console.log('='.repeat(80));
    console.log('\n📋 FINDINGS:');
    report.findings.forEach(f => console.log(`  ✓ ${f}`));
    console.log('\n⚠️  ISSUES:');
    report.issues.forEach(i => console.log(`  ✗ ${i}`));
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(r => console.log(`  → ${r}`));
    console.log('\n📸 SCREENSHOTS:');
    report.screenshots.forEach(s => console.log(`  → ${s}`));
    console.log('\n' + '='.repeat(80));

    await browser.close();
  }
}

checkCoolifyBackend().catch(console.error);

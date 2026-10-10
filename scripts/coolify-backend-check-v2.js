const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkCoolifyBackend() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
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
    recommendations: [],
    domainConfig: null,
    portConfig: null,
    networkConfig: null
  };

  try {
    console.log('🚀 Starting Coolify backend configuration check...');

    // Navigate to Coolify
    console.log('📍 Navigating to Coolify...');
    await page.goto('https://coolify.aluplan.tr/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });

    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"], input[name="email"]', 'hazarvolga@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'MERc90md?*1907!');
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '02-dashboard.png'), fullPage: true });
    console.log('✅ Login successful');
    report.findings.push('Successfully logged into Coolify');

    // Click on "AffexAI Aluplan" project
    console.log('📍 Clicking on AffexAI Aluplan project...');
    await page.click('text=AffexAI Aluplan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '03-project-page.png'), fullPage: true });
    report.findings.push('Opened AffexAI Aluplan project');

    // Look for backend application in the resources list
    console.log('🔍 Looking for backend application...');
    const pageContent = await page.content();

    // Look for backend-related resources
    const backendPatterns = ['backend', 'nestjs', 'api', 'affexai-backend'];
    let backendFound = false;

    for (const pattern of backendPatterns) {
      if (pageContent.toLowerCase().includes(pattern)) {
        console.log(`✅ Found pattern: ${pattern}`);
        backendFound = true;
      }
    }

    if (!backendFound) {
      report.issues.push('Could not find backend application in project resources');
    }

    // Try to find and click on backend resource
    const resourceSelectors = [
      'text=backend',
      'text=nestjs',
      'text=api',
      'text=/.*backend.*/i',
      'a:has-text("backend")',
      'div:has-text("backend")'
    ];

    let clickedBackend = false;
    for (const selector of resourceSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          if (await element.isVisible()) {
            console.log(`📍 Clicking on backend resource with selector: ${selector}`);
            await element.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: path.join(screenshotsDir, '04-backend-resource.png'), fullPage: true });
            clickedBackend = true;
            report.findings.push('Opened backend resource');
            break;
          }
        }
        if (clickedBackend) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!clickedBackend) {
      console.log('⚠️  Could not click on backend resource automatically');
      report.issues.push('Could not navigate to backend resource automatically');

      // Take screenshot of current state
      await page.screenshot({ path: path.join(screenshotsDir, '04-resources-list.png'), fullPage: true });

      // Get all visible text to help identify resources
      const allText = await page.evaluate(() => document.body.innerText);
      console.log('Page content preview:', allText.substring(0, 500));
    }

    // Now look for Configuration/Domains tabs
    console.log('🔍 Looking for configuration tabs...');

    // Common tab names in Coolify
    const configTabs = ['Configuration', 'Domains', 'General', 'Network', 'Environment', 'Storages'];

    for (const tabName of configTabs) {
      try {
        const tab = page.locator(`text=${tabName}`).first();
        if (await tab.isVisible()) {
          console.log(`📍 Found tab: ${tabName}`);
          await tab.click();
          await page.waitForTimeout(2000);
          await page.screenshot({
            path: path.join(screenshotsDir, `05-tab-${tabName.toLowerCase()}.png`),
            fullPage: true
          });
          report.screenshots.push(`05-tab-${tabName.toLowerCase()}.png`);

          // Extract configuration info
          const tabContent = await page.content();

          // Check for api.aluplan.tr domain
          if (tabContent.includes('api.aluplan.tr')) {
            console.log('✅ Found domain: api.aluplan.tr');
            report.domainConfig = 'api.aluplan.tr is configured';
            report.findings.push('Domain api.aluplan.tr found in configuration');
          }

          // Check for ports
          if (tabContent.includes('9006')) {
            console.log('✅ Found port: 9006');
            report.portConfig = 'Port 9006 configured';
            report.findings.push('Port 9006 found in configuration');
          }
          if (tabContent.includes('3001')) {
            console.log('✅ Found port: 3001');
            if (!report.portConfig) report.portConfig = 'Port 3001 configured';
            report.findings.push('Port 3001 found in configuration');
          }

          // Check for network/docker info
          if (tabContent.includes('network') || tabContent.includes('bridge') || tabContent.includes('docker')) {
            console.log('✅ Found network configuration');
            report.networkConfig = 'Docker network configuration found';
            report.findings.push('Network configuration found');
          }
        }
      } catch (e) {
        // Tab might not exist, continue
      }
    }

    // Specifically look for Domains section
    console.log('🔍 Specifically checking Domains section...');
    try {
      const domainsSection = page.locator('text=Domains').first();
      if (await domainsSection.isVisible()) {
        await domainsSection.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '06-domains-detailed.png'), fullPage: true });
        report.screenshots.push('06-domains-detailed.png');

        const domainsContent = await page.content();

        // Parse domain configuration
        if (domainsContent.includes('api.aluplan.tr')) {
          report.findings.push('✅ CONFIRMED: api.aluplan.tr is in domains configuration');

          // Check if it's listening on correct port
          const portMatch = domainsContent.match(/(?:port|listen|expose).*?(\d{4})/i);
          if (portMatch) {
            report.findings.push(`Port configuration found: ${portMatch[1]}`);
          }
        } else {
          report.issues.push('❌ CRITICAL: api.aluplan.tr is NOT configured in domains');
          report.recommendations.push('Add api.aluplan.tr to domains configuration');
          report.recommendations.push('Configure domain to route to port 9006 (backend container port)');
        }

        // Check for SSL/HTTPS
        if (domainsContent.includes('https') || domainsContent.includes('ssl') || domainsContent.includes('certificate')) {
          report.findings.push('SSL/HTTPS configuration found');
        } else {
          report.recommendations.push('Consider enabling HTTPS/SSL for api.aluplan.tr');
        }
      }
    } catch (e) {
      console.log('⚠️  Could not access Domains section specifically');
      report.issues.push('Could not access Domains section');
    }

    // Take final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '99-final-state.png'), fullPage: true });
    report.screenshots.push('99-final-state.png');

    // Generate analysis and recommendations
    console.log('\n🔍 Analyzing configuration...');

    if (!report.domainConfig) {
      report.issues.push('❌ CRITICAL: Domain api.aluplan.tr is NOT configured');
      report.recommendations.push('URGENT: Add api.aluplan.tr to Coolify domains configuration');
      report.recommendations.push('Steps to fix:');
      report.recommendations.push('  1. Navigate to backend application in Coolify');
      report.recommendations.push('  2. Go to "Domains" tab');
      report.recommendations.push('  3. Add domain: api.aluplan.tr');
      report.recommendations.push('  4. Set port: 9006 (or container port)');
      report.recommendations.push('  5. Enable HTTPS/SSL');
      report.recommendations.push('  6. Save and restart application');
    }

    if (!report.portConfig) {
      report.issues.push('Port configuration not visible (9006 or 3001)');
      report.recommendations.push('Verify backend container is exposing port 9006');
      report.recommendations.push('Check Dockerfile EXPOSE directive');
    }

    if (!report.networkConfig) {
      report.issues.push('Network configuration not clearly visible');
      report.recommendations.push('Verify backend container is on correct Docker network');
      report.recommendations.push('Ensure Traefik can route to backend container');
    }

    // Root cause analysis
    if (report.issues.some(i => i.includes('api.aluplan.tr is NOT configured'))) {
      report.recommendations.push('\n🎯 ROOT CAUSE IDENTIFIED:');
      report.recommendations.push('The "no available server" error is because Traefik/Coolify');
      report.recommendations.push('does not have api.aluplan.tr in its routing configuration.');
      report.recommendations.push('Without domain configuration, Traefik cannot route external');
      report.recommendations.push('requests to the backend container, even if container is healthy.');
    }

  } catch (error) {
    console.error('❌ Error during inspection:', error);
    report.issues.push(`Error: ${error.message}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png'), fullPage: true });
  } finally {
    // Save detailed report
    const reportPath = path.join(screenshotsDir, 'backend-config-report-v2.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Print comprehensive summary
    console.log('\n' + '='.repeat(80));
    console.log('COOLIFY BACKEND CONFIGURATION DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    console.log(`\n⏰ Timestamp: ${report.timestamp}`);
    console.log('\n📋 FINDINGS:');
    if (report.findings.length > 0) {
      report.findings.forEach(f => console.log(`  ✓ ${f}`));
    } else {
      console.log('  (none)');
    }
    console.log('\n⚙️  CONFIGURATION STATUS:');
    console.log(`  Domain: ${report.domainConfig || '❌ NOT CONFIGURED'}`);
    console.log(`  Port: ${report.portConfig || '⚠️  NOT VISIBLE'}`);
    console.log(`  Network: ${report.networkConfig || '⚠️  NOT VISIBLE'}`);
    console.log('\n⚠️  ISSUES IDENTIFIED:');
    if (report.issues.length > 0) {
      report.issues.forEach(i => console.log(`  ✗ ${i}`));
    } else {
      console.log('  (none)');
    }
    console.log('\n💡 RECOMMENDATIONS:');
    if (report.recommendations.length > 0) {
      report.recommendations.forEach(r => console.log(`  → ${r}`));
    } else {
      console.log('  Configuration appears correct!');
    }
    console.log('\n📸 SCREENSHOTS CAPTURED:');
    report.screenshots.forEach(s => console.log(`  → ${s}`));
    console.log('\n' + '='.repeat(80));

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

    await browser.close();
  }
}

checkCoolifyBackend().catch(console.error);

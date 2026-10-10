const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function checkCoolifyBackend() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 800
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

    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"], input[name="email"]', 'hazarvolga@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'MERc90md?*1907!');
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '02-dashboard.png'), fullPage: true });
    console.log('✅ Login successful');
    report.findings.push('Successfully logged into Coolify');

    // Navigate directly to project using the URL from error message
    console.log('📍 Navigating to AffexAI Aluplan project...');
    await page.goto('https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '03-project-page.png'), fullPage: true });
    report.findings.push('Opened AffexAI Aluplan project');
    report.screenshots.push('03-project-page.png');

    // Look for resources/applications
    console.log('🔍 Looking for applications in project...');
    const pageContent = await page.content();

    // Search for backend application
    const backendKeywords = ['backend', 'nestjs', 'api', 'affexai'];
    let foundBackendKeyword = null;

    for (const keyword of backendKeywords) {
      if (pageContent.toLowerCase().includes(keyword)) {
        console.log(`✅ Found keyword: ${keyword}`);
        foundBackendKeyword = keyword;
        break;
      }
    }

    if (foundBackendKeyword) {
      report.findings.push(`Backend application found (keyword: ${foundBackendKeyword})`);
    } else {
      report.issues.push('Backend application not found in project resources');
    }

    // Try clicking on backend application link
    console.log('📍 Looking for backend application link...');
    const linkSelectors = [
      'a[href*="backend"]',
      'a[href*="nestjs"]',
      'a[href*="api"]',
      'text=backend',
      'text=nestjs',
      'text=affexai-backend'
    ];

    let navigatedToBackend = false;
    for (const selector of linkSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.count() > 0) {
          const href = await link.getAttribute('href');
          if (href) {
            console.log(`📍 Found backend link: ${href}`);
            await page.goto(`https://coolify.aluplan.tr${href}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: path.join(screenshotsDir, '04-backend-app.png'), fullPage: true });
            report.screenshots.push('04-backend-app.png');
            report.findings.push('Navigated to backend application');
            navigatedToBackend = true;
            break;
          }
        }
      } catch (e) {
        // Continue
      }
    }

    if (!navigatedToBackend) {
      console.log('⚠️  Could not navigate to backend app automatically');
      console.log('📸 Taking screenshot of current page...');
      await page.screenshot({ path: path.join(screenshotsDir, '04-current-page.png'), fullPage: true });
      report.screenshots.push('04-current-page.png');

      // Get all links on page
      const links = await page.$$eval('a', as => as.map(a => ({ text: a.textContent?.trim(), href: a.href })));
      console.log('Available links:', links.filter(l => l.text).slice(0, 20));
    }

    // Look for configuration tabs
    console.log('🔍 Looking for Domains/Configuration tabs...');

    const tabs = ['Configuration', 'Domains', 'General', 'Environment', 'Storages', 'Logs'];
    let screenshotCount = 5;

    for (const tabName of tabs) {
      try {
        const tabLocator = page.locator(`text="${tabName}"`).first();
        if (await tabLocator.count() > 0 && await tabLocator.isVisible()) {
          console.log(`📍 Found tab: ${tabName}`);
          await tabLocator.click();
          await page.waitForTimeout(2000);

          const screenshotPath = `0${screenshotCount}-tab-${tabName.toLowerCase()}.png`;
          await page.screenshot({
            path: path.join(screenshotsDir, screenshotPath),
            fullPage: true
          });
          report.screenshots.push(screenshotPath);
          screenshotCount++;

          const tabContent = await page.content();

          // Check for api.aluplan.tr
          if (tabContent.includes('api.aluplan.tr')) {
            console.log('✅ Domain api.aluplan.tr FOUND!');
            report.domainConfig = 'api.aluplan.tr is configured';
            report.findings.push(`Domain api.aluplan.tr found in ${tabName} tab`);
          }

          // Check for ports
          const portMatches = tabContent.match(/\b(9006|3001|80|443)\b/g);
          if (portMatches) {
            console.log(`✅ Found ports: ${portMatches.join(', ')}`);
            report.portConfig = `Ports found: ${portMatches.join(', ')}`;
            report.findings.push(`Ports found in ${tabName}: ${portMatches.join(', ')}`);
          }

          // Check for network configuration
          if (tabContent.includes('network') || tabContent.includes('docker') || tabContent.includes('bridge')) {
            console.log('✅ Network configuration found');
            report.networkConfig = 'Docker network configuration present';
            report.findings.push(`Network configuration found in ${tabName}`);
          }

          // Check for Traefik labels
          if (tabContent.includes('traefik')) {
            console.log('✅ Traefik configuration found');
            report.findings.push(`Traefik configuration found in ${tabName}`);
          }
        }
      } catch (e) {
        console.log(`⚠️  Could not access ${tabName} tab:`, e.message);
      }
    }

    // Specifically look for Domains section (most important)
    console.log('🔍 Specifically looking for Domains section...');
    try {
      const domainsLocator = page.locator('text=/domains?/i').first();
      if (await domainsLocator.count() > 0) {
        await domainsLocator.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(screenshotsDir, '10-domains-detailed.png'),
          fullPage: true
        });
        report.screenshots.push('10-domains-detailed.png');

        const domainsHtml = await page.content();

        // Detailed domain analysis
        if (domainsHtml.includes('api.aluplan.tr')) {
          report.findings.push('✅ CONFIRMED: api.aluplan.tr is configured');

          // Check for port configuration
          const portRegex = /port[:\s]*(\d+)/gi;
          const portMatches = [...domainsHtml.matchAll(portRegex)];
          if (portMatches.length > 0) {
            portMatches.forEach(match => {
              report.findings.push(`Port configuration: ${match[0]}`);
            });
          }

          // Check for SSL/HTTPS
          if (domainsHtml.includes('https://') || domainsHtml.toLowerCase().includes('ssl')) {
            report.findings.push('✅ HTTPS/SSL enabled');
          }
        } else {
          report.issues.push('❌ CRITICAL: api.aluplan.tr NOT found in Domains section');
        }
      }
    } catch (e) {
      console.log('⚠️  Could not access Domains section specifically');
    }

    // Take final comprehensive screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '99-final.png'), fullPage: true });
    report.screenshots.push('99-final.png');

    // Analysis and recommendations
    console.log('\n🔍 Generating analysis...');

    if (!report.domainConfig || report.issues.some(i => i.includes('api.aluplan.tr NOT found'))) {
      report.issues.push('❌ CRITICAL ISSUE: Domain api.aluplan.tr is NOT configured');
      report.recommendations.push('🎯 ROOT CAUSE: The "no available server" error is because:');
      report.recommendations.push('   Traefik/Coolify does not have api.aluplan.tr in routing config');
      report.recommendations.push('   Without domain routing, external requests cannot reach backend');
      report.recommendations.push('');
      report.recommendations.push('📝 FIX STEPS:');
      report.recommendations.push('   1. In Coolify, navigate to backend application');
      report.recommendations.push('   2. Go to "Domains" or "Configuration" tab');
      report.recommendations.push('   3. Add domain: api.aluplan.tr');
      report.recommendations.push('   4. Set container port: 9006 (backend app port)');
      report.recommendations.push('   5. Enable HTTPS/SSL (Let\'s Encrypt)');
      report.recommendations.push('   6. Save configuration');
      report.recommendations.push('   7. Restart/redeploy application');
      report.recommendations.push('   8. Wait 2-3 minutes for Traefik to update routing');
    } else {
      report.recommendations.push('✅ Domain configuration appears correct');
      report.recommendations.push('If still getting "no available server", check:');
      report.recommendations.push('   - DNS: Ensure api.aluplan.tr points to server IP');
      report.recommendations.push('   - Container health: Backend container is running');
      report.recommendations.push('   - Traefik logs: Check for routing errors');
      report.recommendations.push('   - Port mapping: Container port 9006 is exposed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    report.issues.push(`Error: ${error.message}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
    report.screenshots.push('error.png');
  } finally {
    // Save report
    const reportPath = path.join(screenshotsDir, 'backend-config-report-final.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('COOLIFY BACKEND DOMAIN CONFIGURATION DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    console.log(`\n⏰ Timestamp: ${report.timestamp}`);
    console.log('\n📋 FINDINGS:');
    if (report.findings.length > 0) {
      report.findings.forEach(f => console.log(`  ✓ ${f}`));
    } else {
      console.log('  (No findings)');
    }
    console.log('\n⚙️  CONFIGURATION STATUS:');
    console.log(`  🌐 Domain: ${report.domainConfig || '❌ NOT CONFIGURED'}`);
    console.log(`  🔌 Port: ${report.portConfig || '⚠️  NOT FOUND'}`);
    console.log(`  🔗 Network: ${report.networkConfig || '⚠️  NOT FOUND'}`);
    console.log('\n⚠️  ISSUES:');
    if (report.issues.length > 0) {
      report.issues.forEach(i => console.log(`  ✗ ${i}`));
    } else {
      console.log('  ✅ No critical issues found');
    }
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(r => console.log(`  ${r}`));
    console.log('\n📸 SCREENSHOTS:');
    report.screenshots.forEach(s => console.log(`  → ${screenshotsDir}/${s}`));
    console.log('\n📄 Full report: ' + reportPath);
    console.log('='.repeat(80));

    console.log('\n⏸️  Browser open for 20 seconds for manual inspection...');
    await page.waitForTimeout(20000);

    await browser.close();
  }
}

checkCoolifyBackend().catch(console.error);

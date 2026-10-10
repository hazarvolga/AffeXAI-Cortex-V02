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
    console.log('🚀 Coolify Backend Domain Configuration Checker');
    console.log('='.repeat(60));

    // Login
    console.log('\n📍 Step 1: Logging into Coolify...');
    await page.goto('https://coolify.aluplan.tr/');
    await page.fill('input[type="email"]', 'hazarvolga@gmail.com');
    await page.fill('input[type="password"]', 'MERc90md?*1907!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Logged in successfully');

    // Navigate to project
    console.log('\n📍 Step 2: Opening AffexAI Aluplan project...');
    await page.goto('https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, 'step2-project.png'), fullPage: true });
    console.log('✅ Project page loaded');

    // Click on "Aluplan AffexAI Backend"
    console.log('\n📍 Step 3: Opening Aluplan AffexAI Backend application...');
    await page.click('text=Aluplan AffexAI Backend');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, 'step3-backend-overview.png'), fullPage: true });
    console.log('✅ Backend application opened');
    report.findings.push('Successfully opened backend application');

    // Check current page content
    let pageContent = await page.content();
    console.log('\n🔍 Step 4: Analyzing configuration...');

    // Check for domain
    if (pageContent.includes('api.aluplan.tr')) {
      console.log('✅ Found domain: api.aluplan.tr');
      report.domainConfig = 'api.aluplan.tr';
      report.findings.push('Domain api.aluplan.tr is configured');
    } else if (pageContent.includes('http://api.aluplan.tr')) {
      console.log('⚠️  Found: http://api.aluplan.tr (HTTP, not HTTPS)');
      report.domainConfig = 'http://api.aluplan.tr (HTTP only)';
      report.issues.push('Domain is configured with HTTP only (should be HTTPS)');
    } else {
      console.log('❌ Domain api.aluplan.tr NOT found');
      report.issues.push('Domain api.aluplan.tr not found in configuration');
    }

    // Look for tabs
    console.log('\n🔍 Step 5: Checking configuration tabs...');
    const tabs = [
      { name: 'Configuration', selector: 'text=Configuration' },
      { name: 'Domains', selector: 'text=Domains' },
      { name: 'General', selector: 'text=General' },
      { name: 'Environment Variables', selector: 'text=Environment Variables' },
      { name: 'Storages', selector: 'text=Storages' },
      { name: 'Resource Limits', selector: 'text=Resource Limits' },
      { name: 'Logs', selector: 'text=Logs' }
    ];

    for (const tab of tabs) {
      try {
        const tabElement = await page.locator(tab.selector).first();
        if (await tabElement.count() > 0 && await tabElement.isVisible()) {
          console.log(`\n  📂 Checking ${tab.name} tab...`);
          await tabElement.click();
          await page.waitForTimeout(2000);

          const filename = `tab-${tab.name.toLowerCase().replace(/\s+/g, '-')}.png`;
          await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: true });
          report.screenshots.push(filename);

          const tabContent = await page.content();

          // Domain check
          if (tabContent.includes('api.aluplan.tr')) {
            console.log(`    ✅ Domain found in ${tab.name}`);
            if (!report.domainConfig) {
              report.domainConfig = 'api.aluplan.tr';
            }
          }

          // Port check
          const ports = tabContent.match(/\b(9006|3001|80|443|8080)\b/g);
          if (ports) {
            console.log(`    ✅ Ports found: ${[...new Set(ports)].join(', ')}`);
            report.portConfig = [...new Set(ports)].join(', ');
          }

          // SSL/HTTPS check
          if (tabContent.includes('https://') && tabContent.includes('api.aluplan.tr')) {
            console.log(`    ✅ HTTPS configuration found`);
            report.findings.push('HTTPS/SSL is configured');
          }

          // Traefik check
          if (tabContent.includes('traefik') || tabContent.includes('Traefik')) {
            console.log(`    ✅ Traefik configuration found`);
            report.findings.push('Traefik labels present');
          }
        }
      } catch (e) {
        // Tab doesn't exist or not accessible
      }
    }

    // Specifically check Domains tab (most critical)
    console.log('\n🔍 Step 6: Detailed Domains analysis...');
    try {
      const domainsTab = page.locator('text=/^Domains?$/i').first();
      if (await domainsTab.count() > 0) {
        await domainsTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, 'domains-detailed.png'), fullPage: true });

        const domainsHtml = await page.content();

        console.log('\n  Domains Configuration:');
        console.log('  ' + '-'.repeat(50));

        // Check for domain input field
        const domainInputs = await page.$$('input[value*="api.aluplan.tr"], input[placeholder*="domain"]');
        for (const input of domainInputs) {
          const value = await input.getAttribute('value');
          console.log(`    Input value: ${value}`);
        }

        // Check for domain display
        if (domainsHtml.includes('api.aluplan.tr')) {
          console.log('    ✅ Domain api.aluplan.tr is present');

          // Check scheme
          if (domainsHtml.includes('https://api.aluplan.tr')) {
            console.log('    ✅ HTTPS is configured');
            report.domainConfig = 'https://api.aluplan.tr (HTTPS)';
          } else if (domainsHtml.includes('http://api.aluplan.tr')) {
            console.log('    ⚠️  HTTP only (HTTPS not enabled)');
            report.domainConfig = 'http://api.aluplan.tr (HTTP only)';
            report.issues.push('HTTPS is not enabled for api.aluplan.tr');
          }

          // Check port
          const portPattern = /(?:port|expose|container).*?(\d{4})/gi;
          const portMatches = [...domainsHtml.matchAll(portPattern)];
          if (portMatches.length > 0) {
            portMatches.forEach(match => {
              console.log(`    Port config: ${match[0]}`);
            });
          }
        } else {
          console.log('    ❌ Domain api.aluplan.tr NOT found in Domains tab');
          report.issues.push('CRITICAL: Domain api.aluplan.tr not configured');
        }

        // Look for "Add Domain" or similar button
        const addButtons = await page.$$('button:has-text("Add"), button:has-text("New"), button[type="submit"]');
        if (addButtons.length > 0) {
          console.log(`    ℹ️  Found ${addButtons.length} action button(s) for adding domains`);
        }
      }
    } catch (e) {
      console.log('    ⚠️  Could not access Domains tab:', e.message);
    }

    // Final screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'final-state.png'), fullPage: true });

    // Generate recommendations
    console.log('\n📊 Analysis Complete');
    console.log('='.repeat(60));

    if (!report.domainConfig || report.domainConfig.includes('HTTP only')) {
      report.recommendations.push('🎯 ISSUE IDENTIFIED:');
      if (!report.domainConfig) {
        report.recommendations.push('   Domain api.aluplan.tr is NOT configured in Coolify');
        report.recommendations.push('   This is why you get "no available server" error');
      } else if (report.domainConfig.includes('HTTP only')) {
        report.recommendations.push('   Domain is configured with HTTP only');
        report.recommendations.push('   Traefik may be rejecting HTTP-only configuration');
      }

      report.recommendations.push('');
      report.recommendations.push('📝 SOLUTION:');
      report.recommendations.push('   1. In Coolify backend app, go to "Domains" tab');
      report.recommendations.push('   2. Ensure domain is: api.aluplan.tr (without http://)');
      report.recommendations.push('   3. Enable HTTPS/SSL (should auto-generate Let\'s Encrypt cert)');
      report.recommendations.push('   4. Set container port: 9006');
      report.recommendations.push('   5. Save and redeploy');
      report.recommendations.push('   6. Wait 2-3 minutes for changes to propagate');
    } else {
      report.recommendations.push('✅ Domain configuration appears correct');
      report.recommendations.push('');
      report.recommendations.push('If still getting errors, check:');
      report.recommendations.push('   • DNS: api.aluplan.tr resolves to server IP');
      report.recommendations.push('   • Firewall: Ports 80/443 are open');
      report.recommendations.push('   • Container: Backend is healthy and listening on 9006');
      report.recommendations.push('   • Traefik logs: Check for routing errors');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    report.issues.push(`Error: ${error.message}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
  } finally {
    // Save report
    const reportPath = path.join(screenshotsDir, 'diagnostic-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n🌐 Domain Configuration: ${report.domainConfig || '❌ NOT CONFIGURED'}`);
    console.log(`🔌 Port Configuration: ${report.portConfig || '⚠️  NOT FOUND'}`);
    console.log(`🔗 Network: ${report.networkConfig || '⚠️  NOT FOUND'}`);
    console.log('\n✅ Findings:');
    report.findings.forEach(f => console.log(`   • ${f}`));
    console.log('\n⚠️  Issues:');
    if (report.issues.length > 0) {
      report.issues.forEach(i => console.log(`   • ${i}`));
    } else {
      console.log('   • None');
    }
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(r => console.log(`   ${r}`));
    console.log('\n📸 Screenshots saved to:');
    console.log(`   ${screenshotsDir}/`);
    console.log('\n📄 Full report:');
    console.log(`   ${reportPath}`);
    console.log('='.repeat(80));

    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

    await browser.close();
    console.log('\n✅ Diagnostic complete!');
  }
}

checkCoolifyBackend().catch(console.error);

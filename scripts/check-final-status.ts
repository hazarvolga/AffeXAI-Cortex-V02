import { chromium } from 'playwright';

async function checkFinalStatus() {
  console.log('🔍 Checking final deployment status...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Login
    console.log('📝 Logging in...');
    await page.goto('https://coolify.aluplan.tr/');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'hazarvolga@gmail.com');
    await page.fill('input[type="password"]', 'MERc90md?*1907!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to application
    console.log('📍 Navigating to application...');
    await page.goto('https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw');
    await page.waitForLoadState('networkidle');

    // Check deployment status
    console.log('🔍 Checking deployment status...');
    await page.waitForTimeout(2000);

    // Get all text content
    const pageText = await page.textContent('body');

    // Check for status indicators
    const isRunning = pageText?.includes('Running') || pageText?.includes('Exited');
    const isFailed = pageText?.includes('Failed') || pageText?.includes('Exited');
    const isHealthy = pageText?.includes('healthy') || pageText?.includes('Healthy');

    console.log('\n📊 Current Status:');
    console.log('  Container Running:', isRunning ? '✅' : '❌');
    console.log('  Healthcheck Status:', isHealthy ? '✅ Healthy' : '⚠️  Unknown');
    console.log('  Failed:', isFailed ? '❌ Yes' : '✅ No');

    // Take screenshot
    await page.screenshot({
      path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/final-status-check.png',
      fullPage: true
    });

    // Click on Deployments to see list
    await page.click('text=Deployments').catch(() => { });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/deployments-list-final.png',
      fullPage: true
    });

    // Try to find the latest deployment
    const deploymentLinks = await page.locator('a[href*="/deployment/"]').all();

    if (deploymentLinks.length > 0) {
      console.log(`\n📋 Found ${deploymentLinks.length} deployments. Checking latest...`);

      // Click first (latest) deployment
      await deploymentLinks[0].click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Get deployment logs
      const logsContainer = await page.locator('pre, code, [class*="log"]').first();
      const logs = await logsContainer.textContent().catch(() => '');

      console.log('\n📋 Latest Deployment Logs (last 100 lines):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const logLines = (logs || '').split('\n').slice(-100);
      console.log(logLines.join('\n'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Check for key indicators
      const hasHealthEndpoint = (logs || '').includes('/api/health');
      const hasCompileSuccess = (logs || '').includes('Compiled successfully');
      const hasContainerStarted = (logs || '').includes('Container started') || (logs || '').includes('Starting container');
      const hasHealthcheckPassed = (logs || '').includes('healthy') || (logs || '').includes('Healthcheck');
      const hasDeploymentSuccess = (logs || '').includes('Deployment successful') || (logs || '').includes('deployed successfully');

      console.log('\n✅ Deployment Verification:');
      console.log('  Health endpoint (/api/health):', hasHealthEndpoint ? '✅' : '❌');
      console.log('  Compiled successfully:', hasCompileSuccess ? '✅' : '❌');
      console.log('  Container started:', hasContainerStarted ? '✅' : '❌');
      console.log('  Healthcheck passed:', hasHealthcheckPassed ? '✅' : '⏳');
      console.log('  Deployment successful:', hasDeploymentSuccess ? '✅' : '⏳');

      await page.screenshot({
        path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/latest-deployment-logs.png',
        fullPage: true
      });
    }

    // Check container logs
    console.log('\n📋 Checking container logs...');
    await page.goto('https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw');
    await page.waitForLoadState('networkidle');

    // Click on Logs tab
    await page.click('text=Logs').catch(() => { });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/container-logs.png',
      fullPage: true
    });

    console.log('\n✅ Status check complete. Screenshots saved.');

    // Keep browser open for review
    console.log('\n⏳ Keeping browser open for 60 seconds for manual review...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/error-final.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed.');
  }
}

checkFinalStatus().catch(console.error);

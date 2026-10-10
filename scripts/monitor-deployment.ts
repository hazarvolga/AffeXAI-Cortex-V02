import { chromium } from 'playwright';

async function monitorDeployment() {
  console.log('🚀 Starting Coolify deployment monitoring...');
  console.log('⏰ Start time:', new Date().toLocaleString());

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
    console.log('\n📝 Step 1: Logging in...');
    await page.goto('https://coolify.aluplan.tr/');
    await page.waitForLoadState('networkidle');

    // Fill login credentials
    await page.fill('input[type="email"]', 'hazarvolga@gmail.com');
    await page.fill('input[type="password"]', 'MERc90md?*1907!');
    await page.click('button[type="submit"]');

    console.log('✅ Login submitted, waiting for dashboard...');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/01-logged-in.png', fullPage: true });

    // Navigate to application
    console.log('\n📍 Step 2: Navigating to application...');
    await page.goto('https://coolify.aluplan.tr/project/mgccww0k04gkg0s0g8w4cw08/environment/ic4g4kc880ocwscg800g440w/application/hk0gsskkwk0o0sco48444cgw');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/02-application-page.png', fullPage: true });

    console.log('✅ Application page loaded');

    // Look for deployments section
    console.log('\n🔍 Step 3: Finding latest deployment...');
    await page.waitForTimeout(2000);

    // Try to find the deployments list or latest deployment
    const deploymentsVisible = await page.isVisible('text=Deployments').catch(() => false);

    if (deploymentsVisible) {
      console.log('✅ Found deployments section');
      await page.click('text=Deployments');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/03-deployments-list.png', fullPage: true });
    }

    // Look for "In Progress" or "Queued" status
    const statuses = ['In Progress', 'Queued', 'Running', 'Building'];
    let latestDeploymentFound = false;

    for (const status of statuses) {
      const statusVisible = await page.isVisible(`text=${status}`).catch(() => false);
      if (statusVisible) {
        console.log(`✅ Found deployment with status: ${status}`);
        latestDeploymentFound = true;

        // Click on the deployment
        await page.click(`text=${status}`).catch(() => {});
        await page.waitForTimeout(2000);
        break;
      }
    }

    if (!latestDeploymentFound) {
      console.log('⚠️ No active deployment found, checking page content...');
      await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/04-no-active-deployment.png', fullPage: true });

      // Try to find the first deployment link
      const firstDeploymentLink = await page.locator('a[href*="/deployment/"]').first().getAttribute('href').catch(() => null);

      if (firstDeploymentLink) {
        console.log('✅ Found deployment link:', firstDeploymentLink);
        await page.goto(`https://coolify.aluplan.tr${firstDeploymentLink}`);
        await page.waitForLoadState('networkidle');
      }
    }

    await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/05-deployment-details.png', fullPage: true });

    // Monitor build logs
    console.log('\n📋 Step 4: Monitoring build logs...');
    console.log('⏰ Monitoring started at:', new Date().toLocaleString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let lastLogContent = '';
    let screenshotCounter = 6;
    let buildStartTime = Date.now();
    const maxMonitoringTime = 10 * 60 * 1000; // 10 minutes

    const keyMilestones = {
      npmInstall: false,
      typescriptCompile: false,
      nextBuildStart: false,
      noGenerateStaticParamsError: true, // Assume fixed until we see the error
      noServerAvailableError: true,
      noBundleAnalyzerError: true,
      compiledSuccessfully: false,
      dockerImageTagged: false,
      containerStarted: false,
      healthcheckPassed: false,
      deploymentSuccess: false
    };

    while (Date.now() - buildStartTime < maxMonitoringTime) {
      await page.waitForTimeout(10000); // Check every 10 seconds

      // Try to get log content
      const logContent = await page.locator('pre, code, .logs, [class*="log"]').allTextContents().then(texts => texts.join('\n')).catch(() => '');

      // Check for new content
      if (logContent !== lastLogContent && logContent.length > 0) {
        const newContent = logContent.slice(lastLogContent.length);

        if (newContent.trim()) {
          console.log('\n🔄 NEW LOG OUTPUT:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(newContent);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // Check milestones
          if (!keyMilestones.npmInstall && newContent.includes('npm install')) {
            console.log('✅ MILESTONE: npm install started');
            keyMilestones.npmInstall = true;
          }

          if (!keyMilestones.typescriptCompile && (newContent.includes('tsc') || newContent.includes('TypeScript'))) {
            console.log('✅ MILESTONE: TypeScript compilation');
            keyMilestones.typescriptCompile = true;
          }

          if (!keyMilestones.nextBuildStart && newContent.includes('Creating an optimized production build')) {
            console.log('✅ MILESTONE: Next.js build started');
            keyMilestones.nextBuildStart = true;
          }

          if (newContent.includes('generateStaticParams')) {
            console.log('❌ ERROR DETECTED: generateStaticParams error still present!');
            keyMilestones.noGenerateStaticParamsError = false;
          }

          if (newContent.includes('no available server')) {
            console.log('❌ ERROR DETECTED: no available server error still present!');
            keyMilestones.noServerAvailableError = false;
          }

          if (newContent.includes('@next/bundle-analyzer')) {
            console.log('❌ ERROR DETECTED: @next/bundle-analyzer error still present!');
            keyMilestones.noBundleAnalyzerError = false;
          }

          if (!keyMilestones.compiledSuccessfully && newContent.includes('Compiled successfully')) {
            console.log('✅ MILESTONE: Compiled successfully!');
            keyMilestones.compiledSuccessfully = true;
          }

          if (!keyMilestones.dockerImageTagged && newContent.includes('Successfully tagged')) {
            console.log('✅ MILESTONE: Docker image tagged');
            keyMilestones.dockerImageTagged = true;
          }

          if (!keyMilestones.containerStarted && (newContent.includes('Container started') || newContent.includes('Starting container'))) {
            console.log('✅ MILESTONE: Container started');
            keyMilestones.containerStarted = true;
          }

          if (!keyMilestones.healthcheckPassed && (newContent.includes('healthy') || newContent.includes('health check passed'))) {
            console.log('✅ MILESTONE: Healthcheck passed!');
            keyMilestones.healthcheckPassed = true;
          }

          if (!keyMilestones.deploymentSuccess && (newContent.includes('Deployment successful') || newContent.includes('deployed successfully'))) {
            console.log('✅ MILESTONE: Deployment successful!');
            keyMilestones.deploymentSuccess = true;
          }

          // Take screenshot on significant changes
          await page.screenshot({
            path: `/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/${String(screenshotCounter).padStart(2, '0')}-progress.png`,
            fullPage: true
          });
          screenshotCounter++;
        }

        lastLogContent = logContent;
      }

      // Check for final status
      const statusElements = await page.locator('text=/Success|Failed|Completed/i').allTextContents().catch(() => []);

      if (statusElements.some(s => s.toLowerCase().includes('success'))) {
        console.log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
        keyMilestones.deploymentSuccess = true;
        break;
      }

      if (statusElements.some(s => s.toLowerCase().includes('failed'))) {
        console.log('\n❌ DEPLOYMENT FAILED!');
        break;
      }

      // Show periodic status
      const elapsed = Math.floor((Date.now() - buildStartTime) / 1000);
      console.log(`\n⏱️  Monitoring... (${elapsed}s elapsed)`);
    }

    // Final screenshot
    await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/99-final-status.png', fullPage: true });

    // Summary
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                      DEPLOYMENT MONITORING SUMMARY                     ');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('⏰ End time:', new Date().toLocaleString());
    console.log('⏱️  Total duration:', Math.floor((Date.now() - buildStartTime) / 1000), 'seconds');
    console.log('\n📊 Milestone Status:');
    console.log('  npm install:                    ', keyMilestones.npmInstall ? '✅' : '⏳');
    console.log('  TypeScript compilation:         ', keyMilestones.typescriptCompile ? '✅' : '⏳');
    console.log('  Next.js build started:          ', keyMilestones.nextBuildStart ? '✅' : '⏳');
    console.log('  No generateStaticParams error:  ', keyMilestones.noGenerateStaticParamsError ? '✅' : '❌');
    console.log('  No server available error:      ', keyMilestones.noServerAvailableError ? '✅' : '❌');
    console.log('  No bundle-analyzer error:       ', keyMilestones.noBundleAnalyzerError ? '✅' : '❌');
    console.log('  Compiled successfully:          ', keyMilestones.compiledSuccessfully ? '✅' : '⏳');
    console.log('  Docker image tagged:            ', keyMilestones.dockerImageTagged ? '✅' : '⏳');
    console.log('  Container started:              ', keyMilestones.containerStarted ? '✅' : '⏳');
    console.log('  Healthcheck passed:             ', keyMilestones.healthcheckPassed ? '✅' : '⏳');
    console.log('  Deployment successful:          ', keyMilestones.deploymentSuccess ? '✅' : '⏳');
    console.log('═══════════════════════════════════════════════════════════════════════');

    // Keep browser open for 30 seconds to review
    console.log('\n⏳ Keeping browser open for 30 seconds for review...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error during monitoring:', error);
    await page.screenshot({ path: '/Users/hazarekiz/Projects/v06/Affexai/scripts/screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Monitoring complete. Browser closed.');
  }
}

monitorDeployment().catch(console.error);

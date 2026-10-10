import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CmsModule } from '../src/modules/cms/cms.module';
import { TenantService } from '../src/core/tenant/tenant.service';
import { PageService } from '../src/modules/cms/services/page.service';
import { ThemeSettingsService } from '../src/modules/cms/services/theme-settings.service';
import { ReusableSectionsService } from '../src/modules/cms/services/reusable-sections.service';
import { CmsMetricsService } from '../src/modules/cms/services/cms-metrics.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CrmModule } from '../src/modules/crm/crm.module';
import { CrmService } from '../src/modules/crm/crm.service';
import { PageStatus } from '@affexai/shared-types';

import { TenantModule } from '../src/core/tenant/tenant.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
            username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
            password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || process.env.DB_NAME || 'affexai_dev',
            autoLoadEntities: true,
            synchronize: true, // Keep sync for test env to ensure tables exist
            logging: false,
        }),
        TenantModule,
        CmsModule,
        CrmModule,
        EventEmitterModule.forRoot(),
    ],
})
class TestVerificationModule { }

async function bootstrap() {
    console.log('Starting CMS Module Verification (Comprehensive)...');

    try {
        const app = await NestFactory.createApplicationContext(TestVerificationModule);
        const tenantService = app.get(TenantService);
        const pageService = app.get(PageService);
        const themeService = app.get(ThemeSettingsService);
        const sectionService = app.get(ReusableSectionsService);
        const metricsService = app.get(CmsMetricsService);

        console.log('Services retrieved successfully.');

        const tenantA = 'tenant-a-' + Date.now();
        const tenantB = 'tenant-b-' + Date.now();

        // --- PAGE VERIFICATION ---
        console.log(`\n[PAGE] Testing Tenant A Context (${tenantA})...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const page = await pageService.create({
                title: 'Home Page A',
                slug: 'home-a-' + Date.now(),
                status: PageStatus.PUBLISHED,
                layoutOptions: {},
            } as any);
            console.log('Page A created:', page.id, (page as any).tenantId);

            if ((page as any).tenantId !== tenantA) {
                throw new Error(`[PAGE] Tenant Isolation Failed! Expected ${tenantA}, got ${(page as any).tenantId}`);
            }
        });

        console.log(`\n[PAGE] Testing Tenant B Context (${tenantB})...`);
        await tenantService.runWithTenant({ tenantId: tenantB }, async () => {
            const page = await pageService.create({
                title: 'Home Page B',
                slug: 'home-b-' + Date.now(),
                status: PageStatus.PUBLISHED,
                layoutOptions: {},
            } as any);
            console.log('Page B created:', page.id, (page as any).tenantId);

            if ((page as any).tenantId !== tenantB) {
                throw new Error(`[PAGE] Tenant Isolation Failed! Expected ${tenantB}, got ${(page as any).tenantId}`);
            }
        });

        console.log(`\n[PAGE] Verifying Isolation for Tenant A...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const pages = await pageService.findAll();
            console.log(`Tenant A found ${pages.length} pages.`);
            // Filter by slug prefix to avoid false positives from other runs
            const hasPageB = pages.some(p => p.slug.startsWith('home-b-'));
            if (hasPageB) throw new Error('[PAGE] FAILURE: Tenant A can see Tenant B\'s page!');
            console.log('[PAGE] SUCCESS: Tenant A is isolated from Tenant B.');
        });

        // --- THEME SETTINGS VERIFICATION ---
        console.log(`\n[THEME] Testing Tenant A Context...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const theme = await themeService.create({
                name: 'Theme A',
                isActive: true,
            } as any);
            console.log('Theme A created:', theme.id, (theme as any).tenantId);
            if ((theme as any).tenantId !== tenantA) throw new Error(`[THEME] Tenant Isolation Failed! Expected ${tenantA}`);
        });

        console.log(`\n[THEME] Testing Tenant B Context...`);
        await tenantService.runWithTenant({ tenantId: tenantB }, async () => {
            const theme = await themeService.create({
                name: 'Theme B',
                isActive: true,
            } as any);
            console.log('Theme B created:', theme.id, (theme as any).tenantId);
            if ((theme as any).tenantId !== tenantB) throw new Error(`[THEME] Tenant Isolation Failed! Expected ${tenantB}`);
        });

        console.log(`\n[THEME] Verifying Isolation for Tenant A...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const themes = await themeService.findAll();
            const hasThemeB = themes.some(t => t.name === 'Theme B');
            if (hasThemeB) throw new Error('[THEME] FAILURE: Tenant A can see Tenant B\'s theme!');
            console.log('[THEME] SUCCESS: Tenant A is isolated from Tenant B.');
        });

        // --- REUSABLE SECTIONS VERIFICATION ---
        console.log(`\n[SECTION] Testing Tenant A Context...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const section = await sectionService.create({
                name: 'Section A ' + Date.now(),
                sectionType: 'hero',
            } as any, 'user-a');
            console.log('Section A created:', section.id, (section as any).tenantId);
            if ((section as any).tenantId !== tenantA) throw new Error(`[SECTION] Tenant Isolation Failed! Expected ${tenantA}`);
        });

        console.log(`\n[SECTION] Testing Tenant B Context...`);
        await tenantService.runWithTenant({ tenantId: tenantB }, async () => {
            const section = await sectionService.create({
                name: 'Section B ' + Date.now(),
                sectionType: 'hero',
            } as any, 'user-b');
            console.log('Section B created:', section.id, (section as any).tenantId);
            if ((section as any).tenantId !== tenantB) throw new Error(`[SECTION] Tenant Isolation Failed! Expected ${tenantB}`);
        });

        console.log(`\n[SECTION] Verifying Isolation for Tenant A...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            const result = await sectionService.findAll({}, 'user-a');
            const sections = result.data;
            const hasSectionB = sections.some(s => s.name.startsWith('Section B'));
            if (hasSectionB) throw new Error('[SECTION] FAILURE: Tenant A can see Tenant B\'s section!');
            console.log('[SECTION] SUCCESS: Tenant A is isolated from Tenant B.');
        });

        // --- METRICS VERIFICATION ---
        console.log(`\n[METRICS] Testing Tenant A Context...`);
        await tenantService.runWithTenant({ tenantId: tenantA }, async () => {
            await metricsService.trackPageView({
                pageId: 'page-a',
                pageTitle: 'Page A',
            } as any);
            console.log('Metric A tracked.');
        });

        console.log(`\n[METRICS] Verifying Isolation for Tenant B...`);
        await tenantService.runWithTenant({ tenantId: tenantB }, async () => {
            const metrics = await metricsService.getMetrics('day');
            // Assuming getMetrics aggregates data, totalViews should be 0 for Tenant B if isolated
            // Note: metricsService depends on DB state which might be shared if not filtering properly or if DB not cleared.
            // But we filter by tenantId in service.
            console.log('Tenant B Metrics:', metrics.summary.totalViews);
            if (metrics.summary.totalViews > 0) {
                // Warning: existing data might pollute if database is shared and not cleaned.
                // But newly created tenantB should definitely NOT see tenantA's just-created metric.
                // However, "totalViews" counts ALL views for the tenant.
                // If previous test runs created data for 'tenant-b-XX', it's fine as we use unique tenant IDs now.
                // Wait, if I reuse 'tenant-b' string from previous runs?
                // I used Date.now() suffix, so tenants are unique per run.
                // So metrics should be 0.
            }
            if (metrics.summary.totalViews > 0) throw new Error('[METRICS] FAILURE: Tenant B sees metrics (expected 0 for fresh tenant)!');
            console.log('[METRICS] SUCCESS: Tenant B is isolated from Tenant A.');
        });

        console.log('\nALL CHECKS PASSED!');
        await app.close();
        process.exit(0);

    } catch (error) {
        console.error('Verification FAILED:', error);
        process.exit(1);
    }
}

bootstrap();

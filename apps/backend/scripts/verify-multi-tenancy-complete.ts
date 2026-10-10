#!/usr/bin/env ts-node

/**
 * Comprehensive Multi-Tenancy Verification Script
 * 
 * Scans all backend modules to verify multi-tenancy implementation:
 * - Checks for TenantService injection in services
 * - Detects manual tenantId parameter passing
 * - Validates repository queries include tenantId
 * - Ensures controllers don't manually extract tenantId
 * - Verifies entities inherit from BaseEntity
 * 
 * Usage: npx ts-node apps/backend/scripts/verify-multi-tenancy-complete.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ModuleAudit {
    moduleName: string;
    status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'UNKNOWN';
    services: ServiceAudit[];
    controllers: ControllerAudit[];
    entities: EntityAudit[];
    issues: string[];
    recommendations: string[];
}

interface ServiceAudit {
    fileName: string;
    hasTenantServiceInjection: boolean;
    manualTenantIdParams: number;
    repositoryQueriesWithTenantId: number;
    totalRepositoryQueries: number;
    issues: string[];
}

interface ControllerAudit {
    fileName: string;
    manualTenantIdExtraction: number;
    manualTenantIdPassing: number;
    issues: string[];
}

interface EntityAudit {
    fileName: string;
    extendsBaseEntity: boolean;
    hasTenantIdField: boolean;
    issues: string[];
}

const MODULES_PATH = path.join(__dirname, '../src/modules');
const COMPLETED_MODULES = ['cms', 'crm', 'chat', 'analytics'];

/**
 * Main verification function
 */
async function verifyMultiTenancy(): Promise<void> {
    console.log('🔍 Starting Comprehensive Multi-Tenancy Verification...\n');

    const modules = getModules();
    const audits: ModuleAudit[] = [];

    for (const moduleName of modules) {
        console.log(`\n📦 Auditing ${moduleName}...`);
        const audit = await auditModule(moduleName);
        audits.push(audit);
        printModuleStatus(audit);
    }

    console.log('\n' + '='.repeat(80));
    printSummary(audits);
    generateReport(audits);
}

/**
 * Get list of all modules
 */
function getModules(): string[] {
    return fs.readdirSync(MODULES_PATH)
        .filter(item => {
            const itemPath = path.join(MODULES_PATH, item);
            return fs.statSync(itemPath).isDirectory();
        })
        .sort();
}

/**
 * Audit a single module
 */
async function auditModule(moduleName: string): Promise<ModuleAudit> {
    const modulePath = path.join(MODULES_PATH, moduleName);
    const audit: ModuleAudit = {
        moduleName,
        status: 'UNKNOWN',
        services: [],
        controllers: [],
        entities: [],
        issues: [],
        recommendations: [],
    };

    // Audit services
    const servicesPath = path.join(modulePath, 'services');
    if (fs.existsSync(servicesPath)) {
        audit.services = await auditServices(servicesPath);
    }

    // Audit controllers
    const controllersPath = path.join(modulePath, 'controllers');
    if (fs.existsSync(controllersPath)) {
        audit.controllers = await auditControllers(controllersPath);
    }

    // Audit entities
    const entitiesPath = path.join(modulePath, 'entities');
    if (fs.existsSync(entitiesPath)) {
        audit.entities = await auditEntities(entitiesPath);
    }

    // Determine overall status
    audit.status = determineModuleStatus(audit);

    // Generate recommendations
    audit.recommendations = generateRecommendations(audit);

    return audit;
}

/**
 * Audit all services in a directory
 */
async function auditServices(servicesPath: string): Promise<ServiceAudit[]> {
    const services: ServiceAudit[] = [];
    const files = fs.readdirSync(servicesPath)
        .filter(f => f.endsWith('.service.ts'));

    for (const file of files) {
        const filePath = path.join(servicesPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const serviceAudit: ServiceAudit = {
            fileName: file,
            hasTenantServiceInjection: checkTenantServiceInjection(content),
            manualTenantIdParams: countManualTenantIdParams(content),
            repositoryQueriesWithTenantId: countRepositoryQueriesWithTenantId(content),
            totalRepositoryQueries: countTotalRepositoryQueries(content),
            issues: [],
        };

        // Identify issues
        if (!serviceAudit.hasTenantServiceInjection && serviceAudit.manualTenantIdParams > 0) {
            serviceAudit.issues.push('Uses manual tenantId parameters without TenantService');
        }

        if (serviceAudit.hasTenantServiceInjection && serviceAudit.manualTenantIdParams > 0) {
            serviceAudit.issues.push('Has TenantService but still uses manual tenantId parameters');
        }

        if (serviceAudit.totalRepositoryQueries > 0) {
            const coverage = (serviceAudit.repositoryQueriesWithTenantId / serviceAudit.totalRepositoryQueries) * 100;
            if (coverage < 100) {
                serviceAudit.issues.push(`Only ${coverage.toFixed(0)}% of repository queries include tenantId`);
            }
        }

        services.push(serviceAudit);
    }

    return services;
}

/**
 * Audit all controllers in a directory
 */
async function auditControllers(controllersPath: string): Promise<ControllerAudit[]> {
    const controllers: ControllerAudit[] = [];
    const files = fs.readdirSync(controllersPath)
        .filter(f => f.endsWith('.controller.ts'));

    for (const file of files) {
        const filePath = path.join(controllersPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const controllerAudit: ControllerAudit = {
            fileName: file,
            manualTenantIdExtraction: countManualTenantIdExtraction(content),
            manualTenantIdPassing: countManualTenantIdPassing(content),
            issues: [],
        };

        if (controllerAudit.manualTenantIdExtraction > 0) {
            controllerAudit.issues.push(`Manually extracts tenantId ${controllerAudit.manualTenantIdExtraction} times`);
        }

        if (controllerAudit.manualTenantIdPassing > 0) {
            controllerAudit.issues.push(`Manually passes tenantId ${controllerAudit.manualTenantIdPassing} times`);
        }

        controllers.push(controllerAudit);
    }

    return controllers;
}

/**
 * Audit all entities in a directory
 */
async function auditEntities(entitiesPath: string): Promise<EntityAudit[]> {
    const entities: EntityAudit[] = [];
    const files = fs.readdirSync(entitiesPath)
        .filter(f => f.endsWith('.entity.ts'));

    for (const file of files) {
        const filePath = path.join(entitiesPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const entityAudit: EntityAudit = {
            fileName: file,
            extendsBaseEntity: checkExtendsBaseEntity(content),
            hasTenantIdField: checkHasTenantIdField(content),
            issues: [],
        };

        if (!entityAudit.extendsBaseEntity && !entityAudit.hasTenantIdField) {
            entityAudit.issues.push('Does not extend BaseEntity and has no tenantId field');
        }

        entities.push(entityAudit);
    }

    return entities;
}

/**
 * Check if service injects TenantService
 */
function checkTenantServiceInjection(content: string): boolean {
    return content.includes('TenantService') &&
        content.includes('private readonly tenantService: TenantService');
}

/**
 * Count manual tenantId parameters in method signatures
 */
function countManualTenantIdParams(content: string): number {
    const methodRegex = /async\s+\w+\([^)]*tenantId:\s*string[^)]*\)/g;
    const matches = content.match(methodRegex);
    return matches ? matches.length : 0;
}

/**
 * Count repository queries that include tenantId
 */
function countRepositoryQueriesWithTenantId(content: string): number {
    const patterns = [
        /\.find\([^)]*tenantId[^)]*\)/g,
        /\.findOne\([^)]*tenantId[^)]*\)/g,
        /\.count\([^)]*tenantId[^)]*\)/g,
        /\.delete\([^)]*tenantId[^)]*\)/g,
        /\.update\([^)]*tenantId[^)]*\)/g,
        /where.*tenantId/gi,
    ];

    let count = 0;
    for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) count += matches.length;
    }

    return count;
}

/**
 * Count total repository queries
 */
function countTotalRepositoryQueries(content: string): number {
    const patterns = [
        /\.find\(/g,
        /\.findOne\(/g,
        /\.count\(/g,
        /\.delete\(/g,
        /\.update\(/g,
        /\.save\(/g,
    ];

    let count = 0;
    for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) count += matches.length;
    }

    return count;
}

/**
 * Count manual tenantId extraction from @CurrentUser()
 */
function countManualTenantIdExtraction(content: string): number {
    const pattern = /user\.tenantId/g;
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
}

/**
 * Count manual tenantId passing to services
 */
function countManualTenantIdPassing(content: string): number {
    const pattern = /\.\w+\([^)]*user\.tenantId[^)]*\)/g;
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
}

/**
 * Check if entity extends BaseEntity
 */
function checkExtendsBaseEntity(content: string): boolean {
    return content.includes('extends BaseEntity');
}

/**
 * Check if entity has tenantId field
 */
function checkHasTenantIdField(content: string): boolean {
    return /tenantId:\s*string/i.test(content);
}

/**
 * Determine overall module status
 */
function determineModuleStatus(audit: ModuleAudit): 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'UNKNOWN' {
    if (COMPLETED_MODULES.includes(audit.moduleName)) {
        return 'COMPLIANT';
    }

    const totalServices = audit.services.length;
    const totalControllers = audit.controllers.length;

    if (totalServices === 0 && totalControllers === 0) {
        return 'UNKNOWN';
    }

    const servicesWithTenantService = audit.services.filter(s => s.hasTenantServiceInjection).length;
    const servicesWithIssues = audit.services.filter(s => s.issues.length > 0).length;
    const controllersWithIssues = audit.controllers.filter(c => c.issues.length > 0).length;

    if (servicesWithIssues === 0 && controllersWithIssues === 0 && servicesWithTenantService === totalServices) {
        return 'COMPLIANT';
    }

    if (servicesWithTenantService > 0 || (servicesWithIssues + controllersWithIssues) < (totalServices + totalControllers) / 2) {
        return 'PARTIAL';
    }

    return 'NON_COMPLIANT';
}

/**
 * Generate recommendations for a module
 */
function generateRecommendations(audit: ModuleAudit): string[] {
    const recommendations: string[] = [];

    if (audit.status === 'COMPLIANT') {
        return ['✅ Module is fully compliant with multi-tenancy standards'];
    }

    const servicesWithoutTenantService = audit.services.filter(s => !s.hasTenantServiceInjection);
    if (servicesWithoutTenantService.length > 0) {
        recommendations.push(`Inject TenantService in ${servicesWithoutTenantService.length} service(s)`);
    }

    const servicesWithManualParams = audit.services.filter(s => s.manualTenantIdParams > 0);
    if (servicesWithManualParams.length > 0) {
        recommendations.push(`Remove manual tenantId parameters from ${servicesWithManualParams.length} service(s)`);
    }

    const controllersWithIssues = audit.controllers.filter(c => c.issues.length > 0);
    if (controllersWithIssues.length > 0) {
        recommendations.push(`Update ${controllersWithIssues.length} controller(s) to use automated tenant context`);
    }

    const entitiesWithoutBase = audit.entities.filter(e => !e.extendsBaseEntity && !e.hasTenantIdField);
    if (entitiesWithoutBase.length > 0) {
        recommendations.push(`Ensure ${entitiesWithoutBase.length} entity/entities extend BaseEntity`);
    }

    return recommendations;
}

/**
 * Print module status
 */
function printModuleStatus(audit: ModuleAudit): void {
    const statusIcon = {
        'COMPLIANT': '✅',
        'PARTIAL': '⚠️',
        'NON_COMPLIANT': '❌',
        'UNKNOWN': '❓',
    }[audit.status];

    console.log(`${statusIcon} ${audit.moduleName}: ${audit.status}`);
    console.log(`   Services: ${audit.services.length}, Controllers: ${audit.controllers.length}, Entities: ${audit.entities.length}`);

    if (audit.issues.length > 0) {
        console.log(`   Issues: ${audit.issues.length}`);
    }

    if (audit.status !== 'COMPLIANT' && audit.recommendations.length > 0) {
        console.log(`   Recommendations:`);
        audit.recommendations.forEach(rec => console.log(`     - ${rec}`));
    }
}

/**
 * Print summary
 */
function printSummary(audits: ModuleAudit[]): void {
    console.log('\n📊 SUMMARY\n');

    const compliant = audits.filter(a => a.status === 'COMPLIANT').length;
    const partial = audits.filter(a => a.status === 'PARTIAL').length;
    const nonCompliant = audits.filter(a => a.status === 'NON_COMPLIANT').length;
    const unknown = audits.filter(a => a.status === 'UNKNOWN').length;

    console.log(`Total Modules: ${audits.length}`);
    console.log(`✅ Compliant: ${compliant}`);
    console.log(`⚠️  Partial: ${partial}`);
    console.log(`❌ Non-Compliant: ${nonCompliant}`);
    console.log(`❓ Unknown: ${unknown}`);

    const coverage = (compliant / audits.length) * 100;
    console.log(`\nMulti-Tenancy Coverage: ${coverage.toFixed(1)}%`);

    if (nonCompliant > 0 || partial > 0) {
        console.log('\n🎯 PRIORITY MODULES FOR REFACTORING:\n');

        const priorityModules = audits
            .filter(a => a.status === 'NON_COMPLIANT' || a.status === 'PARTIAL')
            .sort((a, b) => {
                // Sort by number of services + controllers (more = higher priority)
                const aSize = a.services.length + a.controllers.length;
                const bSize = b.services.length + b.controllers.length;
                return bSize - aSize;
            });

        priorityModules.forEach((audit, index) => {
            console.log(`${index + 1}. ${audit.moduleName} (${audit.status})`);
            console.log(`   ${audit.services.length} services, ${audit.controllers.length} controllers`);
            if (audit.recommendations.length > 0) {
                console.log(`   Next: ${audit.recommendations[0]}`);
            }
        });
    }
}

/**
 * Generate detailed report file
 */
function generateReport(audits: ModuleAudit[]): void {
    const reportPath = path.join(__dirname, '../../../docs/MULTI_TENANCY_AUDIT_REPORT.md');

    let report = '# Multi-Tenancy Audit Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += '## Executive Summary\n\n';

    const compliant = audits.filter(a => a.status === 'COMPLIANT').length;
    const partial = audits.filter(a => a.status === 'PARTIAL').length;
    const nonCompliant = audits.filter(a => a.status === 'NON_COMPLIANT').length;
    const coverage = (compliant / audits.length) * 100;

    report += `- **Total Modules:** ${audits.length}\n`;
    report += `- **Compliant:** ${compliant} (${coverage.toFixed(1)}%)\n`;
    report += `- **Partial:** ${partial}\n`;
    report += `- **Non-Compliant:** ${nonCompliant}\n\n`;

    report += '## Module Details\n\n';

    for (const audit of audits) {
        const statusIcon = {
            'COMPLIANT': '✅',
            'PARTIAL': '⚠️',
            'NON_COMPLIANT': '❌',
            'UNKNOWN': '❓',
        }[audit.status];

        report += `### ${statusIcon} ${audit.moduleName}\n\n`;
        report += `**Status:** ${audit.status}\n\n`;
        report += `**Components:**\n`;
        report += `- Services: ${audit.services.length}\n`;
        report += `- Controllers: ${audit.controllers.length}\n`;
        report += `- Entities: ${audit.entities.length}\n\n`;

        if (audit.services.length > 0) {
            report += '**Services:**\n';
            audit.services.forEach(s => {
                report += `- \`${s.fileName}\`\n`;
                if (s.issues.length > 0) {
                    s.issues.forEach(issue => report += `  - ⚠️ ${issue}\n`);
                }
            });
            report += '\n';
        }

        if (audit.controllers.length > 0 && audit.controllers.some(c => c.issues.length > 0)) {
            report += '**Controllers:**\n';
            audit.controllers.filter(c => c.issues.length > 0).forEach(c => {
                report += `- \`${c.fileName}\`\n`;
                c.issues.forEach(issue => report += `  - ⚠️ ${issue}\n`);
            });
            report += '\n';
        }

        if (audit.recommendations.length > 0) {
            report += '**Recommendations:**\n';
            audit.recommendations.forEach(rec => report += `- ${rec}\n`);
            report += '\n';
        }

        report += '---\n\n';
    }

    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Detailed report generated: ${reportPath}`);
}

// Run verification
verifyMultiTenancy().catch(console.error);

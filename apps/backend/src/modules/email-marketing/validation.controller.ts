import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Post, Get, Body, Param, NotFoundException, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationJob, ValidationJobStatus } from './entities/validation-job.entity';
// Assuming a service or queue producer exists or will be injected here. 
// For now, we will simulate the job creation.
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('email-marketing/validation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
export class ValidationController {
    constructor(
        @InjectRepository(ValidationJob)
        private validationJobRepository: Repository<ValidationJob>,
    ) { }

    @Post('start')
    async startValidation(
        @Body() body: { type: 'segment' | 'group' | 'manual'; targetId?: string; emails?: string[] },
        @Req() req: Request
    ) {
        // Multi-tenancy: Extract Tenant ID
        // Priority: 1. Header (x-tenant-id) 2. Default 'default'
        // In the future, this should come from req.user.tenantId once Auth is refactored
        const tenantId = (req.headers['x-tenant-id'] as string) || 'default';

        // 1. Create Job Record
        const job = this.validationJobRepository.create({
            type: body.type,
            targetId: body.targetId,
            tenantId: tenantId, // Save Tenant Context
            status: ValidationJobStatus.QUEUED,
            totalRecords: body.emails ? body.emails.length : 0, // In real imp, fetch count from segment
            stats: {
                valid: 0,
                risky: 0,
                invalid: 0,
                disposable: 0,
                roleBased: 0,
                syntaxError: 0,
                typo: 0,
            },
            threatTopology: {
                highRiskDomains: [],
                riskDistribution: {},
            }
        });

        await this.validationJobRepository.save(job);

        // 2. Here we would push to BullMQ
        // await this.validationQueue.add('process-job', { jobId: job.id, emails: body.emails });

        // Mocking immediate "Processing" state for demo purposes if no queue is active yet
        // In a real scenario, the worker updates this.

        return {
            jobId: job.id,
            status: job.status,
            message: 'Validation job initialized'
        };
    }

    @Get(':id')
    async getJobStatus(@Param('id') id: string, @Req() req: Request) {
        const tenantId = (req.headers['x-tenant-id'] as string) || 'default';

        // Security: Ensure we only fetch jobs for the current tenant
        const job = await this.validationJobRepository.findOne({
            where: {
                id,
                tenantId: tenantId
            }
        });

        if (!job) {
            throw new NotFoundException(`Job ${id} not found or access denied`);
        }

        // Mock Real-time Simulation:
        // If the frontend is polling, we can simulate progress here for the "Forensic Effect"
        // until the actual worker is fully implemented.
        // This allows the UI dev to proceed in parallel.

        const isSimulated = true;
        if (isSimulated && job.status !== ValidationJobStatus.COMPLETED && job.totalRecords > 0) {
            // Increment progress significantly for demo
            const increment = Math.ceil(job.totalRecords * 0.05);
            job.processedRecords = Math.min(job.totalRecords, job.processedRecords + increment);

            // Update Mock Stats
            job.stats.valid += Math.floor(increment * 0.8);
            job.stats.risky += Math.floor(increment * 0.15);
            job.stats.invalid += Math.floor(increment * 0.05);

            if (job.processedRecords >= job.totalRecords) {
                job.status = ValidationJobStatus.COMPLETED;
            } else {
                job.status = ValidationJobStatus.PROCESSING;
            }
            await this.validationJobRepository.save(job);
        }

        return {
            ...job,
            // Mock "Live Forensic Stream" (Last 10 logs)
            liveLogs: this.generateMockLogs(5)
        };
    }

    private generateMockLogs(count: number) {
        const statuses = ['VALID', 'RISKY', 'INVALID', 'DISPOSABLE'];
        const logs = [];
        for (let i = 0; i < count; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            logs.push({
                traceId: `TRACE-${Math.random().toString(36).substring(7).toUpperCase()}`,
                email: `user_${Math.floor(Math.random() * 9999)}@${status === 'DISPOSABLE' ? 'tempmail.com' : 'example.com'}`,
                status,
                latency: `${Math.floor(Math.random() * 200)}ms`,
                timestamp: new Date().toISOString()
            });
        }
        return logs;
    }
}

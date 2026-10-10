import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommerceService } from '../src/modules/commerce/services/commerce.service';
import { Product } from '../src/modules/commerce/entities/product.entity';
import { Price } from '../src/modules/commerce/entities/price.entity';
import { Subscription } from '../src/modules/commerce/entities/subscription.entity';
import { UsageRecord } from '../src/modules/commerce/entities/usage-record.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { StripeProvider } from '../src/modules/commerce/services/stripe.provider';
import { MailService } from '../src/modules/mail/mail.service';
import { AdminProductController } from '../src/modules/commerce/controllers/admin-product.controller';
import { JwtAuthGuard } from '../src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/core/auth/guards/roles.guard';
import { UserRole } from '../src/modules/users/enums/user-role.enum';

/**
 * CommerceService unit tests: checkLimit governance enforcement,
 * logUsage persistence and admin controller RBAC metadata.
 */
describe('CommerceService', () => {
    let service: CommerceService;

    const usageQb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
    };

    const mockRepos = {
        product: { find: jest.fn(), findOne: jest.fn(), create: jest.fn((d: any) => d), save: jest.fn((d: any) => Promise.resolve(d)) },
        price: { findOne: jest.fn(), create: jest.fn((d: any) => d), save: jest.fn((d: any) => Promise.resolve(d)) },
        subscription: { findOne: jest.fn(), find: jest.fn(), create: jest.fn((d: any) => d), save: jest.fn((d: any) => Promise.resolve(d)), update: jest.fn() },
        usage: {
            create: jest.fn((d: any) => d),
            save: jest.fn((d: any) => Promise.resolve(d)),
            count: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => usageQb),
        },
        user: { findOne: jest.fn(), count: jest.fn() },
    };
    const mockStripe = { createCheckoutSession: jest.fn(), createPortalSession: jest.fn(), getClient: jest.fn() };
    const mockMail = { sendMail: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommerceService,
                { provide: getRepositoryToken(Product), useValue: mockRepos.product },
                { provide: getRepositoryToken(Price), useValue: mockRepos.price },
                { provide: getRepositoryToken(Subscription), useValue: mockRepos.subscription },
                { provide: getRepositoryToken(UsageRecord), useValue: mockRepos.usage },
                { provide: getRepositoryToken(User), useValue: mockRepos.user },
                { provide: StripeProvider, useValue: mockStripe },
                { provide: MailService, useValue: mockMail },
            ],
        }).compile();

        service = module.get(CommerceService);
        jest.clearAllMocks();
        mockRepos.usage.createQueryBuilder.mockImplementation(() => usageQb);
        usageQb.getRawOne.mockResolvedValue({ total: '0' });
    });

    describe('checkLimit', () => {
        it('returns a default allowance when called without a tenantId', async () => {
            const result = await service.checkLimit(undefined as any);
            expect(result).toEqual({ allowed: true, remaining: 50000, limit: 50000 });
            expect(mockRepos.usage.createQueryBuilder).not.toHaveBeenCalled();
        });

        it('enforces the subscription AI token limit within the billing period', async () => {
            const periodStart = new Date('2025-01-01T00:00:00Z');
            mockRepos.subscription.findOne.mockResolvedValue({
                price: { product: { metadata: { ai_tokens: 1000000 } } },
                currentPeriodStart: periodStart,
            });
            usageQb.getRawOne.mockResolvedValue({ total: '400000' });

            const result = await service.checkLimit('acme');

            expect(result).toEqual({ allowed: true, remaining: 600000, limit: 1000000 });
            expect(usageQb.andWhere).toHaveBeenCalledWith('usage.timestamp >= :date', { date: periodStart });
        });

        it('denies access once usage meets the limit', async () => {
            mockRepos.subscription.findOne.mockResolvedValue({
                price: { product: { metadata: { ai_tokens: 1000 } } },
                currentPeriodStart: new Date(),
            });
            usageQb.getRawOne.mockResolvedValue({ total: '1500' });

            const result = await service.checkLimit('acme');

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });


        it('fails open when the usage query throws (DB outage)', async () => {
            mockRepos.subscription.findOne.mockResolvedValue(null);
            mockRepos.usage.createQueryBuilder.mockImplementation(() => { throw new Error('db down'); });

            const result = await service.checkLimit('acme');

            expect(result).toEqual({ allowed: true, remaining: 50000, limit: 50000 });
        });
    });

    describe('logUsage / getUsageStats', () => {
        it('persists a usage record for the tenant', async () => {
            await service.logUsage('acme', 1234, 'chat_completion', 'gpt-4');
            expect(mockRepos.usage.create).toHaveBeenCalledWith({
                tenantId: 'acme',
                tokensUsed: 1234,
                action: 'chat_completion',
                serviceName: 'gpt-4',
            });
            expect(mockRepos.usage.save).toHaveBeenCalled();
        });

        it('derives used/remaining stats from checkLimit plus the subscription period', async () => {
            usageQb.getRawOne.mockResolvedValue({ total: '5000' });
            const periodEnd = new Date('2025-12-31T00:00:00Z');
            mockRepos.subscription.findOne.mockResolvedValue({
                price: { product: { metadata: {} } },
                currentPeriodEnd: periodEnd,
            });

            const stats = await service.getUsageStats('acme');

            expect(stats).toEqual({ used: 5000, limit: 50000, remaining: 45000, periodEnd });
        });
    });

    describe('admin RBAC expectations (AdminProductController)', () => {
        it('is guarded by JwtAuthGuard + RolesGuard and restricted to SUPER_ADMIN', () => {
            const guards = Reflect.getMetadata('__guards__', AdminProductController);
            const roles = Reflect.getMetadata('roles', AdminProductController);

            expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
            expect(roles).toEqual([UserRole.SUPER_ADMIN]);
        });
    });
});

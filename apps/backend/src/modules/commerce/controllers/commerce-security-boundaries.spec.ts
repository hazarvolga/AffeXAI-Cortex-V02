import { CommerceController } from './commerce.controller';
import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';

describe('Commerce platform administration boundaries', () => {
  it.each([
    'createProduct',
    'assignPlan',
    'getRevenueSummary',
    'getAdminInvoices',
    'getTokenEconomics',
  ] as const)('requires verified platform authority for %s', method => {
    const guards = Reflect.getMetadata('__guards__', CommerceController.prototype[method]);
    expect(guards).toEqual(expect.arrayContaining([PlatformAdminGuard]));
  });

  it('limits tenant checkout to tenant administrators', () => {
    const method = CommerceController.prototype.createCheckoutSession;
    expect(Reflect.getMetadata('__guards__', method)).toEqual(expect.arrayContaining([RolesGuard]));
    expect(Reflect.getMetadata('roles', method)).toEqual(['admin']);
  });
});

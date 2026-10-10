import { TenantModule } from '../../core/tenant/tenant.module';
import { SocketIdentityService } from '../../core/auth/socket/socket-identity';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TenantModule],
      providers: [NotificationsGateway, { provide: SocketIdentityService, useValue: { verify: jest.fn() } }],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

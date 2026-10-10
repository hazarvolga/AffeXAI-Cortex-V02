import { Test, TestingModule } from '@nestjs/testing';
import { IpReputationService } from './ip-reputation.service';
import { CacheService } from '../../core/shared/services/cache.service';

describe('IpReputationService', () => {
  let service: IpReputationService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpReputationService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IpReputationService>(IpReputationService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIpReputation', () => {
    it('should return unknown reputation for invalid IP', async () => {
      const result = await service.checkIpReputation('invalid-ip');
      expect(result).toEqual({
        ip: 'invalid-ip',
        isListed: false,
        reputation: 'unknown',
        confidence: 0,
        details: 'Invalid IP address format'
      });
    });

    it('should return clean reputation for valid IP not on blacklists', async () => {
      // Mock the DNS lookup to simulate a clean IP
      jest.spyOn(service as any, 'queryDnsblWithTimeout').mockResolvedValue({ isListed: false });
      
      const result = await service.checkIpReputation('8.8.8.8');
      expect(result.reputation).toBe('clean');
      expect(result.isListed).toBe(false);
    });
  });

  describe('isValidIpAddress', () => {
    it('should validate correct IPv4 addresses', () => {
      expect((service as any).isValidIpAddress('192.168.1.1')).toBe(true);
      expect((service as any).isValidIpAddress('8.8.8.8')).toBe(true);
      expect((service as any).isValidIpAddress('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect((service as any).isValidIpAddress('256.1.1.1')).toBe(false);
      expect((service as any).isValidIpAddress('192.168.1')).toBe(false);
      expect((service as any).isValidIpAddress('invalid-ip')).toBe(false);
      expect((service as any).isValidIpAddress('192.168.1.1.1')).toBe(false);
    });
  });
});
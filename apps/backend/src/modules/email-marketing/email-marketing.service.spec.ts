import { Test, TestingModule } from '@nestjs/testing';
import { EmailMarketingService } from './email-marketing.service';

describe('EmailMarketingService', () => {
  let service: EmailMarketingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailMarketingService],
    }).compile();

    service = module.get<EmailMarketingService>(EmailMarketingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

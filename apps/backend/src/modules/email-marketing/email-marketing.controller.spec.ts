import { Test, TestingModule } from '@nestjs/testing';
import { EmailMarketingController } from './email-marketing.controller';

describe('EmailMarketingController', () => {
  let controller: EmailMarketingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailMarketingController],
    }).compile();

    controller = module.get<EmailMarketingController>(EmailMarketingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommerceService } from './commerce.service';
import { Product } from '../entities/product.entity';
import { Price } from '../entities/price.entity';
import { Subscription } from '../entities/subscription.entity';
import { UsageRecord } from '../entities/usage-record.entity';
import { User } from '../../users/entities/user.entity';
import { StripeProvider } from './stripe.provider';
import { MailService } from '../../mail/mail.service';

describe('commerce application bootstrap', () => {
  it('does not create products, fake subscriptions or fabricated usage when the app starts', async () => {
    const repos = [Product, Price, Subscription, UsageRecord, User].map(entity => ({
      provide: getRepositoryToken(entity),
      useValue: { findOne: jest.fn().mockResolvedValue(null), count: jest.fn().mockResolvedValue(0),
        create: jest.fn(value => value), save: jest.fn(value => Promise.resolve({ id: 'generated', ...value })) },
    }));
    const module = await Test.createTestingModule({ providers: [CommerceService, ...repos,
      { provide: StripeProvider, useValue: {} }, { provide: MailService, useValue: {} },
    ] }).compile();
    try {
      await module.init();
      for (const { useValue } of repos) {
        expect(useValue.save).not.toHaveBeenCalled();
        expect(useValue.create).not.toHaveBeenCalled();
      }
    } finally { await module.close(); }
  });
});

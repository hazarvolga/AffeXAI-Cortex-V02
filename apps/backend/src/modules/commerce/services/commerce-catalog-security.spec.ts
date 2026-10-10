import { BadRequestException } from '@nestjs/common';

import { CommerceService } from './commerce.service';

function createService(options: {
  products?: any[];
  price?: any;
} = {}) {
  const productRepo = {
    find: jest.fn(async () => options.products ?? []),
  };
  const priceRepo = {
    findOne: jest.fn(async () => options.price ?? null),
  };
  const stripeProvider = {
    createCheckoutSession: jest.fn(async () => ({ url: 'https://checkout.example/session' })),
  };
  const noopRepository = {};
  const service = new CommerceService(
    productRepo as never,
    priceRepo as never,
    noopRepository as never,
    noopRepository as never,
    noopRepository as never,
    stripeProvider as never,
    {} as never,
  );
  return { service, productRepo, priceRepo, stripeProvider };
}

describe('Commerce public catalog safety', () => {
  it('returns public active products with active prices only', async () => {
    const publicProduct = {
      id: 'public-product',
      active: true,
      isPublic: true,
      prices: [
        { id: 'active-price', active: true },
        { id: 'archived-price', active: false },
      ],
    };
    const { service, productRepo } = createService({ products: [publicProduct] });

    await expect(service.getProducts()).resolves.toEqual([
      { ...publicProduct, prices: [{ id: 'active-price', active: true }] },
    ]);
    expect(productRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { active: true, isPublic: true },
    }));
    expect(publicProduct.prices).toHaveLength(2);
  });

  it.each([
    ['inactive price', { id: 'price', active: false, product: { active: true, isPublic: true } }],
    ['inactive product', { id: 'price', active: true, product: { active: false, isPublic: true } }],
    ['private product', { id: 'price', active: true, product: { active: true, isPublic: false } }],
  ])('rejects checkout for %s before calling Stripe', async (_case, price) => {
    const { service, stripeProvider } = createService({ price });

    await expect(service.createCheckoutSession('tenant-a', 'user-a', 'price', 'owner@example.test'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(stripeProvider.createCheckoutSession).not.toHaveBeenCalled();
  });
});

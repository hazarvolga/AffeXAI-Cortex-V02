import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductManagementService } from './product-management.service';
import { Product } from '../entities/product.entity';
import { Price } from '../entities/price.entity';
import { StripeProvider } from './stripe.provider';
jest.mock('./stripe.provider', () => ({ StripeProvider: class {} }));
function setup(storedAmount: number | string = 10) {
    const product = { id: 'local', name: 'Product', description: '', metadata: {}, stripeProductId: 'prod', prices: [{ amount: storedAmount, active: true, stripePriceId: 'price-old', interval: 'month' }] };
    const products = { create: jest.fn(input => ({ ...input, id: 'local' })), save: jest.fn(async input => input), findOne: jest.fn(async () => product) };
    const prices = { create: jest.fn(input => input), save: jest.fn(async input => input) };
    const stripe = { syncProduct: jest.fn(async (..._args: unknown[]) => ({ product: { id: 'prod' }, price: { id: 'price-new' } })) };
    const service = new ProductManagementService(products as unknown as Repository<Product>, prices as unknown as Repository<Price>, stripe as unknown as StripeProvider);
    return { service, products, prices, stripe, product };
}
describe('Product management USD boundary', () => {
    it.each([[0.29, 29], [19.99, 1999], [12, 1200], [0, 0], [0.01, 1], [99999999.99, 9999999999]])('creates %s USD using integer cents %s', async (amount, cents) => {
        const { service, stripe, prices } = setup();
        await service.createProduct({ name: 'Product', priceAmount: amount, priceInterval: 'month' });
        expect(stripe.syncProduct.mock.calls[0][2]).toBe(cents);
        expect(prices.create).toHaveBeenCalledWith(expect.objectContaining({ amount }));
    });
    it.each([NaN, Infinity, -1, 1.001, 100000000, '19.99', null])('rejects invalid create amount %s before effects', async amount => {
        const { service, products, stripe } = setup();
        await expect(service.createProduct({ priceAmount: amount as number, priceInterval: 'month' })).rejects.toBeInstanceOf(BadRequestException);
        expect(products.create).not.toHaveBeenCalled();
        expect(products.save).not.toHaveBeenCalled();
        expect(stripe.syncProduct).not.toHaveBeenCalled();
    });
    it.each([[0.29, 29], [19.99, 1999], [12, 1200], [0, 0], [0.01, 1], [99999999.99, 9999999999]])('updates price to %s USD including free prices', async (amount, cents) => {
        const { service, stripe, prices } = setup();
        await service.updateProduct('local', { priceAmount: amount });
        expect(stripe.syncProduct).toHaveBeenCalledWith('Product', '', cents, {}, 'prod', undefined);
        expect(prices.create).toHaveBeenCalledWith(expect.objectContaining({ amount }));
    });
    it('normalizes stored decimals and preserves the unchanged Stripe price', async () => {
        const { service, stripe, prices } = setup('19.99');
        stripe.syncProduct.mockResolvedValue({ product: { id: 'prod' }, price: { id: 'price-old' } });
        await service.updateProduct('local', { priceAmount: 19.99 });
        expect(stripe.syncProduct).toHaveBeenCalledWith('Product', '', 1999, {}, 'prod', 'price-old');
        expect(prices.save).not.toHaveBeenCalled();
    });
    it('retains stored amount for metadata-only updates', async () => {
        const { service, stripe, prices } = setup('19.99');
        await service.updateProduct('local', { name: 'Renamed' });
        expect(stripe.syncProduct).toHaveBeenCalledWith('Renamed', '', 1999, {}, 'prod', 'price-old');
        expect(prices.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 19.99 }));
    });
    it.each([NaN, Infinity, -1, 1.001, 100000000, '19.99', null])('rejects invalid update amount %s before writes', async amount => {
        const { service, products, stripe } = setup();
        await expect(service.updateProduct('local', { priceAmount: amount as number })).rejects.toBeInstanceOf(BadRequestException);
        expect(products.save).not.toHaveBeenCalled();
        expect(stripe.syncProduct).not.toHaveBeenCalled();
    });
    it('requires an amount when there is no existing active price', async () => {
        const { service, product, products, stripe } = setup();
        product.prices = [];
        await expect(service.updateProduct('local', { name: 'Renamed' })).rejects.toBeInstanceOf(BadRequestException);
        expect(products.save).not.toHaveBeenCalled();
        expect(stripe.syncProduct).not.toHaveBeenCalled();
    });
});

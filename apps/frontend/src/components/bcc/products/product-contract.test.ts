import { activePriceLabels, productCreateInput } from './product-contract';

describe('admin product price contract', () => {
  it('submits a USD major-unit price without multiplying the amount or inventing token quotas', () => {
    expect(productCreateInput(' Plan ', ' Monthly plan ', '12.34')).toEqual({
      name: 'Plan', description: 'Monthly plan', priceAmount: 12.34, priceInterval: 'month',
    });
    expect(productCreateInput('Free', '', '0').priceAmount).toBe(0);
  });
  it.each(['', ' ', '-1', 'NaN', 'Infinity', '1.234', '1e5', '100000000'])('rejects invalid price %s', price => {
    expect(() => productCreateInput('Plan', '', price)).toThrow();
  });
  it('rejects a whitespace-only product name', () => {
    expect(() => productCreateInput('  ', '', '10')).toThrow('Product name is required');
  });
  it('shows recorded amounts and flags unverified historical units', () => {
    expect(activePriceLabels([
      { id: 'a', amount: 12.34, currency: 'usd', interval: 'month', active: true },
      { id: 'b', amount: 100, currency: 'eur', interval: 'year', active: true },
      { id: 'c', amount: 50, currency: 'usd', interval: 'month', active: false },
    ])).toEqual(['12.34 USD per month (unit unverified)', '100 EUR per year (unit unverified)']);
    expect(activePriceLabels([])).toEqual([]);
  });
});

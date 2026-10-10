import type { Price } from '@/lib/api/commerceService';

/** The admin create endpoint accepts USD major units and converts them for Stripe. */
export function productCreateInput(name: string, description: string, price: string) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Product name is required.');
  const normalizedPrice = price.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice)) {
    throw new Error('Enter a non-negative USD price with at most two decimal places.');
  }
  const priceAmount = Number(normalizedPrice);
  if (!Number.isFinite(priceAmount) || priceAmount > 99999999.99) {
    throw new Error('Price exceeds the supported amount.');
  }
  return { name: trimmedName, description: description.trim(), priceAmount, priceInterval: 'month' };
}

export function activePriceLabels(prices: Price[]): string[] {
  return prices.filter(price => price.active).map(price => {
    const amount = Number(price.amount);
    if (!Number.isFinite(amount) || amount < 0) return 'Price unavailable';
    const currency = price.currency?.toUpperCase();
    if (!currency || !/^[A-Z]{3}$/.test(currency)) return 'Price unavailable';
    const period = price.interval === 'one_time' ? 'one time' : `per ${price.interval}`;
    // Historical rows use mixed major/minor units; do not imply a verified charge.
    return `${amount} ${currency} ${period} (unit unverified)`;
  });
}

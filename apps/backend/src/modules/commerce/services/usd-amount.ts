import { BadRequestException } from '@nestjs/common';

/** USD major units at the admin API; matches Price's decimal(10, 2) storage. */
export function usdToCents(amount: unknown): number {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 99999999.99) {
        throw new BadRequestException('Price must be a non-negative USD amount up to 99999999.99');
    }
    // Round binary floating-point noise, but never round away extra input precision.
    const cents = Math.round(amount * 100);
    if (!Number.isSafeInteger(cents) || cents / 100 !== amount) {
        throw new BadRequestException('USD price must have at most two decimal places');
    }
    return cents;
}

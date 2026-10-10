import { QueryRunner } from 'typeorm';
import { CommerceSubscriptionIntegrity1791410400000 } from './1791410400000-CommerceSubscriptionIntegrity';

describe('CommerceSubscriptionIntegrity migration', () => {
  it('locks every audited source table before reads or backfills', async () => {
    const queries: string[] = [];
    const runner = {
      isTransactionActive: true,
      query: jest.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, ' ').trim());
        return [];
      }),
    } as unknown as QueryRunner;

    await new CommerceSubscriptionIntegrity1791410400000().up(runner);

    expect(queries[0]).toBe(
      'LOCK TABLE organizations, users, subscriptions IN ACCESS EXCLUSIVE MODE',
    );
    expect(queries.findIndex(sql => sql.startsWith('UPDATE users'))).toBeGreaterThan(0);
    expect(queries.findIndex(sql => sql.includes('CREATE TABLE commerce_customer_bindings'))).toBeGreaterThan(0);
  });
});

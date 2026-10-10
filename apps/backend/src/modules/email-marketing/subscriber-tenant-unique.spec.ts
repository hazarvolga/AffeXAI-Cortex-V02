import { getMetadataArgsStorage } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { activeMigrations } from '../../core/database/migration-catalog';

describe('subscriber tenant email schema', () => {
  it('defines tenant-email uniqueness instead of global-email uniqueness', () => {
    const metadata = getMetadataArgsStorage();
    const column = metadata.columns.find(value => value.target === Subscriber && value.propertyName === 'email');
    expect(column?.options.unique).not.toBe(true);
    expect(metadata.uniques.some(value => value.target === Subscriber && JSON.stringify(value.columns) === JSON.stringify(['tenantId', 'email']))).toBe(true);
  });
  it('registers the data-preserving tenant email migration', () => {
    expect(activeMigrations.map(value => value.name)).toContain('SubscriberTenantEmailUnique1791374400000');
  });
});

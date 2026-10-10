import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { DatabaseImportModule } from './database-import.module';

describe('database maintenance boundary', () => {
  it('does not register arbitrary SQL execution in HTTP runtime', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, DatabaseImportModule) ?? []).toEqual([]);
  });
});

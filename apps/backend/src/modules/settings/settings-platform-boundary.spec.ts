import 'reflect-metadata';
jest.mock('@nestjs/mapped-types', () => ({ PartialType: require('@nestjs/swagger').PartialType }));
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../core/auth/guards/platform-admin.guard';
import { SettingsController } from './settings.controller';

describe('Settings platform boundary', () => {
  it.each(['findAllPlatform', 'getPlatformRevision', 'updatePlatformSetting'] as const)(
    'guards %s with authenticated server-provisioned platform authority',
    method => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, SettingsController.prototype[method]) ?? [];
      expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, PlatformAdminGuard]));
    },
  );
});

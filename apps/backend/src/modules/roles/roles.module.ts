import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from './entities/role.entity';
import { RoleTemplate } from './entities/role-template.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, RoleTemplate]),
    forwardRef(() => UsersModule), // Required for JwtAuthGuard, using forwardRef to avoid circular dependency
    require('../../core/tenant/tenant.module').TenantModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule { }

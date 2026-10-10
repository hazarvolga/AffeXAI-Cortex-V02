import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRolesService } from './user-roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';
import { SharedModule } from '../../core/shared/shared.module';
import { RolesModule } from '../roles/roles.module';
import { CrmModule } from '../crm/crm.module';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';
import { UserEmailService } from './services/user-email.service';
import { TicketsModule } from '../tickets/tickets.module';
import { TenantModule } from '../../core/tenant/tenant.module';
import { CommerceModule } from '../commerce/commerce.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Role]),
    SharedModule,
    SettingsModule,
    TenantModule,
    forwardRef(() => RolesModule),
    forwardRef(() => CrmModule), // Use forwardRef to avoid circular dependency
    forwardRef(() => MailModule), // Use forwardRef to avoid circular dependency with EmailMarketingModule
    forwardRef(() => TicketsModule), // Use forwardRef to avoid circular dependency with TicketsModule
    forwardRef(() => CommerceModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserRolesService, UserEmailService],
  exports: [UsersService, UserRolesService, TypeOrmModule],
})
export class UsersModule { }
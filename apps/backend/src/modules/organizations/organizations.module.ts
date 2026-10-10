import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationAuditLog } from './entities/organization-audit-log.entity';
import { User } from '../users/entities/user.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { TenantModule } from '../../core/tenant/tenant.module';

@Module({
    imports: [TypeOrmModule.forFeature([Organization, OrganizationAuditLog, User]), TenantModule],
    controllers: [OrganizationsController],
    providers: [OrganizationsService],
    exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule { }

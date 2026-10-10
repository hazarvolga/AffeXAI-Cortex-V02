import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmIntelligenceService } from './crm-intelligence.service';
import { CrmCustomer } from './entities/crm-customer.entity';
import { BccSignal } from '../bcc/entities/bcc-signal.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../../core/auth/auth.module';
import { TenantModule } from '../../core/tenant/tenant.module';
import { Organization } from '../organizations/entities/organization.entity';
import { CrmLead } from './entities/crm-lead.entity';
import { CrmLeadService } from './crm-lead.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmCustomer, CrmLead, BccSignal, Organization]),
    forwardRef(() => UsersModule),
    AuthModule,
    TenantModule,
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmLeadService, CrmIntelligenceService],
  exports: [CrmService, CrmLeadService, CrmIntelligenceService], // Export for use in auth/signup
})
export class CrmModule { }

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FormsController } from "./forms.controller";
import { FormsService } from "./forms.service";
import { Form } from "./entities/form.entity";
import { FormSubmission } from "./entities/form-submission.entity";
import { CrmModule } from '../crm/crm.module';
import { CortexOutboxModule } from '../../core/cortex/cortex-outbox.module';

@Module({
  imports: [TypeOrmModule.forFeature([Form, FormSubmission]), CrmModule, CortexOutboxModule],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}

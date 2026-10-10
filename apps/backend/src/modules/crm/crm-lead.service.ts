import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { isEmail } from 'class-validator';
import { CrmCustomer } from './entities/crm-customer.entity';
import { CrmLead } from './entities/crm-lead.entity';
import { Form, FormSettings } from '../forms/entities/form.entity';
import { FormSubmission } from '../forms/entities/form-submission.entity';

type LeadContact = {
  email: string | null;
  phone: string | null;
  companyName: string | null;
  contactName: string | null;
};

@Injectable()
export class CrmLeadService {
  async captureFormLead(
    manager: EntityManager,
    form: Form,
    submission: FormSubmission,
  ): Promise<CrmLead | null> {
    const mapping = form.settings?.crmLeadCapture;
    if (!mapping?.enabled) return null;

    const contact = this.extractContact(submission.data, mapping);
    if (!contact.email && !contact.phone) {
      throw new BadRequestException('A valid lead email or phone is required');
    }
    if (contact.email && !isEmail(contact.email)) {
      throw new BadRequestException('Lead email is invalid');
    }

    const leads = manager.getRepository(CrmLead);
    const existing = await leads.findOne({
      where: { tenantId: form.tenantId, sourceType: 'form', sourceRecordId: submission.id },
    });
    if (existing) return existing;

    const customer = contact.email
      ? await manager.getRepository(CrmCustomer).findOne({
          where: { tenantId: form.tenantId, email: contact.email, isActive: true },
        })
      : null;
    return leads.save(leads.create({
      tenantId: form.tenantId,
      customerId: customer?.id ?? null,
      sourceType: 'form',
      sourceRecordId: submission.id,
      formId: form.id,
      email: contact.email,
      phone: contact.phone,
      companyName: contact.companyName,
      contactName: contact.contactName,
      status: 'new',
      schemaVersion: 1,
      sourceData: { formId: form.id, submissionId: submission.id },
    }));
  }

  private extractContact(data: Record<string, unknown>, mapping: NonNullable<FormSettings['crmLeadCapture']>): LeadContact {
    const value = (field: string | undefined, fallbacks: string[]): string | null => {
      const keys = field ? [field] : fallbacks;
      const selected = keys.map(key => data[key]).find(item => typeof item === 'string' && item.trim());
      return typeof selected === 'string' ? selected.trim() : null;
    };
    const email = value(mapping.emailField, ['email']);
    return {
      email: email?.toLowerCase() ?? null,
      phone: value(mapping.phoneField, ['phone', 'telephone']),
      companyName: value(mapping.companyField, ['companyName', 'company']),
      contactName: value(mapping.contactNameField, ['contactName', 'name']),
    };
  }
}

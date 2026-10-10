import { BadRequestException } from '@nestjs/common';
import { CrmLeadService } from './crm-lead.service';
import { CrmLead } from './entities/crm-lead.entity';
import { CrmCustomer } from './entities/crm-customer.entity';

describe('CrmLeadService', () => {
  const leadRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'lead-1', ...value })),
  };
  const customerRepo = { findOne: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity) => entity === CrmLead ? leadRepo : customerRepo),
  } as any;
  const service = new CrmLeadService();
  const form = {
    id: '7e227d7c-c939-44ae-a9db-b16f89343980',
    tenantId: 'tenant-a',
    settings: { crmLeadCapture: { enabled: true, emailField: 'workEmail' } },
  } as any;
  const submission = {
    id: '0ddb022f-2782-4d4c-a1ca-9ee50147b2c6',
    data: { workEmail: ' PERSON@EXAMPLE.COM ', companyName: 'XYZ Company' },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    leadRepo.findOne.mockResolvedValue(null);
    customerRepo.findOne.mockResolvedValue({ id: 'customer-a' });
  });

  it('links a form lead only to a normalized matching customer in the same tenant', async () => {
    const lead = await service.captureFormLead(manager, form, submission);

    expect(customerRepo.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', email: 'person@example.com', isActive: true },
    });
    expect(leadRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-a', customerId: 'customer-a', sourceType: 'form',
      sourceRecordId: submission.id, email: 'person@example.com', schemaVersion: 1,
    }));
    expect(lead?.sourceData).toEqual({ formId: form.id, submissionId: submission.id });
  });

  it('rejects invalid mapped contact data before persistence', async () => {
    await expect(service.captureFormLead(manager, form, {
      ...submission, data: { workEmail: 'invalid-email' },
    })).rejects.toThrow(BadRequestException);
    expect(leadRepo.save).not.toHaveBeenCalled();
  });

  it('returns the existing source lead on replay', async () => {
    leadRepo.findOne.mockResolvedValue({ id: 'existing-lead' });
    const lead = await service.captureFormLead(manager, form, submission);
    expect(lead).toEqual({ id: 'existing-lead' });
    expect(leadRepo.save).not.toHaveBeenCalled();
  });
});

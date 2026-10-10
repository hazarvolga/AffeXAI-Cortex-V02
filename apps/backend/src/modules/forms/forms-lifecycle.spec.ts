import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { CortexOutboxService } from '../../core/cortex/cortex-outbox.service';
import { CrmLeadService } from '../crm/crm-lead.service';
import { FormSubmission } from './entities/form-submission.entity';
import { Form } from './entities/form.entity';
import { FormsService } from './forms.service';
import {
  assertCanonicalFormStructure,
  assertSafePublicFormSettings,
  validateSubmissionData,
} from './form-schema';

const tenantId = randomUUID();
const formId = randomUUID();

const canonicalStructure = {
  rows: [{
    id: 'contact-row',
    type: 'section',
    columns: [{
      id: 'contact-column',
      width: '100%',
      blocks: [
        { id: 'email', type: 'input', properties: { label: 'Email', required: true }, styles: {} },
        { id: 'plan', type: 'select', properties: { label: 'Plan', options: ['Starter', 'Pro'] }, styles: {} },
        { id: 'terms', type: 'checkbox', properties: { label: 'Terms', required: true }, styles: {} },
      ],
    }],
    settings: {},
  }],
  settings: { submitButtonText: 'Send' },
};

describe('Forms lifecycle and published schema', () => {
  const formRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
  } as unknown as jest.Mocked<Repository<Form>>;
  const submissionRepository = { find: jest.fn() } as unknown as jest.Mocked<Repository<FormSubmission>>;
  const emitter = { emit: jest.fn() };
  const formTxRepository = {
    findOne: jest.fn(),
    increment: jest.fn(),
  };
  const submissionTxRepository = {
    findOne: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: object) => ({ id: randomUUID(), ...value })),
  };
  const manager = {
    getRepository: jest.fn((entity: unknown) => entity === Form ? formTxRepository : submissionTxRepository),
  };
  const dataSource = {
    transaction: jest.fn(async (work: (transactionManager: unknown) => unknown) => work(manager)),
  } as unknown as DataSource;
  const crmLeadService = { captureFormLead: jest.fn().mockResolvedValue(null) } as unknown as CrmLeadService;
  const outbox = {
    recordFormSubmitted: jest.fn(),
    recordCrmLeadCaptured: jest.fn(),
  } as unknown as CortexOutboxService;
  const service = new FormsService(
    formRepository,
    submissionRepository,
    emitter as never,
    dataSource,
    crmLeadService,
    outbox,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    submissionTxRepository.findOne.mockResolvedValue(null);
    formTxRepository.findOne.mockResolvedValue({
      id: formId,
      tenantId,
      name: 'Contact',
      description: 'Public description',
      structure: canonicalStructure,
      settings: {
        submitButtonText: 'Send',
        successMessage: 'Thanks',
        redirectUrl: '/thank-you',
        notificationEmail: 'private@example.test',
        crmLeadCapture: { enabled: true, emailField: 'email' },
      },
      status: 'published',
    });
  });

  it('returns an empty tenant list without implicitly seeding templates', async () => {
    formRepository.find.mockResolvedValue([]);

    await expect(service.findAll(tenantId)).resolves.toEqual([]);
    expect(formRepository.create).not.toHaveBeenCalled();
    expect(formRepository.save).not.toHaveBeenCalled();
  });

  it('always creates a draft even when the caller supplies a different status', async () => {
    await service.create(tenantId, {
      name: 'Contact',
      structure: canonicalStructure,
      status: 'published',
    } as never);

    expect(formRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      status: 'draft',
    }));
  });

  it('rejects an invalid canonical schema before publishing', async () => {
    formRepository.findOne.mockResolvedValue({
      id: formId,
      tenantId,
      status: 'draft',
      structure: {
        ...canonicalStructure,
        rows: [{ ...canonicalStructure.rows[0], columns: [{
          ...canonicalStructure.rows[0].columns[0],
          blocks: [{ id: 'plan', type: 'select', properties: { label: 'Plan', options: [] }, styles: {} }],
        }] }],
      },
    } as unknown as Form);

    await expect(service.publish(formId, tenantId)).rejects.toThrow(BadRequestException);
    expect(formRepository.save).not.toHaveBeenCalled();
  });

  it('rejects an unsafe public redirect before publishing', async () => {
    formRepository.findOne.mockResolvedValue({
      id: formId,
      tenantId,
      status: 'draft',
      structure: canonicalStructure,
      settings: { redirectUrl: 'javascript:alert(1)' },
    } as unknown as Form);

    await expect(service.publish(formId, tenantId)).rejects.toThrow(BadRequestException);
    expect(formRepository.save).not.toHaveBeenCalled();
  });

  it('publishes and unpublishes only the tenant-owned form', async () => {
    const form = { id: formId, tenantId, status: 'draft', structure: canonicalStructure } as unknown as Form;
    formRepository.findOne.mockResolvedValue(form);

    await expect(service.publish(formId, tenantId)).resolves.toEqual(expect.objectContaining({ status: 'published' }));
    await expect(service.unpublish(formId, tenantId)).resolves.toEqual(expect.objectContaining({ status: 'draft' }));
    expect(formRepository.findOne).toHaveBeenCalledWith({ where: { id: formId, tenantId } });
  });

  it('keeps a published form immutable until it is explicitly unpublished', async () => {
    formRepository.findOne.mockResolvedValue({
      id: formId,
      tenantId,
      status: 'published',
      structure: canonicalStructure,
    } as unknown as Form);

    await expect(service.update(formId, tenantId, {
      structure: { rows: [], settings: {} },
    })).rejects.toThrow(ConflictException);
    expect(formRepository.save).not.toHaveBeenCalled();
  });

  it('returns only the sanitized published contract from the public lookup', async () => {
    formRepository.findOne.mockResolvedValue({
      ...(await formTxRepository.findOne()),
      structure: {
        ...canonicalStructure,
        rows: [{
          ...canonicalStructure.rows[0],
          settings: { internalLayoutToken: 'private' },
          columns: [{
            ...canonicalStructure.rows[0].columns[0],
            blocks: canonicalStructure.rows[0].columns[0].blocks.map((block) => ({
              ...block,
              properties: { ...block.properties, internalBinding: 'private' },
              styles: { backgroundImage: 'url(https://tracker.invalid/pixel)' },
            })),
          }],
        }],
        settings: { ...canonicalStructure.settings, internalThemeToken: 'private' },
      },
    });

    const published = await service.findPublished(formId, tenantId);
    expect(published).toEqual({
      id: formId,
      name: 'Contact',
      description: 'Public description',
      structure: expect.objectContaining({
        rows: expect.any(Array),
        settings: { submitButtonText: 'Send' },
      }),
      settings: { submitButtonText: 'Send', successMessage: 'Thanks', redirectUrl: '/thank-you' },
    });
    expect(JSON.stringify(published)).not.toContain('internalBinding');
    expect(JSON.stringify(published)).not.toContain('internalLayoutToken');
    expect(JSON.stringify(published)).not.toContain('internalThemeToken');
    expect(JSON.stringify(published)).not.toContain('tracker.invalid');
  });

  it('does not expose draft or cross-tenant forms publicly', async () => {
    formRepository.findOne.mockResolvedValue(null);
    await expect(service.findPublished(formId, tenantId)).rejects.toThrow(NotFoundException);
    expect(formRepository.findOne).toHaveBeenCalledWith({
      where: { id: formId, tenantId, status: 'published' },
    });
  });

  it.each([
    [{ plan: 'Starter', terms: true }, 'required'],
    [{ email: 42, plan: 'Starter', terms: true }, 'type'],
    [{ email: 'a@example.test', plan: 'Enterprise', terms: true }, 'option'],
    [{ email: 'a@example.test', plan: 'Starter', terms: true, injected: 'x' }, 'unknown'],
    [{ email: 'a@example.test', plan: 'Starter', terms: false }, 'required'],
  ])('rejects invalid published submissions (%s)', async (data, _reason) => {
    await expect(service.submit(formId, tenantId, { data }, undefined, 'request_key_123456'))
      .rejects.toThrow(BadRequestException);
    expect(submissionTxRepository.save).not.toHaveBeenCalled();
  });

  it('accepts data matching the published schema and keeps the transactional CRM path', async () => {
    await service.submit(formId, tenantId, {
      data: { email: 'a@example.test', plan: 'Pro', terms: true },
    }, undefined, 'request_key_123456');

    expect(submissionTxRepository.save).toHaveBeenCalled();
    expect(crmLeadService.captureFormLead).toHaveBeenCalledWith(
      manager,
      expect.objectContaining({ id: formId, tenantId }),
      expect.anything(),
    );
    expect(formTxRepository.increment).toHaveBeenCalledWith(
      { id: formId, tenantId },
      'submissionCount',
      1,
    );
  });
});

describe('canonical form schema boundaries', () => {
  it.each([
    null,
    { rows: [], settings: {} },
    { rows: [{ id: '', type: 'section', columns: [], settings: {} }], settings: {} },
    { rows: [{ id: 'row', type: 'section', columns: [], settings: {} }], settings: {} },
    { rows: [{ id: 'row', type: 'section', columns: [{ id: '', width: '', blocks: [] }], settings: {} }], settings: {} },
    { rows: [{ id: 'row', type: 'section', columns: [{ id: 'column', width: '100%', blocks: 'bad' }], settings: {} }], settings: {} },
    { rows: [{ id: 'row', type: 'section', columns: [{ id: 'column', width: '100%', blocks: [{ id: 'field', type: 'script', properties: {}, styles: {} }] }], settings: {} }], settings: {} },
    { rows: [{ id: 'same', type: 'section', columns: [{ id: 'same', width: '100%', blocks: [] }], settings: {} }], settings: {} },
    {
      ...canonicalStructure,
      logicConfig: { rules: [{ blockId: 'email', action: 'show', conditions: [{ fieldId: 'missing', operator: 'equals', value: 'x' }] }] },
    },
    {
      ...canonicalStructure,
      logicConfig: { rules: [{ blockId: 'email', action: 'show', conditions: [{ fieldId: 'email', operator: 'not_empty', value: null }] }] },
    },
    {
      ...canonicalStructure,
      logicConfig: { rules: [
        { blockId: 'email', action: 'show', conditions: [{ fieldId: 'plan', operator: 'not_empty', value: null }] },
        { blockId: 'plan', action: 'show', conditions: [{ fieldId: 'email', operator: 'not_empty', value: null }] },
      ] },
    },
  ])('rejects malformed schema %p', (schema) => {
    expect(() => assertCanonicalFormStructure(schema)).toThrow(BadRequestException);
  });

  it('accepts safe absolute redirects and rejects unsupported protocols', () => {
    expect(() => assertSafePublicFormSettings({ redirectUrl: 'https://example.test/thanks' })).not.toThrow();
    expect(() => assertSafePublicFormSettings({ redirectUrl: 'data:text/html,unsafe' })).toThrow(BadRequestException);
  });

  it('requires conditional fields only while they are visible', () => {
    const structure = {
      ...canonicalStructure,
      logicConfig: {
        rules: [{
          blockId: 'email',
          action: 'show',
          conditions: [{ fieldId: 'plan', operator: 'equals', value: 'Pro' }],
        }],
      },
    } as never;

    expect(() => validateSubmissionData(structure, { plan: 'Starter', terms: true }))
      .not.toThrow();
    expect(() => validateSubmissionData(structure, { plan: 'Pro', terms: true }))
      .toThrow('Field email is required');
  });

  it('matches hide logic for false and empty checkbox values', () => {
    const structure = {
      ...canonicalStructure,
      rows: [{
        ...canonicalStructure.rows[0],
        columns: [{
          ...canonicalStructure.rows[0].columns[0],
          blocks: canonicalStructure.rows[0].columns[0].blocks.map(block =>
            block.id === 'terms'
              ? { ...block, properties: { ...block.properties, required: false } }
              : block),
        }],
      }],
      logicConfig: {
        rules: [{
          blockId: 'email',
          action: 'hide',
          conditions: [{ fieldId: 'terms', operator: 'empty', value: null }],
        }],
      },
    } as never;

    expect(() => validateSubmissionData(structure, { plan: 'Starter', terms: false }))
      .not.toThrow();
  });

  it.each([
    ['email', 'not-an-email'],
    ['url', 'javascript:alert(1)'],
    ['number', 'NaN'],
    ['date', '31-12-2026'],
  ])('rejects invalid %s input semantics', (inputType, value) => {
    const structure = {
      ...canonicalStructure,
      rows: [{
        ...canonicalStructure.rows[0],
        columns: [{
          ...canonicalStructure.rows[0].columns[0],
          blocks: [{
            id: 'typed',
            type: 'input',
            properties: { label: 'Typed field', inputType },
            styles: {},
          }],
        }],
      }],
    } as never;

    expect(() => validateSubmissionData(structure, { typed: value }))
      .toThrow(BadRequestException);
  });
});

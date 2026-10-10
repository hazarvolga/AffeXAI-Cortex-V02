import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FormsService } from '../src/modules/forms/forms.service';
import { Form } from '../src/modules/forms/entities/form.entity';
import { FormSubmission } from '../src/modules/forms/entities/form-submission.entity';
import { SubmitFormDto, CreateFormDto } from '../src/modules/forms/dto/form.dto';
import { DataSource } from 'typeorm';
import { CrmLeadService } from '../src/modules/crm/crm-lead.service';
import { CortexOutboxService } from '../src/core/cortex/cortex-outbox.service';
import { FormsController } from '../src/modules/forms/forms.controller';

/**
 * FormsService unit tests: tenant-scoped CRUD, public form submission
 * (validation + neural.signal emission) and submission listing.
 */
describe('FormsService', () => {
    let service: FormsService;

    const mockFormRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
        create: jest.fn((d: any) => d),
        save: jest.fn((d: any) => Promise.resolve(d)),
        increment: jest.fn(),
    };
    const mockSubmissionRepo = {
        create: jest.fn((d: any) => d),
        save: jest.fn((d: any) => Promise.resolve({ id: 'sub-1', ...d })),
        find: jest.fn(),
        findOne: jest.fn(),
    };
    const mockEmitter = { emit: jest.fn() };
    const mockCrmLead = { captureFormLead: jest.fn().mockResolvedValue({ id: 'lead-1', customerId: 'customer-1' }) };
    const mockOutbox = {
      recordFormSubmitted: jest.fn().mockResolvedValue(undefined),
      recordCrmLeadCaptured: jest.fn().mockResolvedValue(undefined),
    };
    const mockDataSource = {
        transaction: jest.fn(async (callback: any) => callback({
            getRepository: (entity: unknown) => entity === Form ? mockFormRepo : mockSubmissionRepo,
        })),
    };

    const baseForm = (): any => ({
        id: 'form-1',
        tenantId: 'acme',
        name: 'Contact',
        status: 'published',
        submissionCount: 0,
        structure: {
            rows: [{
                id: 'row-1', type: 'section', settings: {},
                columns: [{
                    id: 'column-1', width: '100%',
                    blocks: [{ id: 'email', type: 'input', properties: { label: 'Email' }, styles: {} }],
                }],
            }],
            settings: {},
        },
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FormsService,
                { provide: getRepositoryToken(Form), useValue: mockFormRepo },
                { provide: getRepositoryToken(FormSubmission), useValue: mockSubmissionRepo },
                { provide: EventEmitter2, useValue: mockEmitter },
                { provide: DataSource, useValue: mockDataSource },
                { provide: CrmLeadService, useValue: mockCrmLead },
                { provide: CortexOutboxService, useValue: mockOutbox },
            ],
        }).compile();

        service = module.get(FormsService);
        jest.clearAllMocks();
        mockFormRepo.create.mockImplementation((d: any) => d);
        mockFormRepo.save.mockImplementation((d: any) => Promise.resolve(d));
        mockSubmissionRepo.create.mockImplementation((d: any) => d);
        mockSubmissionRepo.save.mockImplementation((d: any) => Promise.resolve({ id: 'sub-1', ...d }));
        mockSubmissionRepo.findOne = jest.fn().mockResolvedValue(null);
        mockCrmLead.captureFormLead.mockResolvedValue({ id: 'lead-1', customerId: 'customer-1' });
    });

    describe('findAll (tenant scoping)', () => {
        it('only returns forms belonging to the tenant', async () => {
            const forms = [baseForm()];
            mockFormRepo.find.mockResolvedValue(forms);

            const result = await service.findAll('acme');

            expect(mockFormRepo.find).toHaveBeenCalledWith({
                where: { tenantId: 'acme' },
                order: { createdAt: 'DESC' },
            });
            expect(result).toEqual(forms);
        });

        it('skips template seeding when tenant already has forms', async () => {
            mockFormRepo.find.mockResolvedValue([baseForm()]);
            await service.findAll('acme');
            // auto-seed path must not re-check templates for a non-empty tenant
            expect(mockFormRepo.count).not.toHaveBeenCalled();
        });
    });

    describe('findOne / create / remove', () => {
        it('scopes findOne by id AND tenantId', async () => {
            mockFormRepo.findOne.mockResolvedValue(baseForm());
            await service.findOne('form-1', 'acme');
            expect(mockFormRepo.findOne).toHaveBeenCalledWith({ where: { id: 'form-1', tenantId: 'acme' } });
        });

        it('throws NotFoundException on cross-tenant access', async () => {
            mockFormRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('form-1', 'other-tenant')).rejects.toThrow(NotFoundException);
        });

        it('stamps tenantId on create', async () => {
            const dto = { name: 'NPS', structure: { rows: [], settings: {} } } as CreateFormDto;
            await service.create('acme', dto);
            expect(mockFormRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'acme' }));
        });

        it('soft-deletes by archiving instead of removing', async () => {
            const form = baseForm();
            mockFormRepo.findOne.mockResolvedValue(form);
            await service.remove('form-1', 'acme');
            expect(mockFormRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                id: 'form-1', tenantId: 'acme', status: 'archived',
            }));
        });
    });


    describe('submit', () => {
        it('persists the submission, atomically bumps the counter and emits a versioned neural.signal', async () => {
            const form = baseForm();
            mockFormRepo.findOne.mockResolvedValue(form);

            const result = await service.submit('form-1', 'acme', { data: { email: 'a@b.co' } }, '1.2.3.4', 'request_key_123456');

            expect(result).toEqual(expect.objectContaining({
                formId: 'form-1',
                tenantId: 'acme',
                ipAddress: '1.2.3.4',
            }));
            expect(mockFormRepo.increment).toHaveBeenCalledWith(
                { id: 'form-1', tenantId: 'acme' }, 'submissionCount', 1,
            );
            expect(mockCrmLead.captureFormLead).toHaveBeenCalled();
            expect(mockOutbox.recordCrmLeadCaptured).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                tenantId: 'acme', leadId: 'lead-1', customerId: 'customer-1', submissionId: 'sub-1',
            }));
            expect(mockOutbox.recordFormSubmitted).toHaveBeenCalledWith(
              expect.anything(),
              expect.objectContaining({ tenantId: 'acme', formId: 'form-1' }),
            );
            expect(mockEmitter.emit).toHaveBeenCalledWith('neural.signal', expect.objectContaining({
                schemaVersion: 1,
                tenantId: 'acme',
                source: 'forms',
                type: 'form.submitted',
                successScore: 2,
            }));
        });

        it('rejects submissions to forms outside the tenant', async () => {
            mockFormRepo.findOne.mockResolvedValue(null);

            await expect(service.submit('form-1', 'attacker', { data: {} }, undefined, 'request_key_123456')).rejects.toThrow(NotFoundException);
            expect(mockSubmissionRepo.save).not.toHaveBeenCalled();
            expect(mockEmitter.emit).not.toHaveBeenCalled();
        });

        it('returns an identical idempotent replay without creating another lead or signal', async () => {
            mockFormRepo.findOne.mockRejectedValue(new Error('published form lookup must not run for a replay'));
            const canonicalPayload = '{"profile":{"address":{"city":"Istanbul","zip":"34000"},"name":"Ada"},"tags":[{"a":1,"b":2}]}';
            const expectedHash = require('crypto').createHash('sha256').update(canonicalPayload).digest('hex');
            mockSubmissionRepo.findOne.mockResolvedValue({ id: 'sub-existing', payloadHash: expectedHash });

            const result = await service.submit('form-1', 'acme', {
                data: {
                    tags: [{ b: 2, a: 1 }],
                    profile: { name: 'Ada', address: { zip: '34000', city: 'Istanbul' } },
                },
            }, undefined, 'request_key_123456');

            expect(result.id).toBe('sub-existing');
            expect(mockFormRepo.findOne).not.toHaveBeenCalled();
            expect(mockSubmissionRepo.save).not.toHaveBeenCalled();
            expect(mockCrmLead.captureFormLead).not.toHaveBeenCalled();
            expect(mockEmitter.emit).not.toHaveBeenCalled();
        });

        it('rechecks the idempotency key after acquiring the form lock', async () => {
            const canonicalPayload = '{"email":"a@b.co"}';
            const expectedHash = require('crypto').createHash('sha256').update(canonicalPayload).digest('hex');
            mockSubmissionRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'sub-concurrent', payloadHash: expectedHash });
            mockFormRepo.findOne.mockResolvedValue(baseForm());

            const result = await service.submit(
                'form-1', 'acme', { data: { email: 'a@b.co' } }, undefined, 'request_key_123456',
            );

            expect(result.id).toBe('sub-concurrent');
            expect(mockSubmissionRepo.findOne).toHaveBeenCalledTimes(2);
            expect(mockSubmissionRepo.save).not.toHaveBeenCalled();
            expect(mockCrmLead.captureFormLead).not.toHaveBeenCalled();
        });
    });

    describe('findSubmissions', () => {
        it('lists submissions only for the owning tenant', async () => {
            mockFormRepo.findOne.mockResolvedValue(baseForm());
            mockSubmissionRepo.find.mockResolvedValue([{ id: 'sub-1' }]);

            const result = await service.findSubmissions('form-1', 'acme');

            expect(mockSubmissionRepo.find).toHaveBeenCalledWith({
                where: { formId: 'form-1', tenantId: 'acme' },
                select: {
                    id: true,
                    tenantId: true,
                    formId: true,
                    data: true,
                    submittedBy: true,
                    ipAddress: true,
                    submittedAt: true,
                },
                order: { submittedAt: 'DESC' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('DTO validation (class-validator)', () => {
        it('rejects a submission whose data is not an object', async () => {
            const dto = plainToInstance(SubmitFormDto, { data: 'not-an-object' });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('data');
        });

        it('accepts a valid submission and rejects a form without a name', async () => {
            const ok = await validate(plainToInstance(SubmitFormDto, { data: { name: 'Ada' } }));
            expect(ok).toHaveLength(0);

            const bad = await validate(plainToInstance(CreateFormDto, { structure: { rows: [], settings: {} } }));
            expect(bad.some(e => e.property === 'name')).toBe(true);
        });

        it('rejects oversized or deeply nested public form payloads', async () => {
            const oversized = await validate(plainToInstance(SubmitFormDto, { data: { message: 'x'.repeat(33 * 1024) } }));
            const deeplyNested = await validate(plainToInstance(SubmitFormDto, {
                data: { a: { b: { c: { d: { e: { f: 'too-deep' } } } } } },
            }));
            expect(oversized.some(error => error.property === 'data')).toBe(true);
            expect(deeplyNested.some(error => error.property === 'data')).toBe(true);
        });
    });
});

describe('FormsController public submission receipt', () => {
    it('does not expose payload, IP address, or idempotency internals', async () => {
        const formsService = {
            submit: jest.fn().mockResolvedValue({
                id: 'sub-1',
                data: { email: 'private@example.com' },
                ipAddress: '1.2.3.4',
                idempotencyKey: 'request_key_123456',
                payloadHash: 'secret-hash',
            }),
        };
        const controller = new FormsController(formsService as never);

        const result = await controller.submit(
            'acme',
            'form-1',
            { data: { email: 'private@example.com' } },
            'request_key_123456',
            { ip: '1.2.3.4' } as never,
        );

        expect(result).toEqual({ submissionId: 'sub-1' });
    });
});

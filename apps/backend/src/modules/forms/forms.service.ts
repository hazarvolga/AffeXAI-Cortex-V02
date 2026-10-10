import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Form } from "./entities/form.entity";
import { FormSubmission } from "./entities/form-submission.entity";
import { CreateFormDto, UpdateFormDto, SubmitFormDto } from "./dto/form.dto";
import { createHash, randomUUID } from 'crypto';
import { CrmLeadService } from '../crm/crm-lead.service';
import { CortexOutboxService } from '../../core/cortex/cortex-outbox.service';
import type { PublishedFormContract } from '@affexai/shared-types';
import {
  assertCanonicalFormStructure,
  assertSafePublicFormSettings,
  toPublishedFormContract,
  validateSubmissionData,
} from './form-schema';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(FormSubmission)
    private readonly submissionRepository: Repository<FormSubmission>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly crmLeadService: CrmLeadService,
    private readonly cortexOutbox: CortexOutboxService,
  ) { }

  async findAll(tenantId: string): Promise<Form[]> {
    return this.formRepository.find({
      where: { tenantId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Form> {
    const form = await this.formRepository.findOne({
      where: { id, tenantId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    return form;
  }

  async create(tenantId: string, createFormDto: CreateFormDto): Promise<Form> {
    const { status: _ignoredStatus, ...draft } = createFormDto as CreateFormDto & { status?: unknown };
    const form = this.formRepository.create({
      ...draft,
      tenantId,
      status: 'draft',
    });

    return this.formRepository.save(form);
  }

  async update(
    id: string,
    tenantId: string,
    updateFormDto: UpdateFormDto,
  ): Promise<Form> {
    const form = await this.findOne(id, tenantId);
    if (form.status === 'published') {
      throw new ConflictException('Published forms must be unpublished before editing');
    }
    const { status: _ignoredStatus, ...updates } = updateFormDto as UpdateFormDto & { status?: unknown };
    const updatedForm = this.formRepository.create({
      ...form,
      ...updates,
      id: form.id,
      tenantId: form.tenantId,
      status: form.status,
    });
    return this.formRepository.save(updatedForm);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const form = await this.findOne(id, tenantId);

    // Soft delete by setting status to archived
    await this.formRepository.save(this.formRepository.create({ ...form, status: 'archived' }));
  }

  async publish(id: string, tenantId: string): Promise<Form> {
    const form = await this.findOne(id, tenantId);
    assertCanonicalFormStructure(form.structure);
    assertSafePublicFormSettings(form.settings);
    return this.formRepository.save(this.formRepository.create({ ...form, status: 'published' }));
  }

  async unpublish(id: string, tenantId: string): Promise<Form> {
    const form = await this.findOne(id, tenantId);
    return this.formRepository.save(this.formRepository.create({ ...form, status: 'draft' }));
  }

  async findPublished(id: string, tenantId: string): Promise<PublishedFormContract> {
    const form = await this.formRepository.findOne({
      where: { id, tenantId, status: 'published' },
    });
    if (!form) throw new NotFoundException(`Published form with ID ${id} not found`);
    assertCanonicalFormStructure(form.structure);
    assertSafePublicFormSettings(form.settings);
    return toPublishedFormContract(form);
  }

  async submit(
    formId: string,
    tenantId: string,
    submitFormDto: SubmitFormDto,
    ipAddress?: string,
    idempotencyKey?: string,
  ): Promise<FormSubmission> {
    if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,80}$/.test(idempotencyKey)) {
      throw new BadRequestException('A valid Idempotency-Key header is required');
    }
    const payloadHash = createHash('sha256').update(this.stableJson(submitFormDto.data)).digest('hex');
    const result = await this.dataSource.transaction(async manager => {
      const forms = manager.getRepository(Form);
      const submissions = manager.getRepository(FormSubmission);
      const existing = await submissions.findOne({ where: { formId, tenantId, idempotencyKey } });
      if (existing) {
        if (existing.payloadHash !== payloadHash) {
          throw new ConflictException('Idempotency key was already used with different data');
        }
        return { submission: existing, leadId: null, replayed: true };
      }

      const form = await forms.findOne({
        where: { id: formId, tenantId, status: 'published' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!form) throw new NotFoundException(`Published form with ID ${formId} not found`);

      // The form lock serializes first writes for this form. Recheck after waiting
      // so concurrent requests with the same key replay instead of hitting the
      // unique index and surfacing a database error.
      const concurrentReplay = await submissions.findOne({ where: { formId, tenantId, idempotencyKey } });
      if (concurrentReplay) {
        if (concurrentReplay.payloadHash !== payloadHash) {
          throw new ConflictException('Idempotency key was already used with different data');
        }
        return { submission: concurrentReplay, leadId: null, replayed: true };
      }

      assertCanonicalFormStructure(form.structure);
      validateSubmissionData(form.structure, submitFormDto.data);

      const submission = submissions.create({
        formId,
        tenantId,
        data: submitFormDto.data,
        submittedBy: null,
        ipAddress,
        idempotencyKey,
        payloadHash,
      });
      const savedSubmission = await submissions.save(submission);
      await this.cortexOutbox.recordFormSubmitted(manager, {
        eventId: randomUUID(),
        tenantId,
        formId,
        submissionId: savedSubmission.id,
        occurredAt: new Date(),
      });
      const lead = await this.crmLeadService.captureFormLead(manager, form, savedSubmission);
      if (lead) {
        await this.cortexOutbox.recordCrmLeadCaptured(manager, {
          eventId: randomUUID(),
          tenantId,
          leadId: lead.id,
          customerId: lead.customerId,
          formId,
          submissionId: savedSubmission.id,
          occurredAt: new Date(),
        });
      }
      await forms.increment({ id: formId, tenantId }, 'submissionCount', 1);
      return { submission: savedSubmission, leadId: lead?.id ?? null, replayed: false };
    });

    // 🧠 NEURAL GRID SIGNAL: Form Submitted (Reward)
    if (!result.replayed) this.eventEmitter.emit('neural.signal', {
      schemaVersion: 1,
      tenantId: tenantId,
      source: 'forms',
      type: 'form.submitted',
      successScore: 2,
      context: 'A published form submission was persisted',
      data: { formId, submissionId: result.submission.id, leadId: result.leadId }
    });

    return result.submission;
  }

  private stableJson(value: Record<string, unknown>): string {
    return JSON.stringify(this.canonicalizeJson(value));
  }

  private canonicalizeJson(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.canonicalizeJson(item));
    }
    if (value !== null && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => ({
          ...result,
          [key]: this.canonicalizeJson((value as Record<string, unknown>)[key]),
        }), {});
    }
    return value;
  }

  async findSubmissions(
    formId: string,
    tenantId: string,
  ): Promise<FormSubmission[]> {
    // Verify form exists and belongs to tenant
    await this.findOne(formId, tenantId);

    return this.submissionRepository.find({
      where: { formId, tenantId },
      select: {
        id: true,
        tenantId: true,
        formId: true,
        data: true,
        submittedBy: true,
        ipAddress: true,
        submittedAt: true,
      },
      order: { submittedAt: "DESC" },
    });
  }
}

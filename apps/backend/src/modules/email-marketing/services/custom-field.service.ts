import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomField, CustomFieldType } from '../entities/custom-field.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

export interface CreateCustomFieldDto {
  name: string;
  label: string;
  type: CustomFieldType;
  description?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface UpdateCustomFieldDto extends Partial<CreateCustomFieldDto> {
  active?: boolean;
  sortOrder?: number;
}

@Injectable()
export class CustomFieldService {
  constructor(
    @InjectRepository(CustomField)
    private customFieldRepository: Repository<CustomField>,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(): string {
    return this.tenantService.getTenantId() || 'default';
  }

  async create(createDto: CreateCustomFieldDto): Promise<CustomField> {
    const tenantId = this.getTenantId();
    // Validate field name uniqueness
    const existingField = await this.customFieldRepository.findOne({
      where: { name: createDto.name, tenantId }
    });

    if (existingField) {
      throw new BadRequestException(`Custom field with name '${createDto.name}' already exists`);
    }

    // Validate options for SELECT types
    if ([CustomFieldType.SELECT, CustomFieldType.MULTI_SELECT].includes(createDto.type)) {
      if (!createDto.options || createDto.options.length === 0) {
        throw new BadRequestException('Options are required for SELECT and MULTI_SELECT field types');
      }
    }

    // Get next sort order
    const maxSortOrder = await this.customFieldRepository
      .createQueryBuilder('field')
      .select('MAX(field.sortOrder)', 'maxOrder')
      .where('field.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const customField = this.customFieldRepository.create({
      ...createDto,
      tenantId,
      sortOrder: (maxSortOrder?.maxOrder || 0) + 1
    });

    return this.customFieldRepository.save(customField);
  }

  async findAll(activeOnly: boolean = false): Promise<CustomField[]> {
    const tenantId = this.getTenantId();
    const query = this.customFieldRepository.createQueryBuilder('field')
      .where('field.tenantId = :tenantId', { tenantId })
      .orderBy('field.sortOrder', 'ASC');

    if (activeOnly) {
      query.where('field.active = :active', { active: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<CustomField> {
    const tenantId = this.getTenantId();
    const field = await this.customFieldRepository.findOne({ where: { id, tenantId } });
    if (!field) {
      throw new NotFoundException(`Custom field with ID ${id} not found`);
    }
    return field;
  }

  async findByName(name: string): Promise<CustomField | null> {
    const tenantId = this.getTenantId();
    return this.customFieldRepository.findOne({ where: { name, tenantId } });
  }

  async update(id: string, updateDto: UpdateCustomFieldDto): Promise<CustomField> {
    const field = await this.findOne(id);

    // If updating name, check uniqueness
    if (updateDto.name && updateDto.name !== field.name) {
      const tenantId = this.getTenantId();
      const existingField = await this.customFieldRepository.findOne({
        where: { name: updateDto.name, tenantId }
      });

      if (existingField) {
        throw new BadRequestException(`Custom field with name '${updateDto.name}' already exists`);
      }
    }

    // Validate options for SELECT types
    if (updateDto.type && [CustomFieldType.SELECT, CustomFieldType.MULTI_SELECT].includes(updateDto.type)) {
      if (!updateDto.options || updateDto.options.length === 0) {
        throw new BadRequestException('Options are required for SELECT and MULTI_SELECT field types');
      }
    }

    Object.assign(field, updateDto);
    return this.customFieldRepository.save(field);
  }

  async remove(id: string): Promise<void> {
    const field = await this.findOne(id);
    await this.customFieldRepository.remove(field);
  }

  async reorder(fieldIds: string[]): Promise<void> {
    const tenantId = this.getTenantId();
    for (let i = 0; i < fieldIds.length; i++) {
      await this.customFieldRepository.update({ id: fieldIds[i], tenantId }, { sortOrder: i + 1 });
    }
  }

  async getFieldsForMapping(): Promise<Array<{ key: string; label: string; required: boolean; type: string }>> {
    const fields = await this.findAll(true);

    // Standard fields
    const standardFields = [
      { key: 'email', label: 'Email Address', required: true, type: 'email' },
      { key: 'firstName', label: 'First Name', required: false, type: 'text' },
      { key: 'lastName', label: 'Last Name', required: false, type: 'text' },
      { key: 'company', label: 'Company', required: false, type: 'text' },
      { key: 'phone', label: 'Phone', required: false, type: 'text' },
      { key: 'location', label: 'Location', required: false, type: 'text' }
    ];

    // Custom fields
    const customFields = fields.map(field => ({
      key: `custom_${field.name}`,
      label: field.label,
      required: field.required,
      type: field.type.toLowerCase()
    }));

    return [...standardFields, ...customFields];
  }

  async validateCustomFieldValue(field: CustomField, value: any): Promise<{ isValid: boolean; error?: string }> {
    if (field.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `${field.label} is required` };
    }

    if (value === null || value === undefined || value === '') {
      return { isValid: true }; // Optional field with no value
    }

    switch (field.type) {
      case CustomFieldType.TEXT:
        if (typeof value !== 'string') {
          return { isValid: false, error: `${field.label} must be text` };
        }
        if (field.validation?.min && value.length < field.validation.min) {
          return { isValid: false, error: `${field.label} must be at least ${field.validation.min} characters` };
        }
        if (field.validation?.max && value.length > field.validation.max) {
          return { isValid: false, error: `${field.label} must be at most ${field.validation.max} characters` };
        }
        if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
          return { isValid: false, error: field.validation.message || `${field.label} format is invalid` };
        }
        break;

      case CustomFieldType.NUMBER:
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { isValid: false, error: `${field.label} must be a number` };
        }
        if (field.validation?.min && numValue < field.validation.min) {
          return { isValid: false, error: `${field.label} must be at least ${field.validation.min}` };
        }
        if (field.validation?.max && numValue > field.validation.max) {
          return { isValid: false, error: `${field.label} must be at most ${field.validation.max}` };
        }
        break;

      case CustomFieldType.DATE:
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return { isValid: false, error: `${field.label} must be a valid date` };
        }
        break;

      case CustomFieldType.BOOLEAN:
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return { isValid: false, error: `${field.label} must be true or false` };
        }
        break;

      case CustomFieldType.SELECT:
        if (!field.options?.includes(value)) {
          return { isValid: false, error: `${field.label} must be one of: ${field.options?.join(', ')}` };
        }
        break;

      case CustomFieldType.MULTI_SELECT:
        if (!Array.isArray(value)) {
          return { isValid: false, error: `${field.label} must be an array` };
        }
        const invalidOptions = value.filter(v => !field.options?.includes(v));
        if (invalidOptions.length > 0) {
          return { isValid: false, error: `${field.label} contains invalid options: ${invalidOptions.join(', ')}` };
        }
        break;
    }

    return { isValid: true };
  }

  async validateCustomFieldsData(customFieldsData: Record<string, any>): Promise<{
    isValid: boolean;
    errors: string[];
    validatedData: Record<string, any>;
  }> {
    const errors: string[] = [];
    const validatedData: Record<string, any> = {};
    const activeFields = await this.findAll(true);

    // Validate each provided custom field
    for (const [fieldName, value] of Object.entries(customFieldsData)) {
      const field = activeFields.find(f => f.name === fieldName);

      if (!field) {
        errors.push(`Unknown custom field: ${fieldName}`);
        continue;
      }

      const validation = await this.validateCustomFieldValue(field, value);
      if (!validation.isValid) {
        errors.push(validation.error!);
      } else {
        validatedData[fieldName] = value;
      }
    }

    // Check for required fields that are missing
    for (const field of activeFields) {
      if (field.required && !(field.name in customFieldsData)) {
        errors.push(`Required custom field missing: ${field.label}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData
    };
  }
}
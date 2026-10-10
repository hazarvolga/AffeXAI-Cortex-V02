import { BadRequestException } from '@nestjs/common';
import type {
  FormBlock,
  FormBlockType,
  FormStructure,
  PublishedFormContract,
  PublicFormSettings,
  FormSettings,
} from '@affexai/shared-types';
import { Form } from './entities/form.entity';

const BLOCK_TYPES = new Set<FormBlockType>([
  'input',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'heading',
  'text',
  'button',
]);
const FIELD_TYPES = new Set<FormBlockType>(['input', 'textarea', 'select', 'radio', 'checkbox']);
const STRING_FIELD_TYPES = new Set<FormBlockType>(['input', 'textarea', 'select', 'radio']);
const LOGIC_OPERATORS = new Set(['equals', 'not_equals', 'contains', 'empty', 'not_empty']);
const INPUT_TYPES = new Set(['text', 'email', 'tel', 'url', 'number', 'date']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function schemaError(message: string): never {
  throw new BadRequestException(`Invalid form schema: ${message}`);
}

export function assertCanonicalFormStructure(value: unknown): asserts value is FormStructure {
  if (!isRecord(value) || !Array.isArray(value.rows) || !isRecord(value.settings)) {
    schemaError('structure must contain rows and settings');
  }
  if (value.rows.length === 0) schemaError('at least one row is required');

  const ids = new Set<string>();
  const fieldIds = new Set<string>();
  let fieldCount = 0;
  value.rows.forEach((rowValue, rowIndex) => {
    if (!isRecord(rowValue) || !nonEmptyString(rowValue.id) || rowValue.type !== 'section') {
      schemaError(`row ${rowIndex} must be a section with an id`);
    }
    claimId(ids, rowValue.id);
    if (!Array.isArray(rowValue.columns) || rowValue.columns.length === 0 || !isRecord(rowValue.settings)) {
      schemaError(`row ${rowValue.id} must contain columns and settings`);
    }
    rowValue.columns.forEach((columnValue, columnIndex) => {
      if (!isRecord(columnValue) || !nonEmptyString(columnValue.id) || !nonEmptyString(columnValue.width)) {
        schemaError(`column ${columnIndex} in row ${rowValue.id} is invalid`);
      }
      claimId(ids, columnValue.id);
      if (!Array.isArray(columnValue.blocks)) schemaError(`column ${columnValue.id} must contain blocks`);
      columnValue.blocks.forEach((blockValue, blockIndex) => {
        if (!isRecord(blockValue) || !nonEmptyString(blockValue.id) || !BLOCK_TYPES.has(blockValue.type as FormBlockType)) {
          schemaError(`block ${blockIndex} in column ${columnValue.id} has an unsupported type or id`);
        }
        claimId(ids, blockValue.id);
        if (!isRecord(blockValue.properties) || !isRecord(blockValue.styles)) {
          schemaError(`block ${blockValue.id} must contain properties and styles`);
        }
        validatePublicBlockSchema(blockValue as unknown as FormBlock);
        if (FIELD_TYPES.has(blockValue.type as FormBlockType)) {
          fieldCount += 1;
          fieldIds.add(blockValue.id);
          validateFieldSchema(blockValue as unknown as FormBlock);
        }
      });
    });
  });
  if (fieldCount === 0) schemaError('at least one input field is required');
  validateLogicConfig(value.logicConfig, ids, fieldIds);
}

function validatePublicBlockSchema(block: FormBlock): void {
  for (const key of ['label', 'placeholder', 'text'] as const) {
    const value = block.properties[key];
    if (value !== undefined && (typeof value !== 'string' || value.length > 10_000)) {
      schemaError(`block ${block.id} has an invalid ${key}`);
    }
  }
  if (block.type === 'input' && block.properties.inputType !== undefined
    && !INPUT_TYPES.has(String(block.properties.inputType))) {
    schemaError(`field ${block.id} has an invalid inputType`);
  }
  if (block.type === 'textarea' && block.properties.rows !== undefined) {
    const rows = block.properties.rows;
    if (!Number.isInteger(rows) || Number(rows) < 1 || Number(rows) > 20) {
      schemaError(`field ${block.id} has an invalid row count`);
    }
  }
}

function validateLogicConfig(
  logicConfig: unknown,
  blockIds: Set<string>,
  fieldIds: Set<string>,
): void {
  if (logicConfig === undefined) return;
  if (!isRecord(logicConfig) || !Array.isArray(logicConfig.rules) || logicConfig.rules.length > 100) {
    schemaError('logicConfig must contain at most 100 rules');
  }
  const dependencies = new Map<string, Set<string>>();
  for (const [ruleIndex, rule] of logicConfig.rules.entries()) {
    if (!isRecord(rule) || !nonEmptyString(rule.blockId) || !blockIds.has(rule.blockId)
      || (rule.action !== 'show' && rule.action !== 'hide')
      || !Array.isArray(rule.conditions) || rule.conditions.length > 20) {
      schemaError(`logic rule ${ruleIndex} is invalid`);
    }
    if (dependencies.has(rule.blockId)) {
      schemaError(`logic rule ${ruleIndex} duplicates block ${rule.blockId}`);
    }
    const ruleDependencies = new Set<string>();
    for (const condition of rule.conditions) {
      if (!isRecord(condition) || !nonEmptyString(condition.fieldId)
        || !fieldIds.has(condition.fieldId)
        || !LOGIC_OPERATORS.has(String(condition.operator))
        || !isSafeLogicValue(condition.value)) {
        schemaError(`logic rule ${ruleIndex} contains an invalid condition`);
      }
      if (condition.fieldId === rule.blockId) {
        schemaError(`logic rule ${ruleIndex} cannot depend on itself`);
      }
      ruleDependencies.add(condition.fieldId);
    }
    dependencies.set(rule.blockId, ruleDependencies);
  }
  assertAcyclicLogicDependencies(dependencies);
}

function assertAcyclicLogicDependencies(
  dependencies: Map<string, Set<string>>,
): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (blockId: string): void => {
    if (visiting.has(blockId)) schemaError('logicConfig contains a visibility cycle');
    if (visited.has(blockId)) return;
    visiting.add(blockId);
    for (const dependency of dependencies.get(blockId) ?? []) {
      if (dependencies.has(dependency)) visit(dependency);
    }
    visiting.delete(blockId);
    visited.add(blockId);
  };
  dependencies.forEach((_value, blockId) => visit(blockId));
}

function isSafeLogicValue(value: unknown): boolean {
  return value === null
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
    || (typeof value === 'string' && value.length <= 2000);
}

function claimId(ids: Set<string>, id: string): void {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) schemaError(`id ${id} contains unsupported characters`);
  if (ids.has(id)) schemaError(`duplicate id ${id}`);
  ids.add(id);
}

export function assertSafePublicFormSettings(settings: FormSettings | null | undefined): void {
  if (settings === null || settings === undefined) return;
  if (!isRecord(settings)) schemaError('settings must be an object');
  for (const key of ['theme', 'submitButtonText', 'successMessage'] as const) {
    const value = settings[key];
    if (value !== undefined && (typeof value !== 'string' || value.length > 2000)) {
      schemaError(`setting ${key} must be a bounded string`);
    }
  }
  if (settings.redirectUrl !== undefined && !isSafeRedirect(settings.redirectUrl)) {
    schemaError('redirectUrl must be a relative path or an HTTP(S) URL');
  }
}

function isSafeRedirect(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateFieldSchema(block: FormBlock): void {
  if (!nonEmptyString(block.properties.label)) schemaError(`field ${block.id} requires a label`);
  if (block.properties.required !== undefined && typeof block.properties.required !== 'boolean') {
    schemaError(`field ${block.id} has an invalid required flag`);
  }
  if (block.type === 'select' || block.type === 'radio') {
    const options = block.properties.options;
    if (!Array.isArray(options) || options.length === 0 || !options.every(nonEmptyString)) {
      schemaError(`field ${block.id} requires non-empty string options`);
    }
    if (new Set(options).size !== options.length) schemaError(`field ${block.id} has duplicate options`);
  }
}

export function validateSubmissionData(structure: FormStructure, data: Record<string, unknown>): void {
  const fields = structure.rows.flatMap(row => row.columns.flatMap(column => column.blocks))
    .filter(block => FIELD_TYPES.has(block.type));
  const fieldById = new Map(fields.map(field => [field.id, field]));
  const unknownFields = Object.keys(data).filter(key => !fieldById.has(key));
  if (unknownFields.length > 0) {
    throw new BadRequestException(`Unknown form fields: ${unknownFields.join(', ')}`);
  }

  fields.forEach(field => validateSubmittedField(
    field,
    data,
    isFieldVisible(field.id, structure, data),
  ));
}

function isFieldVisible(
  blockId: string,
  structure: FormStructure,
  data: Record<string, unknown>,
): boolean {
  const rule = structure.logicConfig?.rules.find(candidate => candidate.blockId === blockId);
  if (!rule) return true;
  const matches = rule.conditions.every(condition => {
    const current = data[condition.fieldId];
    switch (condition.operator) {
      case 'equals': return current === condition.value;
      case 'not_equals': return current !== condition.value;
      case 'contains':
        return Array.isArray(current)
          ? current.includes(condition.value)
          : String(current ?? '').includes(String(condition.value ?? ''));
      case 'empty':
        return current === undefined || current === null || current === '' || current === false;
      case 'not_empty':
        return current !== undefined && current !== null && current !== '' && current !== false;
    }
  });
  return rule.action === 'show' ? matches : !matches;
}

function validateSubmittedField(
  field: FormBlock,
  data: Record<string, unknown>,
  visible: boolean,
): void {
  const value = data[field.id];
  const required = field.properties.required === true;
  const absent = value === undefined || value === null || value === '';
  if (visible && required && (absent || (field.type === 'checkbox' && value !== true))) {
    throw new BadRequestException(`Field ${field.id} is required`);
  }
  if (absent) return;
  if (STRING_FIELD_TYPES.has(field.type) && typeof value !== 'string') {
    throw new BadRequestException(`Field ${field.id} must be a string`);
  }
  if (field.type === 'checkbox' && typeof value !== 'boolean') {
    throw new BadRequestException(`Field ${field.id} must be a boolean`);
  }
  if ((field.type === 'select' || field.type === 'radio')
    && !(field.properties.options as string[]).includes(value as string)) {
    throw new BadRequestException(`Field ${field.id} must use an allowed option`);
  }
  if (field.type === 'input' && typeof value === 'string') {
    validateInputSemantics(field, value);
  }
}

function validateInputSemantics(field: FormBlock, value: string): void {
  const inputType = field.properties.inputType ?? 'text';
  const invalid = () => new BadRequestException(`Field ${field.id} has an invalid ${inputType} value`);
  if (inputType === 'email') {
    if (value.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw invalid();
    return;
  }
  if (inputType === 'url') {
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw invalid();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw invalid();
    }
    return;
  }
  if (inputType === 'number') {
    if (value.trim() === '' || !Number.isFinite(Number(value))) throw invalid();
    return;
  }
  if (inputType === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalid();
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw invalid();
  }
}

export function toPublishedFormContract(form: Form): PublishedFormContract {
  const settings = form.settings ?? {};
  const publicSettings: PublicFormSettings = {};
  if (settings.theme !== undefined) publicSettings.theme = settings.theme;
  if (settings.submitButtonText !== undefined) publicSettings.submitButtonText = settings.submitButtonText;
  if (settings.successMessage !== undefined) publicSettings.successMessage = settings.successMessage;
  if (settings.redirectUrl !== undefined) publicSettings.redirectUrl = settings.redirectUrl;

  return {
    id: form.id,
    name: form.name,
    description: form.description ?? null,
    structure: projectPublicStructure(form.structure),
    settings: publicSettings,
  };
}

function projectPublicStructure(structure: FormStructure): FormStructure {
  const publicSettings: FormStructure['settings'] = {};
  if (typeof structure.settings.theme === 'string') publicSettings.theme = structure.settings.theme;
  if (typeof structure.settings.submitButtonText === 'string') {
    publicSettings.submitButtonText = structure.settings.submitButtonText;
  }
  if (typeof structure.settings.width === 'string') publicSettings.width = structure.settings.width;

  const logicConfig = structure.logicConfig
    ? {
      rules: structure.logicConfig.rules.map(rule => ({
        blockId: rule.blockId,
        action: rule.action,
        conditions: rule.conditions.map(condition => ({
          fieldId: condition.fieldId,
          operator: condition.operator,
          value: condition.value,
        })),
      })),
    }
    : undefined;

  return {
    rows: structure.rows.map(row => ({
      id: row.id,
      type: 'section' as const,
      settings: {},
      columns: row.columns.map(column => ({
        id: column.id,
        width: column.width,
        blocks: column.blocks.map(block => ({
          id: block.id,
          type: block.type,
          ...(typeof block.label === 'string' ? { label: block.label } : {}),
          properties: projectBlockProperties(block),
          styles: {},
        })),
      })),
    })),
    settings: publicSettings,
    ...(logicConfig ? { logicConfig } : {}),
  };
}

function projectBlockProperties(block: FormBlock): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const allowed = block.type === 'input'
    ? ['label', 'required', 'placeholder', 'inputType']
    : block.type === 'textarea'
      ? ['label', 'required', 'placeholder', 'rows']
      : block.type === 'select' || block.type === 'radio'
        ? ['label', 'required', 'options']
        : block.type === 'checkbox'
          ? ['label', 'required']
          : ['label', 'text'];
  for (const key of allowed) {
    if (block.properties[key] !== undefined) properties[key] = block.properties[key];
  }
  return properties;
}

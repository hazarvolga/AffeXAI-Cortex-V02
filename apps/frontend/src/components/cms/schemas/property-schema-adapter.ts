import type { PropField, PropFieldType } from './block-schema';

export interface PropertyConfig {
  label: string;
  type: PropFieldType | 'list' | 'checkbox' | 'token';
  defaultValue?: unknown;
  options?: string[];
  optionLabels?: Record<string, string>;
  itemSchema?: BlockPropertySchema;
  tokenReference?: { suggestedPath?: string; category?: string; description?: string };
}

export type BlockPropertySchema = Record<string, PropertyConfig>;

/** Adapt V2 fields to the existing nested media/list editor contract. */
export function toPropertySchema(fields: PropField[]): BlockPropertySchema {
  return Object.fromEntries(fields.map(field => {
    const config: PropertyConfig = {
      label: field.label, type: field.type, defaultValue: field.defaultValue,
    };
    if (field.type === 'select') {
      return [field.key, { ...config,
        options: field.options.map(option => option.value),
        optionLabels: Object.fromEntries(field.options.map(option => [option.value, option.label])),
      }];
    }
    if (field.type === 'array') {
      const children = field.itemSchema.type === 'object' ? field.itemSchema.fields : [field.itemSchema];
      return [field.key, { ...config, itemSchema: toPropertySchema(children) }];
    }
    if (field.type === 'object') {
      return [field.key, { ...config, itemSchema: toPropertySchema(field.fields) }];
    }
    return [field.key, config];
  }));
}

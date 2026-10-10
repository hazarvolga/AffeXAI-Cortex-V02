/**
 * Block Schema System
 * Enterprise-grade schema definitions for CMS blocks
 * 
 * This provides:
 * 1. Type-safe prop definitions
 * 2. Auto-generated properties panel
 * 3. Validation on save
 * 4. Default values
 */

// ============ PROP FIELD TYPES ============

export type PropFieldType =
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'number'
    | 'boolean'
    | 'select'
    | 'color'
    | 'image'
    | 'video'
    | 'link'
    | 'array'
    | 'object'
    | 'icon';

export interface PropFieldBase {
    key: string;
    label: string;
    type: PropFieldType;
    required?: boolean;
    description?: string;
    placeholder?: string;
    defaultValue?: any;
    group?: string; // For grouping in properties panel
}

export interface TextPropField extends PropFieldBase {
    type: 'text';
    maxLength?: number;
    minLength?: number;
}

export interface TextareaPropField extends PropFieldBase {
    type: 'textarea';
    rows?: number;
    maxLength?: number;
}

export interface RichtextPropField extends PropFieldBase {
    type: 'richtext';
    toolbar?: ('bold' | 'italic' | 'link' | 'list')[];
}

export interface NumberPropField extends PropFieldBase {
    type: 'number';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

export interface BooleanPropField extends PropFieldBase {
    type: 'boolean';
}

export interface SelectPropField extends PropFieldBase {
    type: 'select';
    options: { value: string; label: string }[];
    multiple?: boolean;
}

export interface ColorPropField extends PropFieldBase {
    type: 'color';
    presets?: string[];
}

export interface ImagePropField extends PropFieldBase {
    type: 'image';
    aspectRatio?: string; // e.g., '16:9', '1:1'
    maxSize?: number; // in KB
}

export interface VideoPropField extends PropFieldBase {
    type: 'video';
    providers?: ('youtube' | 'vimeo' | 'upload')[];
}

export interface LinkPropField extends PropFieldBase {
    type: 'link';
    allowExternal?: boolean;
}

export interface ArrayPropField extends PropFieldBase {
    type: 'array';
    itemSchema: PropField;
    minItems?: number;
    maxItems?: number;
}

export interface ObjectPropField extends PropFieldBase {
    type: 'object';
    fields: PropField[];
}

export interface IconPropField extends PropFieldBase {
    type: 'icon';
    iconSet?: 'lucide' | 'heroicons';
}

export type PropField =
    | TextPropField
    | TextareaPropField
    | RichtextPropField
    | NumberPropField
    | BooleanPropField
    | SelectPropField
    | ColorPropField
    | ImagePropField
    | VideoPropField
    | LinkPropField
    | ArrayPropField
    | ObjectPropField
    | IconPropField;

// ============ BLOCK SCHEMA ============

export type BlockCategory =
    | 'hero'
    | 'content'
    | 'cta'
    | 'layout'
    | 'media'
    | 'navigation'
    | 'footer'
    | 'data'
    | 'legacy';

export interface BlockSchema {
    /** Unique block type identifier */
    type: string;

    /** Display name in editor */
    label: string;

    /** Description for tooltip */
    description?: string;

    /** Category for grouping in palette */
    category: BlockCategory;

    /** Lucide icon name */
    icon: string;

    /** Preview image URL */
    previewImage?: string;

    /** Schema version for migrations */
    version: number;

    /** Default props when block is added */
    defaultProps: Record<string, any>;

    /** Prop schema for properties panel */
    propSchema: PropField[];

    /** Whether block can contain children */
    allowChildren?: boolean;

    /** Allowed child block types (empty = all) */
    allowedChildTypes?: string[];

    /** Tags for search */
    tags?: string[];

    /** Is this a legacy block (no schema validation) */
    isLegacy?: boolean;
}

// ============ SCHEMA REGISTRY ============

const schemaRegistry = new Map<string, BlockSchema>();

export function registerBlockSchema(schema: BlockSchema): void {
    if (schemaRegistry.has(schema.type)) {
        console.warn(`Block schema "${schema.type}" already registered, overwriting.`);
    }
    schemaRegistry.set(schema.type, schema);
}

export function getBlockSchema(type: string): BlockSchema | undefined {
    return schemaRegistry.get(type);
}

export function getAllSchemas(): BlockSchema[] {
    return Array.from(schemaRegistry.values());
}

export function getSchemasByCategory(category: BlockCategory): BlockSchema[] {
    return getAllSchemas().filter(s => s.category === category);
}

export function hasSchema(type: string): boolean {
    return schemaRegistry.has(type);
}

// ============ VALIDATION ============

export interface ValidationError {
    field: string;
    message: string;
}

export function validateBlockProps(
    type: string,
    props: Record<string, any>
): ValidationError[] {
    const schema = getBlockSchema(type);
    if (!schema || schema.isLegacy) {
        return []; // Skip validation for legacy blocks
    }

    const errors: ValidationError[] = [];

    for (const field of schema.propSchema) {
        const value = props[field.key];

        // Required check
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: field.key,
                message: `${field.label} is required`,
            });
            continue;
        }

        // Type-specific validation
        if (value !== undefined && value !== null) {
            switch (field.type) {
                case 'text':
                    if (typeof value !== 'string') {
                        errors.push({ field: field.key, message: `${field.label} must be text` });
                    } else {
                        const textField = field as TextPropField;
                        if (textField.maxLength && value.length > textField.maxLength) {
                            errors.push({ field: field.key, message: `${field.label} exceeds max length` });
                        }
                    }
                    break;

                case 'number':
                    if (typeof value !== 'number') {
                        errors.push({ field: field.key, message: `${field.label} must be a number` });
                    } else {
                        const numField = field as NumberPropField;
                        if (numField.min !== undefined && value < numField.min) {
                            errors.push({ field: field.key, message: `${field.label} must be at least ${numField.min}` });
                        }
                        if (numField.max !== undefined && value > numField.max) {
                            errors.push({ field: field.key, message: `${field.label} must be at most ${numField.max}` });
                        }
                    }
                    break;

                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push({ field: field.key, message: `${field.label} must be an array` });
                    } else {
                        const arrField = field as ArrayPropField;
                        if (arrField.minItems && value.length < arrField.minItems) {
                            errors.push({ field: field.key, message: `${field.label} needs at least ${arrField.minItems} items` });
                        }
                        if (arrField.maxItems && value.length > arrField.maxItems) {
                            errors.push({ field: field.key, message: `${field.label} can have at most ${arrField.maxItems} items` });
                        }
                    }
                    break;
            }
        }
    }

    return errors;
}

// ============ HELPER: GET DEFAULT PROPS ============

export function getDefaultProps(type: string): Record<string, any> {
    const schema = getBlockSchema(type);
    if (!schema) return {};

    const defaults: Record<string, any> = { ...schema.defaultProps };

    // Fill in field-level defaults
    for (const field of schema.propSchema) {
        if (defaults[field.key] === undefined && field.defaultValue !== undefined) {
            defaults[field.key] = field.defaultValue;
        }
    }

    return defaults;
}

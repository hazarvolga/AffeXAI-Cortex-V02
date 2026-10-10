import {
  IsString,
  IsOptional,
  IsObject,
  IsNotEmpty,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { FormStructure, FormSettings } from "../entities/form.entity";

@ValidatorConstraint({ name: 'boundedFormPayload', async: false })
export class BoundedFormPayloadConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (Buffer.byteLength(JSON.stringify(value)) > 32 * 1024) return false;
    return this.isBounded(value, 0);
  }

  defaultMessage(): string {
    return 'Form data exceeds the allowed field, depth, or value limits';
  }

  private isBounded(value: unknown, depth: number): boolean {
    if (depth > 4) return false;
    if (typeof value === 'string') return value.length <= 2000;
    if (value === null || ['number', 'boolean'].includes(typeof value)) return true;
    if (Array.isArray(value)) return value.length <= 100 && value.every(item => this.isBounded(item, depth + 1));
    if (typeof value !== 'object') return false;
    const entries = Object.entries(value);
    return entries.length <= 100 && entries.every(([key, item]) => key.length <= 128 && this.isBounded(item, depth + 1));
  }
}

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  structure: FormStructure;

  @IsObject()
  @IsOptional()
  settings?: FormSettings;

}

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  structure?: FormStructure;

  @IsObject()
  @IsOptional()
  settings?: FormSettings;

}

export class SubmitFormDto {
  @IsObject()
  @IsNotEmpty()
  @Validate(BoundedFormPayloadConstraint)
  data: Record<string, unknown>;

}

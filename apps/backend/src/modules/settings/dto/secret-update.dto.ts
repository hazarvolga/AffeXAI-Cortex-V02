import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

export type SecretUpdateOperation = 'preserve' | 'replace' | 'clear';

export interface SecretUpdateDto {
  operation: SecretUpdateOperation;
  value?: string;
}

export type SecretUpdateInput = string | SecretUpdateDto;

export function IsSecretUpdateInput(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) => registerDecorator({
    name: 'isSecretUpdateInput',
    target: target.constructor,
    propertyName: propertyKey.toString(),
    options,
    validator: {
      validate(value: unknown): boolean {
        if (typeof value === 'string') return true;
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const candidate = value as Record<string, unknown>;
        const keys = Object.keys(candidate);
        if (!['preserve', 'replace', 'clear'].includes(String(candidate.operation))) return false;
        if (keys.some(key => !['operation', 'value'].includes(key))) return false;
        if (candidate.operation === 'replace') return typeof candidate.value === 'string';
        return candidate.value === undefined;
      },
      defaultMessage(args: ValidationArguments): string {
        return `${args.property} must be a secret string or an explicit preserve, replace, or clear operation`;
      },
    },
  });
}

export function normalizeSecretUpdate(input: SecretUpdateInput): SecretUpdateDto {
  if (typeof input !== 'string') return { ...input };
  if (input === '***') return { operation: 'preserve' };
  if (input === '') return { operation: 'clear' };
  return { operation: 'replace', value: input };
}

export function maskCredential(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return '***';
}

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrictEmail', async: false })
export class IsStrictEmailConstraint implements ValidatorConstraintInterface {
  validate(email: any, args: ValidationArguments) {
    if (typeof email !== 'string') {
      return false;
    }

    // RFC 5322 compliant email regex (simplified but robust)
    // - Local part can contain: letters, numbers, dots, underscores, hyphens
    // - Must not start or end with dot
    // - Domain must have valid structure
    // - TLD must be at least 2 characters
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional validation checks
    const [localPart, domain] = email.split('@');

    // Check for consecutive dots
    if (email.includes('..')) {
      return false;
    }

    // Check if local part starts or ends with dot
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }

    // Check domain has valid TLD (at least 2 characters)
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2) {
      return false;
    }

    // Check for invalid characters in domain
    if (domain.includes('..')) {
      return false;
    }

    // Email length check (RFC 5321: max 254 characters)
    if (email.length > 254) {
      return false;
    }

    // Local part length check (RFC 5321: max 64 characters)
    if (localPart.length > 64) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const email = args.value;

    if (typeof email !== 'string') {
      return 'Email must be a string';
    }

    if (email.includes('..')) {
      return 'Email address cannot contain consecutive dots';
    }

    const [localPart] = email.split('@');
    if (localPart && (localPart.startsWith('.') || localPart.endsWith('.'))) {
      return 'Email address cannot start or end with a dot';
    }

    if (email.length > 254) {
      return 'Email address is too long (max 254 characters)';
    }

    if (localPart && localPart.length > 64) {
      return 'Email local part is too long (max 64 characters)';
    }

    return 'Email address format is invalid';
  }
}

/**
 * Strict Email Validator Decorator
 *
 * Validates email addresses with stricter rules than standard @IsEmail():
 * - No consecutive dots (..)
 * - Cannot start/end with dot
 * - Valid TLD (min 2 chars)
 * - RFC 5321 compliant length limits
 * - Alphanumeric domain names only
 *
 * Usage:
 * ```typescript
 * @IsStrictEmail()
 * email: string;
 * ```
 */
export function IsStrictEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrictEmailConstraint,
    });
  };
}

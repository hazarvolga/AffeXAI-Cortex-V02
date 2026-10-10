import { BadRequestException } from '@nestjs/common';

/** Defense in depth for service callers as well as validated HTTP DTOs. */
export function assertWritableFields(input: object, allowed: readonly string[]): void {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !allowed.includes(key))) {
    throw new BadRequestException('Unsupported recipient fields');
  }
}
export const subscriberWritableFields = [
  'email', 'status', 'groups', 'segments', 'firstName', 'lastName', 'company', 'phone',
  'customerStatus', 'subscriptionType', 'mailerCheckResult', 'location', 'sent', 'opens', 'clicks',
] as const;

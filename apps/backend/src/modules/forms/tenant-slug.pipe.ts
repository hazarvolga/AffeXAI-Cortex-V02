import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const TENANT_SLUG = /^[a-z0-9_-]{1,128}$/;

@Injectable()
export class TenantSlugPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!TENANT_SLUG.test(value)) {
      throw new BadRequestException('tenantId must be a valid tenant slug');
    }
    return value;
  }
}

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateCrmCustomerDto } from './update-crm-customer.dto';

describe('UpdateCrmCustomerDto', () => {
  it('does not expose protected persistence fields', async () => {
    const dto = plainToInstance(UpdateCrmCustomerDto, {
      companyName: 'XYZ Company',
      tenantId: 'tenant-b',
      id: 'replacement-id',
      resonanceScore: 1,
    });

    expect(await validate(dto, { whitelist: true })).toEqual([]);

    expect(dto).toEqual(expect.objectContaining({ companyName: 'XYZ Company' }));
    expect(dto).not.toHaveProperty('tenantId');
    expect(dto).not.toHaveProperty('id');
    expect(dto).not.toHaveProperty('resonanceScore');
  });

  it('rejects an empty company name after trimming', async () => {
    const dto = plainToInstance(UpdateCrmCustomerDto, { companyName: '   ' });
    const errors = await validate(dto);
    expect(errors.some(error => error.property === 'companyName')).toBe(true);
  });
});

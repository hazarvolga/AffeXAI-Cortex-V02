import { ConflictException, NotFoundException } from '@nestjs/common';
import { CrmService } from '../src/modules/crm/crm.service';

describe('CrmService', () => {
  let service: CrmService;
  let repo: Record<string, jest.Mock>;
  let tenantService: { getTenantId: jest.Mock };
  let leadRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    tenantService = { getTenantId: jest.fn().mockReturnValue('tenant-a') };
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((d) => ({ ...d })),
      save: jest.fn((c) => Promise.resolve(c)),
      remove: jest.fn((c) => Promise.resolve(c)),
      count: jest.fn().mockResolvedValue(0),
    };
    leadRepo = { count: jest.fn().mockResolvedValue(0) };
    service = new CrmService(repo as any, leadRepo as any, tenantService as any);
  });

  it('lists customers scoped to the active tenant', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a' },
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 50,
    });
  });

  it('throws NotFound when reading a customer outside the tenant (isolation)', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('c-404')).rejects.toThrow(NotFoundException);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'c-404', tenantId: 'tenant-a' } });
  });

  it('rejects duplicate email within the same tenant', async () => {
    repo.findOne.mockResolvedValue({ id: 'existing', email: 'john@x.com' });
    await expect(service.create({ companyName: 'John', email: 'john@x.com' })).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates customer lowercased and bound to the active tenant', async () => {
    repo.findOne.mockResolvedValue(null);
    await service.create({ email: 'John@Example.COM', firstName: 'John' } as any);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'john@example.com',
      tenantId: 'tenant-a',
    }));
    expect(repo.save).toHaveBeenCalled();
  });

  it('bulk import counts duplicates and failures without aborting the batch', async () => {
    repo.findOne
      .mockResolvedValueOnce({ id: 'existing', email: 'a@x.com' }) // duplicate check for A
      .mockResolvedValue(null); // every other lookup
    repo.save
      .mockResolvedValueOnce({ id: 'b' }) // B succeeds
      .mockRejectedValueOnce(new Error('db down')); // C fails

    const result = await service.bulkImport([
      { email: 'a@x.com' },
      { email: 'b@x.com' },
      { email: 'c@x.com' },
    ] as any);

    expect(result).toEqual({
      imported: 1,
      skipped: 2,
      errors: ['row_3: persistence_failed'],
    });
  });

  it('blocks changing email to one that already exists in the tenant', async () => {
    repo.findOne
      .mockResolvedValueOnce({ id: 'c1', email: 'old@x.com', tenantId: 'tenant-a' })
      .mockResolvedValueOnce({ id: 'c2', email: 'taken@x.com' });

    await expect(service.update('c1', { email: 'taken@x.com' })).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lowercases the new email on successful update', async () => {
    const customer = { id: 'c1', email: 'old@x.com', tenantId: 'tenant-a' };
    repo.findOne
      .mockResolvedValueOnce(customer)
      .mockResolvedValueOnce(null);
    repo.save.mockImplementation((c) => Promise.resolve(c));

    const updated = await service.update('c1', { email: 'New@X.com' });
    expect(updated.email).toBe('new@x.com');
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@x.com' }));
  });

  it('ignores protected persistence fields during update', async () => {
    const customer = {
      id: 'c1',
      email: 'old@x.com',
      companyName: 'Old Company',
      tenantId: 'tenant-a',
      resonanceScore: 0.4,
    };
    repo.findOne.mockResolvedValue(customer);
    repo.save.mockImplementation((value) => Promise.resolve(value));

    await service.update('c1', {
      companyName: 'New Company',
      tenantId: 'tenant-b',
      id: 'attacker-id',
      resonanceScore: 1,
    } as any);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'c1',
      tenantId: 'tenant-a',
      companyName: 'New Company',
      resonanceScore: 0.4,
    }));
  });

  it('maps a database uniqueness race to a safe conflict response', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.save.mockRejectedValue({ code: '23505', detail: 'private cross-tenant detail' });

    await expect(service.create({ companyName: 'XYZ', email: 'user@example.com' } as any))
      .rejects.toThrow(new ConflictException('A CRM customer with this email already exists'));
  });

  it('soft-deletes by flipping isActive instead of removing the row', async () => {
    const customer = { id: 'c1', email: 'a@x.com', isActive: true, tenantId: 'tenant-a' };
    repo.findOne.mockResolvedValue(customer);
    await service.remove('c1');
    expect(customer.isActive).toBe(false);
    expect(repo.save).toHaveBeenCalled();
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('hard delete actually removes the row', async () => {
    repo.findOne.mockResolvedValue({ id: 'c1', tenantId: 'tenant-a' });
    await service.hardDelete('c1');
    expect(repo.remove).toHaveBeenCalled();
  });

  it('blocks hard delete while a tenant lead references the customer', async () => {
    repo.findOne.mockResolvedValue({ id: 'c1', tenantId: 'tenant-a' });
    leadRepo.count.mockResolvedValue(1);
    await expect(service.hardDelete('c1')).rejects.toThrow(ConflictException);
    expect(leadRepo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', customerId: 'c1' } });
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('computes stats only from the active tenant', async () => {
    repo.count.mockImplementation(({ where }) =>
      Promise.resolve(where.isActive ? 7 : 10),
    );
    const stats = await service.getStats();
    expect(stats).toEqual({ total: 10, active: 7, inactive: 3 });
    expect(repo.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' } });
    expect(repo.count).toHaveBeenCalledWith({ where: { isActive: true, tenantId: 'tenant-a' } });
  });

  it('normalizes email and enforces tenant + active flag in customer lookup', async () => {
    repo.findOne.mockResolvedValue(null);
    const isCustomer = await service.isCustomerEmail('User@Example.COM');
    expect(isCustomer).toBe(false);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com', isActive: true, tenantId: 'tenant-a' },
    });
  });

  it('fails closed when tenant context is absent', async () => {
    tenantService.getTenantId.mockReturnValue(undefined);
    await expect(service.findAll()).rejects.toThrow('Tenant context is required');
    expect(repo.find).not.toHaveBeenCalled();
  });
});

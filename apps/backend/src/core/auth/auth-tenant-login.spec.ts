import { AuthService } from './auth.service';
import { TenantService } from '../tenant/tenant.service';

describe('tenant scoped login', () => {
  const tenant = new TenantService();
  const users = { findByEmail: jest.fn(), updateUser: jest.fn() };
  const passwords = { comparePassword: jest.fn() };
  const service = new (AuthService as any)(users, {}, passwords, {}, {}, tenant);
  beforeEach(() => jest.clearAllMocks());
  it('rejects missing tenant before looking up an account', async () => {
    await expect(service.validateUser('same@example.com', 'password')).rejects.toMatchObject({ status: 401 });
    expect(users.findByEmail).not.toHaveBeenCalled();
  });
  it('queries only the selected tenant', async () => {
    users.findByEmail.mockResolvedValue({ id: 'a', tenantId: 'tenant-a', isActive: true, emailVerified: true, password: 'hash' });
    passwords.comparePassword.mockResolvedValue(true);
    await tenant.runWithTenant({ tenantId: 'tenant-a' }, async () => {
      await expect(service.validateUser('same@example.com', 'password')).resolves.toMatchObject({ id: 'a' });
    });
    expect(users.findByEmail).toHaveBeenCalledWith('same@example.com', 'tenant-a', true);
  });
  it.each([{ tenantId: 'tenant-b', isActive: true }, { tenantId: 'tenant-a', isActive: false }])('rejects wrong tenant and inactive identities %j', async attributes => {
    users.findByEmail.mockResolvedValue({ id: 'bad', password: 'hash', ...attributes });
    passwords.comparePassword.mockResolvedValue(true);
    await tenant.runWithTenant({ tenantId: 'tenant-a' }, async () => {
      await expect(service.validateUser('same@example.com', 'password')).resolves.toBeNull();
    });
    expect(passwords.comparePassword).not.toHaveBeenCalled();
  });
  it('email existence checks cannot use a global lookup', async () => {
    await expect(service.checkEmailExists('same@example.com')).rejects.toMatchObject({ status: 401 });
    expect(users.findByEmail).not.toHaveBeenCalled();
  });
});

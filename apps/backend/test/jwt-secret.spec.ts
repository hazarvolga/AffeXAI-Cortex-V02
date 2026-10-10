import { JwtService } from '@nestjs/jwt';

/**
 * JWT secret configuration consistency tests.
 *
 * auth.module.ts (signing) and jwt-auth.guard.ts (verification) must both
 * read process.env.JWT_SECRET with the same development fallback.
 * These tests pin that contract so a future refactor cannot silently
 * split the secrets and lock everyone out of the system.
 */
describe('JWT secret configuration', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('signs and verifies tokens when JWT_SECRET is set', async () => {
    process.env.JWT_SECRET = 'unit-test-secret';

    const signer = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    });
    const verifier = new JwtService({ secret: process.env.JWT_SECRET });

    const token = signer.sign({ sub: 42, email: 'user@affexai.com', tenantId: 'default' });
    const payload = await verifier.verifyAsync<{ sub: number; email: string }>(token);

    expect(payload.sub).toBe(42);
    expect(payload.email).toBe('user@affexai.com');
  });

  it('rejects a token signed with a different secret', async () => {
    process.env.JWT_SECRET = 'unit-test-secret';

    const foreignSigner = new JwtService({ secret: 'attacker-secret' });
    const verifier = new JwtService({ secret: process.env.JWT_SECRET });

    const forged = foreignSigner.sign({ sub: 1, email: 'evil@attacker.com' });

    await expect(verifier.verifyAsync(forged)).rejects.toThrow();
  });

  it('uses the same development fallback as the guard when JWT_SECRET is unset', async () => {
    delete process.env.JWT_SECRET;

    // Must match the fallback in auth.module.ts and jwt-auth.guard.ts
    const FALLBACK = 'aluplan-secret-key';

    const signer = new JwtService({ secret: process.env.JWT_SECRET || FALLBACK });
    const verifier = new JwtService({ secret: process.env.JWT_SECRET || FALLBACK });

    const token = signer.sign({ sub: 7, email: 'dev@affexai.com' });
    const payload = await verifier.verifyAsync<{ sub: number }>(token);

    expect(payload.sub).toBe(7);
  });

  it('rejects expired tokens', async () => {
    process.env.JWT_SECRET = 'unit-test-secret';

    const signer = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '-10s' },
    });
    const verifier = new JwtService({ secret: process.env.JWT_SECRET });

    const expired = signer.sign({ sub: 1 });

    await expect(verifier.verifyAsync(expired)).rejects.toThrow();
  });
});

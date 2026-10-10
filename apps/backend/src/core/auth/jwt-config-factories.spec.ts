import legacyConfig from '../../config/jwt.config';
import coreConfig from '../config/jwt.config';

describe.each([['legacy', legacyConfig], ['core', coreConfig]] as const)('%s JWT config', (_name, factory) => {
  const previous = process.env.JWT_SECRET;
  afterEach(() => {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  });
  it('fails closed without a configured secret', () => {
    delete process.env.JWT_SECRET;
    expect(() => factory()).toThrow('JWT_SECRET');
  });
  it('preserves the explicitly configured secret', () => {
    process.env.JWT_SECRET = 'a-test-only-long-secret-over-thirty-two-characters';
    expect(factory().secret).toBe(process.env.JWT_SECRET);
  });
});

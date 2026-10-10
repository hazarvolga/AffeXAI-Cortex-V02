import { registerCurrentUser } from './registration';

describe('event registration with authenticated identity', () => {
  it('submits the current user name and email to the selected event', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    await registerCurrentUser('event-a', {
      getCurrentUser: async () => ({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }),
      register,
    });
    expect(register).toHaveBeenCalledWith('event-a', { name: 'Ada Lovelace', email: 'ada@example.com' });
  });

  it('uses email as the display name when the profile has no name', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    await registerCurrentUser('event-a', {
      getCurrentUser: async () => ({ email: 'ada@example.com' }), register,
    });
    expect(register).toHaveBeenCalledWith('event-a', { name: 'ada@example.com', email: 'ada@example.com' });
  });

  it('does not submit if the authenticated profile cannot be loaded', async () => {
    const register = jest.fn();
    await expect(registerCurrentUser('event-a', {
      getCurrentUser: async () => { throw new Error('Unauthenticated'); }, register,
    })).rejects.toThrow('Unauthenticated');
    expect(register).not.toHaveBeenCalled();
  });

  it('propagates a rejected booking instead of treating it as success', async () => {
    await expect(registerCurrentUser('event-a', {
      getCurrentUser: async () => ({ email: 'ada@example.com' }),
      register: async () => { throw new Error('Event is full'); },
    })).rejects.toThrow('Event is full');
  });
});

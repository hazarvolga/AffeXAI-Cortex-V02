interface RegistrationUser {
  firstName?: string;
  lastName?: string;
  email: string;
}

interface RegistrationServices {
  getCurrentUser: () => Promise<RegistrationUser>;
  register: (eventId: string, data: { name: string; email: string }) => Promise<unknown>;
}

/** Submit a registration using the authenticated identity; failures stay failures. */
export async function registerCurrentUser(eventId: string, services: RegistrationServices): Promise<void> {
  const user = await services.getCurrentUser();
  await services.register(eventId, {
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    email: user.email,
  });
}

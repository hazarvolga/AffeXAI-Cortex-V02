/** Socket identity is verified by the backend; a tenant is only an explicit selector. */
export function socketTransport(
  namespace: 'chat' | 'tickets' | 'notifications',
  configuredUrl: string,
  readAccessToken: () => string | null,
  tenantId?: string,
) {
  const base = configuredUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  return {
    url: namespace === 'notifications' ? base : `${base}/${namespace}`,
    auth: (callback: (credentials: { token: string | null; tenantId?: string }) => void) => {
      callback({ token: readAccessToken(), ...(tenantId ? { tenantId } : {}) });
    },
  };
}

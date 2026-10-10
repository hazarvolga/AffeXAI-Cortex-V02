/**
 * Central API Configuration for AffexAI
 * This file serves as the single source of truth for all backend connections.
 * Port 9006 is the primary fallback to match the active dev environment.
 */

const getApiBaseUrl = () => {
    // Priority 1: Environment variable
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Priority 2: Standard development fallback (Port 9006)
    return 'http://localhost:9006';
};

const getSocketBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL;
    }
    return 'http://localhost:9006';
};

export const API_CONFIG = {
    BASE_URL: getApiBaseUrl(),
    API_URL: `${getApiBaseUrl()}/api`,
    SOCKET_URL: getSocketBaseUrl(),
    ENDPOINTS: {
        HEALTH: '/api/health',
        BRAND: '/api/brand',
        USERS: '/api/users',
    }
} as const;

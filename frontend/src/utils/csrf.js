import API_BASE_URL from '../config/api';

/**
 * Fetch CSRF cookie from Laravel backend
 * This must be called before any POST, PUT, PATCH, or DELETE requests
 */
export const getCsrfToken = async () => {
    await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
        credentials: 'include'
    });
};

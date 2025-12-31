import API_BASE_URL from '../config/api';

/**
 * Enhanced fetch wrapper that adds security headers to prevent direct browser access
 * @param {string} url - The API endpoint (will be prefixed with API_BASE_URL)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const secureFetch = async (url, options = {}) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Merge headers with security headers
    const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Prevents direct browser access
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
    };

    // If body is FormData, remove Content-Type to let browser set it with boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers,
    };

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
        const response = await fetch(fullUrl, config);
        return response;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: (url, options = {}) => secureFetch(url, { ...options, method: 'GET' }),

    post: (url, data, options = {}) => secureFetch(url, {
        ...options,
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
    }),

    put: (url, data, options = {}) => secureFetch(url, {
        ...options,
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
    }),

    delete: (url, options = {}) => secureFetch(url, { ...options, method: 'DELETE' }),

    patch: (url, data, options = {}) => secureFetch(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
};

export default api;

/**
 * URL Sanitizer utility
 * Automatically removes sensitive query parameters from the browser address bar.
 */
export const sanitizeUrl = () => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const params = url.searchParams;
    const sensitiveParams = ['token', 'resetToken', 'auth_token', 'session'];

    let changed = false;
    sensitiveParams.forEach(param => {
        if (params.has(param)) {
            params.delete(param);
            changed = true;
        }
    });

    if (changed) {
        const newUrl = url.pathname + url.search + url.hash;
        window.history.replaceState({}, document.title, newUrl);
       
    }
};

export default sanitizeUrl;

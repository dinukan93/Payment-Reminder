/**
 * Logging utility that respects environment settings
 * Only logs in development mode to avoid information disclosure in production
 */

const isDevelopment = false; // Silenced by user request

export const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    error: (...args) => {
        if (isDevelopment) {
            console.error(...args);
        }
    },

    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
};

export default logger;

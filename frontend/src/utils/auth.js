// Authentication utility functions
import API_BASE_URL from '../config/api';
import logger from './logger';

/**
 * SECURITY NOTE: localStorage Usage
 * 
 * This application stores non-sensitive user data in localStorage for UI purposes only:
 * - userData: Contains user profile information (name, email, role, etc.)
 * - darkMode: Theme preference
 * 
 * IMPORTANT: No sensitive data (passwords, tokens, etc.) is stored in localStorage.
 * Authentication is handled via httpOnly cookies managed by Laravel Sanctum,
 * which are automatically sent with each request and cannot be accessed by JavaScript.
 * 
 * This approach provides:
 * - XSS protection (cookies are httpOnly)
 * - CSRF protection (via Sanctum's CSRF tokens)
 * - Persistent UI state across page refreshes
 */

// Check if user is authenticated by verifying session with backend
export const isAuthenticated = () => {
  const userData = localStorage.getItem('userData');

  if (!userData) {
    return false;
  }

  // Session validity is checked by the backend on each request
  // We rely on cookies for authentication, not tokens
  return true;
};

// Clear all session data
export const clearSession = () => {
  const darkMode = localStorage.getItem('darkMode'); // Preserve theme preference
  localStorage.clear();
  if (darkMode) {
    localStorage.setItem('darkMode', darkMode);
  }
};

// Get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    logger.error('Error parsing user data:', error);
    return null;
  }
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || 'caller';
};

// Check if user has required role
export const hasRole = (requiredRole) => {
  const userRole = getUserRole();
  return userRole === requiredRole;
};

// Authentication utility functions

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  
  if (!token || !userData) {
    return false;
  }

  // Check if token is expired (if it's a JWT)
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    
    if (Date.now() >= expirationTime) {
      // Token expired, clear session
      clearSession();
      return false;
    }
    
    return true;
  } catch (error) {
    // If token parsing fails, assume it's valid for now
    return true;
  }
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
    console.error('Error parsing user data:', error);
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

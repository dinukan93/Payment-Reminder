import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, clearSession } from '../utils/auth';
import { showWarning } from './Notifications';

const ProtectedRoute = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  useEffect(() => {
    // Check authentication on mount and set up session check interval
    if (!authenticated) {
      clearSession();
      navigate('/login', { replace: true });
      return;
    }

    // Check session every 5 minutes
    const sessionCheckInterval = setInterval(() => {
      if (!isAuthenticated()) {
        clearSession();
        showWarning('Your session has expired. Please login again.');
        navigate('/login', { replace: true });
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [authenticated, navigate]);

  // Check if user is authenticated
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Define admin roles hierarchy
  const adminRoles = ['superadmin', 'region_admin', 'rtom_admin', 'supervisor', 'admin', 'uploader'];
  const isAdminRole = adminRoles.includes(userRole);

  // Check if user has required role
  if (requiredRole) {
    let hasAccess = false;

    // Handle array of roles
    if (Array.isArray(requiredRole)) {
      hasAccess = requiredRole.includes(userRole);
    } else if (requiredRole === 'admin') {
      // Allow all admin types to access admin routes
      hasAccess = isAdminRole;
    } else if (requiredRole === 'superadmin') {
      // Only superadmin can access superadmin routes
      hasAccess = userRole === 'superadmin';
    } else if (requiredRole === 'caller') {
      // Only callers can access caller routes
      hasAccess = userRole === 'caller';
    } else {
      // Exact role match for other cases
      hasAccess = userRole === requiredRole;
    }

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      if (userRole === 'superadmin') {
        return <Navigate to="/superadmin" replace />;
      } else if (isAdminRole) {
        return <Navigate to="/admin" replace />;
      } else if (userRole === 'uploader') {
        return <Navigate to="/upload" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;

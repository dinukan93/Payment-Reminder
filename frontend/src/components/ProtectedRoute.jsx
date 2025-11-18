import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, clearSession } from '../utils/auth';

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
        alert('Your session has expired. Please login again.');
        navigate('/login', { replace: true });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [authenticated, navigate]);

  // Check if user is authenticated
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

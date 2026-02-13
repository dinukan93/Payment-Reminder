import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../utils/auth';
import { secureFetch } from '../utils/api';
import logger from '../utils/logger';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call backend logout endpoint if token exists
        await secureFetch(`/api/logout`, {
          method: 'POST'
        }).catch(err => logger.log('Logout API call failed:', err));
      } catch (error) {
        logger.log('Error during logout:', error);
      } finally {
        // Clear all authentication and session data using utility
        clearSession();

        // Redirect to login
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.2rem',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div className="spinner" style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite'
      }}></div>
      Logging out...
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Logout;

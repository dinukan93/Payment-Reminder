import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config/api';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      (async () => {
        try {
          // Decode token to get user info
          const decoded = jwtDecode(token);
          
          // Store token
          localStorage.setItem('token', token);
          
          // Fetch full user profile to get all fields including callerId
          try {
            const profileEndpoint = decoded.role === 'admin' ? '/admin/profile' : '/users/profile';
            const profileRes = await fetch(`${API_BASE_URL}${profileEndpoint}`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              const user = profileData.user || profileData;
              
              // Save complete user data including callerId/adminId
              localStorage.setItem('userData', JSON.stringify({
                id: user._id || decoded.id,
                _id: user._id || decoded.id,
                callerId: user.callerId || user.adminId || decoded.callerId || decoded.adminId,
                adminId: user.adminId,
                email: user.email || decoded.email,
                name: user.name || decoded.name,
                phone: user.phone,
                phoneNumber: user.phone,
                avatar: user.avatar || decoded.avatar,
                googleId: user.googleId,
                role: user.role || decoded.role || 'caller'
              }));
              
              console.log('✅ Google login - User data saved to localStorage:', {
                callerId: user.callerId || user.adminId,
                name: user.name,
                email: user.email
              });
            } else {
              // Fallback: use decoded data which now includes callerId/adminId
              localStorage.setItem('userData', JSON.stringify({
                id: decoded.id,
                _id: decoded.id,
                callerId: decoded.callerId || decoded.adminId,
                adminId: decoded.adminId,
                email: decoded.email,
                name: decoded.name,
                avatar: decoded.avatar,
                role: decoded.role || 'caller'
              }));
              console.warn('✅ Using decoded token data with callerId/adminId:', decoded.callerId || decoded.adminId);
            }
          } catch (profileErr) {
            console.error('Profile fetch error:', profileErr);
            // Fallback: use decoded data which now includes callerId/adminId
            localStorage.setItem('userData', JSON.stringify({
              id: decoded.id,
              _id: decoded.id,
              callerId: decoded.callerId || decoded.adminId,
              adminId: decoded.adminId,
              email: decoded.email,
              name: decoded.name,
              avatar: decoded.avatar,
              role: decoded.role || 'caller'
            }));
            console.warn('✅ Using decoded token data (profile fetch failed) with callerId/adminId:', decoded.callerId || decoded.adminId);
          }
          
          // Navigate to appropriate dashboard
          if (decoded.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          console.error('Token decode error:', err);
          navigate('/login', { replace: true });
        }
      })();
    } else {
      // no token — send to login
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column'}}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1488ee',
        borderRadius: '50%',
        marginBottom: '20px',
        animation: 'spin 1s linear infinite'
      }}></div>
      <h3>Signing you in…</h3>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthSuccess;
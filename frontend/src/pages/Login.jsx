import React, { useState } from "react";
import "./Login.css";
import logo from "../assets/logo.png";
import { FcGoogle } from "react-icons/fc";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config/api';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const endpoint = isAdminLogin ? '/auth/admin/login' : '/auth/login';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      // Login success - now show OTP input
      setMessage(data.message);
      setShowOtpInput(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isAdminLogin ? '/auth/admin/verify-otp' : '/auth/verify-otp';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, isPasswordReset: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      
      // OTP verified - decode token
      const decoded = jwtDecode(data.token);
      localStorage.setItem('token', data.token);
      
      // Fetch full user profile to get all fields including callerId
      try {
        const profileEndpoint = decoded.role === 'admin' ? '/admin/profile' : '/users/profile';
        const profileRes = await fetch(`${API_BASE_URL}${profileEndpoint}`, {
          headers: { 
            'Authorization': `Bearer ${data.token}`,
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
            callerId: user.callerId || user.adminId || data.user?.callerId || data.user?.adminId || decoded.callerId || decoded.adminId,
            adminId: user.adminId,
            email: user.email || decoded.email,
            name: user.name || decoded.name,
            phone: user.phone,
            phoneNumber: user.phone,
            avatar: user.avatar || decoded.avatar || data.user?.avatar,
            role: user.role || decoded.role || 'caller'
          }));
          
          console.log('User data saved to localStorage:', {
            callerId: user.callerId,
            name: user.name,
            email: user.email
          });
        } else {
          // Fallback: use data from token response which now includes callerId/adminId
          localStorage.setItem('userData', JSON.stringify({
            id: data.user?.id || decoded.id,
            _id: data.user?.id || decoded.id,
            callerId: data.user?.callerId || data.user?.adminId || decoded.callerId || decoded.adminId,
            adminId: data.user?.adminId,
            email: data.user?.email || decoded.email,
            name: data.user?.name || decoded.name,
            avatar: data.user?.avatar || decoded.avatar,
            role: data.user?.role || decoded.role || 'caller'
          }));
          console.warn(' Using token data with callerId/adminId:', data.user?.callerId || data.user?.adminId);
        }
      } catch (profileErr) {
        console.error('Profile fetch error:', profileErr);
        // Fallback: use data from token response which now includes callerId/adminId
        localStorage.setItem('userData', JSON.stringify({
          id: data.user?.id || decoded.id,
          _id: data.user?.id || decoded.id,
          callerId: data.user?.callerId || data.user?.adminId || decoded.callerId || decoded.adminId,
          adminId: data.user?.adminId,
          email: data.user?.email || decoded.email,
          name: data.user?.name || decoded.name,
          avatar: data.user?.avatar || decoded.avatar,
          role: data.user?.role || decoded.role || 'caller'
        }));
        console.warn(' Using token data (profile fetch failed) with callerId/adminId:', data.user?.callerId || data.user?.adminId);
      }
      
      // Redirect based on role
      if (decoded.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">

        {/* LEFT SECTION */}
        <div className="left-section">
          <img src={logo} className="logo" alt="logo" />

          <h1 className="welcome">
            Welcome! <br /> SLT <br /> Pay Reminder Portal
          </h1>
        </div>

        {/* RIGHT SECTION */}
        <div className="right-section">

          {/* LOGIN CARD */}
          <div className="login-card">
            <h2>{isAdminLogin ? 'Admin Login' : 'Login'}</h2>

            {!showOtpInput ? (
              <form onSubmit={handleSignIn}>
                <label>Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="username@gmail.com" required />

                <label>Password</label>
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" required />

                {!isAdminLogin && <span className="fp" onClick={()=>navigate('/forgot-password')}>Forgot Password?</span>}

                <button className="signin-btn" type="submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                {error && <p style={{color:'red'}}>{error}</p>}
                {message && <p style={{color:'green'}}>{message}</p>}

                {!isAdminLogin && (
                  <>
                    <p className="rg">Don't have an account? <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/register')}}>Register</a></p>

                    <p className="divider">or continue with</p>

                    <button
                      type="button"
                      onClick={() => {
                        const redirect = encodeURIComponent(window.location.origin);
                        window.location.href = `${API_BASE_URL}/auth/google?redirect=${redirect}`;
                      }}
                      className="google-btn"
                    >
                      <FcGoogle size={20} />
                    </button>
                  </>
                )}
                
                {isAdminLogin && (
                  <p className="rg" style={{marginTop:15}}>
                    <a href="#" onClick={(e)=>{e.preventDefault(); setIsAdminLogin(false); setEmail(''); setPassword(''); setError(''); setMessage('');}}>Back to user login</a>
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={verifyOtp}>
                <h3>Verify Your Identity</h3>
                <p style={{fontSize:'14px', marginBottom:'20px'}}>Enter the 6-digit code sent to your phone</p>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  placeholder="Enter 6-digit OTP" 
                  maxLength="6"
                  required 
                />
                <button type="submit" disabled={loading} className="signin-btn">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                {error && <p style={{color:'red'}}>{error}</p>}
                <p className="rg" style={{marginTop:10}}>
                  <a href="#" onClick={(e)=>{e.preventDefault(); setShowOtpInput(false); setOtp(''); setMessage(''); setError('');}}>Back to login</a>
                </p>
              </form>
            )}
          </div>

          {/* ADMIN BUTTON BELOW LOGIN CARD */}
          {!isAdminLogin && !showOtpInput && (
            <button 
              className="admin-btn" 
              onClick={() => {
                setIsAdminLogin(true);
                setEmail('');
                setPassword('');
                setError('');
                setMessage('');
              }}
            >
              <FaUserShield size={20} /> Login as Admin
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
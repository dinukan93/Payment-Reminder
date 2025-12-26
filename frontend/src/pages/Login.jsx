import React, { useState, useEffect } from "react";
import "./Login.css";
import logo from "../assets/logo.png";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { clearSession } from '../utils/auth';
import API_BASE_URL from '../config/api';
import { MdOutlineMailOutline } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear any existing session when login page loads
  useEffect(() => {
    clearSession();
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const endpoint = '/login';
      const userType = isAdminLogin ? 'admin' : 'caller';
      console.log('Login attempt:', { email, userType }); // Debug log
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType })
      });
      const data = await res.json();
      console.log('Backend response:', data); // Debug log
      if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

      // Check if OTP is required (2FA flow)
      if (data.requiresOtp) {
        setMessage(data.message || 'OTP sent to your phone');
        setShowOtpInput(true);
      } else {
        // Direct login success (legacy flow) - store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));

        // Redirect based on role
        if (data.user.role === 'superadmin') {
          navigate('/superadmin');
        } else if (data.user.role === 'uploader') {
          navigate('/upload');
        } else if (data.user.role === 'region_admin') {
          navigate('/region-admin');
        } else if (data.user.role === 'rtom_admin') {
          navigate('/rtom-admin');
        } else if (data.user.role === 'supervisor' || data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.userType === 'caller') {
          navigate('/dashboard');
        } else {
          navigate('/admin');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const userType = isAdminLogin ? 'admin' : 'caller';
      const res = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to send OTP');

      setMessage('OTP sent to your email!');
      setShowOtpInput(true);

      // Debug mode: show OTP if returned (remove in production)
      if (data.otp) {

      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const userType = isAdminLogin ? 'admin' : 'caller';
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, userType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'OTP verification failed');

      // Login success - store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      setMessage('Login successful!');

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'superadmin') {
          navigate('/superadmin');
        } else if (data.user.role === 'uploader') {
          navigate('/upload');
        } else if (data.user.role === 'region_admin') {
          navigate('/region-admin');
        } else if (data.user.role === 'rtom_admin') {
          navigate('/rtom-admin');
        } else if (data.user.role === 'supervisor' || data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.userType === 'caller') {
          navigate('/dashboard');
        } else {
          navigate('/admin');
        }
      }, 500);
    } catch (err) {
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
            Welcome! <br /> SLT <br /> Payment Reminder Portal
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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="username@gmail.com" required
                    style={{
                      paddingRight: '40px',
                      width: '100%',
                      paddingLeft: '12px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '16px',
                      marginTop: '15px',
                    }} />
                  <MdOutlineMailOutline
                    size={20}
                    color="#0066cc"
                    style={{
                      position: 'absolute',
                      right: '14px',
                      pointerEvents: 'none',
                      marginTop: '15px',
                    }}
                  />
                </div>

                <label>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Password" required
                    style={{
                      paddingRight: '40px',
                      width: '100%',
                      paddingLeft: '12px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '16px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0',
                      color: '#0066cc',
                      marginTop: '15px',
                    }}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {!isAdminLogin && <span className="fp" onClick={() => navigate('/forgot-password')}>Forgot Password?</span>}

                <button className="signin-btn" type="submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {message && <p style={{ color: 'green' }}>{message}</p>}

                {!isAdminLogin && (
                  <p className="rg">Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register') }}>Register</a></p>
                )}

                {isAdminLogin && (
                  <p className="rg" style={{ marginTop: 15 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsAdminLogin(false); setEmail(''); setPassword(''); setError(''); setMessage(''); }}>Back to user login</a>
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={verifyOtp}>
                <h3>Verify Your Identity</h3>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>Enter the 6-digit code sent to your phone</p>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />
                <button type="submit" disabled={loading} className="signin-btn">OTP
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <p className="rg" style={{ marginTop: 10 }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowOtpInput(false); setOtp(''); setMessage(''); setError(''); }}>Back to login</a>
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import logo from '../assets/logo.png';
import API_BASE_URL from '../config/api';

const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP to phone number
  const requestOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

      setShowOtpInput(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, isPasswordReset: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');

      setMessage('OTP verified successfully');

      const resetToken = data.resetToken;
      navigate('/reset-password', {
        state: {
          phone: phone,
          resetToken: resetToken
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="left-section">
          <img src={logo} className="logo" alt="logo" />
          <h1 className="welcome">Welcome! <br /> SLT <br /> Payment Reminder Portal</h1>
        </div>

        <div className="right-section">
          <div className="forgot-card">
            <h2>Forgot Password</h2>
            {!showOtpInput ? (
              <form onSubmit={requestOtp}>
                <label>Phone Number</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  type="tel"
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp}>
                <label>Verification Code</label>
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit OTP"
                  maxLength="6"
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  style={{ marginTop: '10px', backgroundColor: '#6c757d' }}
                >
                  Back
                </button>
              </form>
            )}
            {message && <p className="forgot-message" style={{ color: '#28a745' }}>{message}</p>}
            {error && <p className="forgot-message" style={{ color: '#dc3545' }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword;

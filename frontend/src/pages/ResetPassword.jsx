import React, { useState } from 'react';
import './ResetPassword.css';
import logo from '../assets/logo.png';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ResetPassword = () => {
  const location = useLocation();
  const { phone: statePhone, resetToken: stateResetToken, email: stateEmail } = location.state || {};

  const [phone, setPhone] = useState(statePhone || '');
  const [email, setEmail] = useState(stateEmail || '');
  const [resetToken, setResetToken] = useState(stateResetToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const reset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const payload = {
        newPassword,
        confirmPassword,
        resetToken
      };

      if (phone) payload.phone = phone;
      if (email) payload.email = email;

      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');

      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
          <h1 className="welcome"> Welcome! <br /> SLT <br /> Payment Reminder Portal</h1>
        </div>

        <div className="right-section">
          <div className="reset-box">
            <h2>Reset Password</h2>
            <form onSubmit={reset}>
              {phone && (
                <div>
                  <label>Phone Number</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone number"
                    type="tel"
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
              )}
              {email && (
                <div>
                  <label>Email</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    disabled
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                </div>
              )}

              <label>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  type={showPassword ? "text" : "password"}
                  required
                  style={{
                    paddingRight: '40px',
                    width: '100%',
                    paddingLeft: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '16px',
                    height: '44px',
                    boxSizing: 'border-box',
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
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 2,
                    color: '#0066cc',
                  }}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>

              <label>Confirm Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  style={{
                    paddingRight: '40px',
                    width: '100%',
                    paddingLeft: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '16px',
                    height: '44px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 2,
                    color: '#0066cc',
                  }}
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            {message && <p className="reset-message" style={{ color: '#28a745' }}>{message}</p>}
            {error && <p className="reset-message" style={{ color: '#dc3545' }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword;

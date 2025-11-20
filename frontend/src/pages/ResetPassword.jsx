import React, {useState} from 'react';
import './ResetPassword.css';
import logo from '../assets/logo.png';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

function useQuery(){
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = ()=>{
  const query = useQuery();
  const emailParam = query.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const verifyOtp = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, otp })
    });
    return res.json().then(d=>({ ok: res.ok, body: d }));
  }

  const reset = async (e) =>{
    e.preventDefault();
    setMessage('');
    try{
      const { ok, body } = await verifyOtp();
      if (!ok) throw new Error(body.message || 'Invalid OTP');
      const resetToken = body.resetToken;
      const res2 = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, resetToken, newPassword, confirmPassword })
      });
      const body2 = await res2.json();
      if (!res2.ok) throw new Error(body2.message || 'Reset failed');
      alert('Password reset successful. Please login.');
      navigate('/login');
    }catch(err){
      setMessage(err.message);
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="left-section">
          <img src={logo} className="logo" alt="logo" />
          <h1 className="welcome">Reset Password</h1>
        </div>

        <div className="right-section">
          <div className="reset-box">
            <form onSubmit={reset}>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" type="email" required />
              <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" required />
              <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" type="password" required />
              <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm password" type="password" required />
              <button type="submit">Reset Password</button>
            </form>
            {message && <p className="reset-message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword;

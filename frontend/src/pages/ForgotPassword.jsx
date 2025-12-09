import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import logo from '../assets/logo.png';
import API_BASE_URL from '../config/api';

const ForgotPassword = ()=>{
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const submit = async (e)=>{
    e.preventDefault();
    setMessage('');
    try{
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setMessage('If the email exists, an OTP was sent. Proceed to reset.');
      // navigate to reset page with email param
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    }catch(err){
      setMessage(err.message);
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="left-section">
          <img src={logo} className="logo" alt="logo" />
          <h1 className="welcome">Forgot Password</h1>
        </div>

        <div className="right-section">
          <div className="forgot-card">
            <form onSubmit={submit}>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" required />
              <button type="submit">Send OTP</button>
            </form>
            {message && <p className="forgot-message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword;

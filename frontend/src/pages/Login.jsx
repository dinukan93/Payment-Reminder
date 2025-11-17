import React, { useState } from "react";
import "./Login.css";
import logo from "../assets/logo.png";
import { FcGoogle } from "react-icons/fc";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      // store token and navigate
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
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
            <h2>Login</h2>

            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="username@gmail.com" />

            <label>Password</label>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />

            <span className="fp" onClick={()=>navigate('/forgot-password')}>Forgot Password?</span>

            <button className="signin-btn" onClick={handleSignIn}>Sign In</button>
            {error && <p style={{color:'red'}}>{error}</p>}

            <p className="rg">Don't have an account? <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/register')}}>Register</a></p>

            <p className="divider">or continue with</p>

            <button
              onClick={() => {
                // send current frontend origin as redirect so backend can redirect back to the correct port
                const redirect = encodeURIComponent(window.location.origin);
                window.location.href = `http://localhost:4000/auth/google?redirect=${redirect}`;
              }}
              className="google-btn"
            >
              <FcGoogle size={20} />
            </button>
          </div>

          {/* ADMIN BUTTON BELOW LOGIN CARD */}
          <button className="admin-btn">
            <FaUserShield size={20} /> Login as Admin</button>

        </div>
      </div>
    </div>
  );
};

export default Login;

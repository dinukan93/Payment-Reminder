import React from "react";
import "./Login.css";
import logo from "../assets/logo.png";
import { FcGoogle } from "react-icons/fc";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    // Add your authentication logic here
    navigate('/dashboard');
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
            <input type="email" placeholder="username@gmail.com" />

            <label>Password</label>
            <input type="password" placeholder="Password" />

            <span className="fp">Forgot Password?</span>

            <button className="signin-btn" onClick={handleSignIn}>Sign In</button>

            <p className="divider">or continue with</p>

            <button className="google-btn">
                <FcGoogle size={20} /> </button>
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

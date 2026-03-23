import React, { useState, useEffect } from "react";
import "./Login.css";
import logo from "../assets/logo.png";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../utils/auth";
import API_BASE_URL from "../config/api";
import { secureFetch, api } from "../utils/api";
import { MdOutlineMailOutline } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";
import logger from "../utils/logger";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectByUser = (user) => {
    if (!user) return;

    if (user.role === 'superadmin') {
      navigate('/superadmin', { replace: true });
    } else if (user.role === 'uploader') {
      navigate('/upload', { replace: true });
    } else if (user.role === 'region_admin') {
      navigate('/region-admin-dashboard', { replace: true });
    } else if (user.role === 'rtom_admin') {
      navigate('/rtom-admin-dashboard', { replace: true });
    } else if (user.role === 'supervisor' || user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (user.userType === 'caller' || user.role === 'caller') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  // If already logged in, don't keep the user on /login
  useEffect(() => {
    const existingUser = getCurrentUser();
    if (existingUser) {
      redirectByUser(existingUser);
    }
    // only re-run when route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = "/api/login";
      const userType = isAdminLogin ? "admin" : "caller";
      const res = await api.post(endpoint, { email, password, userType });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.message || "Login failed");

      // Check if login requires OTP (if user not returned, it's the first step)
      if (data.success && !data.user) {
        toast.success("Check your email for OTP", { autoClose: 5000 });
        setShowOtpInput(true);
      } else if (data.user) {
        // Direct login without OTP (session already created by backend)
        localStorage.setItem("userData", JSON.stringify(data.user));

        if (data.user.role === "superadmin") {
          navigate("/superadmin");
        } else if (data.user.role === "uploader") {
          navigate("/upload");
        } else if (data.user.role === "region_admin") {
          navigate("/region-admin-dashboard");
        } else if (data.user.role === "rtom_admin") {
          navigate("/rtom-admin-dashboard");
        } else if (
          data.user.role === "supervisor" ||
          data.user.role === "admin"
        ) {
          navigate("/admin");
        } else if (data.user.userType === "caller") {
          navigate("/dashboard");
        } else {
          navigate("/admin");
        }
      }
    } catch (err) {
      toast.error(err.message, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userType = isAdminLogin ? "admin" : "caller";
      const res = await api.post(`/api/send-otp`, { email, userType });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.message || "Failed to send OTP");

      toast.success("OTP sent to your email!", { autoClose: 5000 });
      setShowOtpInput(true);
    } catch (err) {
      toast.error(err.message, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userType = isAdminLogin ? "admin" : "caller";

      const res = await api.post(`/api/verify-otp`, { email, otp, userType });
      const data = await res.json();

      if (!res.ok)
        throw new Error(
          data.error || data.message || "OTP verification failed",
        );

      // Login success - session created by backend via cookies
      localStorage.setItem("userData", JSON.stringify(data.user));

      toast.success("Login successful!", { autoClose: 5000 });

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === "superadmin") {
          navigate("/superadmin");
        } else if (data.user.role === "uploader") {
          navigate("/upload");
        } else if (data.user.role === "region_admin") {
          navigate("/region-admin-dashboard");
        } else if (data.user.role === "rtom_admin") {
          navigate("/rtom-admin-dashboard");
        } else if (
          data.user.role === "supervisor" ||
          data.user.role === "admin"
        ) {
          navigate("/admin");
        } else if (data.user.userType === "caller") {
          navigate("/dashboard");
        } else {
          navigate("/admin");
        }
      }, 500);
    } catch (err) {
      logger.error("OTP Verification Error:", err);
      toast.error(err.message, { autoClose: 5000 });
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
            <h2>{isAdminLogin ? "Admin Login" : "Login"}</h2>

            {!showOtpInput ? (
              <form onSubmit={handleSignIn}>
                <label>Email</label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="username@gmail.com"
                    required
                    style={{
                      paddingRight: "40px",
                      width: "100%",
                      paddingLeft: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      fontSize: "16px",
                      marginTop: "15px",
                    }}
                  />
                  <MdOutlineMailOutline
                    size={20}
                    color="#0066cc"
                    style={{
                      position: "absolute",
                      right: "14px",
                      pointerEvents: "none",
                      marginTop: "15px",
                    }}
                  />
                </div>

                <label>Password</label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    style={{
                      paddingRight: "40px",
                      width: "100%",
                      paddingLeft: "12px",
                      paddingTop: "12px",
                      paddingBottom: "12px",
                      fontSize: "16px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "0",
                      color: "#0066cc",
                      marginTop: "15px",
                    }}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible size={20} />
                    ) : (
                      <AiOutlineEye size={20} />
                    )}
                  </button>
                </div>
                {!isAdminLogin && (
                  <span
                    className="fp"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot Password?
                  </span>
                )}

                <button className="signin-btn" type="submit" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </button>

                {!isAdminLogin && (
                  <p className="rg">
                    Don't have an account?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/register");
                      }}
                    >
                      Register
                    </a>
                  </p>
                )}

                {isAdminLogin && (
                  <p className="rg" style={{ marginTop: 15 }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsAdminLogin(false);
                        setEmail("");
                        setPassword("");
                      }}
                    >
                      Back to user login
                    </a>
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={verifyOtp}>
                <h3>Verify Your Identity</h3>
                <p style={{ fontSize: "14px", marginBottom: "20px" }}>
                  Enter the 6-digit code sent to your phone
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />
                <button type="submit" disabled={loading} className="signin-btn">
                  OTP
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <p className="rg" style={{ marginTop: 10 }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowOtpInput(false);
                      setOtp("");
                    }}
                  >
                    Back to login
                  </a>
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
                setEmail("");
                setPassword("");
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

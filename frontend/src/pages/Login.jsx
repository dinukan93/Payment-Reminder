import React, { useState, useEffect } from "react";
import "./Login.css";
import logo from "../assets/logo.png";
import { FaUserShield } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { clearSession, getCurrentUser } from "../utils/auth";
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
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectByUser = (user) => {
    if (!user) return;

    if (user.role === "superadmin") {
      navigate("/superadmin", { replace: true });
    } else if (user.role === "uploader") {
      navigate("/upload", { replace: true });
    } else if (user.role === "region_admin") {
      navigate("/region-admin-dashboard", { replace: true });
    } else if (user.role === "rtom_admin") {
      navigate("/rtom-admin-dashboard", { replace: true });
    } else if (user.role === "supervisor" || user.role === "admin") {
      navigate("/admin", { replace: true });
    } else if (user.userType === "caller" || user.role === "caller") {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
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

      // Direct login - user data returned
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
    } catch (err) {
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
          </div>

          {/* ADMIN BUTTON BELOW LOGIN CARD */}
          {!isAdminLogin && (
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

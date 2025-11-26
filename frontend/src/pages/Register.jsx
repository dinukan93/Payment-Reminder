import React, {useState} from 'react';
import './Register.css';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { jwtDecode } from 'jwt-decode';
import { MdOutlineMailOutline } from 'react-icons/md';
import { FaUser, FaPhone } from 'react-icons/fa';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const Register = () => {
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'' });
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const onChange = e => setForm({...form, [e.target.name]: e.target.value });

  const submit = async (e) =>{
    e.preventDefault();
    setError('');
    setMessage('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try{
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      // Registration success - now show OTP input
      setMessage(data.message);
      setShowOtpInput(true);
    }catch(err){
      setError(err.message);
    }finally{setLoading(false)}
  }

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp, isPasswordReset: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');
      
      // OTP verified - decode token and save it
      const decoded = jwtDecode(data.token);
      localStorage.setItem('token', data.token);
      
      // First, save decoded token data as baseline
      const baseUserData = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.avatar,
        role: decoded.role || 'caller'
      };
      localStorage.setItem('userData', JSON.stringify(baseUserData));
      
      // Then, try to fetch full user profile to get additional fields like callerId
      try {
        const profileRes = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: { 
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const user = profileData.user || profileData;
          
          // Merge profile data with decoded data (profile takes priority)
          const completeUserData = {
            id: user._id || decoded.id,
            _id: user._id || decoded.id,
            callerId: user.callerId || decoded.callerId,  // Get callerId from profile!
            email: user.email || decoded.email,
            name: user.name || decoded.name,
            phone: user.phone || user.number,
            avatar: user.avatar || decoded.avatar,
            role: user.role || decoded.role || 'caller'
          };
          
          localStorage.setItem('userData', JSON.stringify(completeUserData));
          
          console.log('Registration complete - User data saved to localStorage:', {
            callerId: completeUserData.callerId,
            name: completeUserData.name,
            email: completeUserData.email
          });
        } else {
          console.warn('Could not fetch full profile, using token data only');
        }
      } catch (profileErr) {
        console.error('Profile fetch error:', profileErr);
        console.log('Using decoded token data as fallback');
      }
      
      navigate('/dashboard');
    } catch(err) {
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
          <h1 className="welcome">Register for <br /> SLT Payment Reminder</h1>
        </div>

        <div className="right-section">
          <div className="register-card">
            <h2>Create Account</h2>
            {!showOtpInput ? (
              <form onSubmit={submit}>
                 {/* Full Name */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                <input 
                name="name" 
                value={form.name} 
                onChange={onChange} 
                placeholder="Full name" 
                required 
                style={{ 
                    paddingRight: '40px', 
                    width: '100%',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '16px'
                  }}
                />
                <FaUser 
                  size={16} 
                  color="#0066cc" 
                  style={{ 
                    position: 'absolute', 
                    right: '12px',
                    pointerEvents: 'none'
                  }} 
                />
                </div>
                {/* Email */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                <input 
                  name="email" 
                  value={form.email} 
                  onChange={onChange} 
                  placeholder="Email" 
                  type="email" 
                  required 
                  style={{ 
                    paddingRight: '40px', 
                    width: '100%',
                    paddingLeft: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '16px',
                    marginTop: '15px',
                  }}
                  />
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
                {/* Phone Number */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={onChange} 
                  placeholder="Phone number (94XXXXXXXXX)" 
                  required 
                  style={{ 
                    paddingRight: '40px', 
                    width: '100%',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '16px'
                  }}
                  />
                  <FaPhone 
                  size={16} 
                  color="#0066cc" 
                  style={{ 
                    position: 'absolute', 
                    right: '12px',
                    pointerEvents: 'none'
                  }} 
                />
                </div>
                
                {/* Password */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                <input 
                  name="password" 
                  value={form.password} 
                  onChange={onChange} 
                  placeholder="Password" 
                  type={showPassword ? "text" : "password"} 
                  required
                  style={{ 
                    paddingRight: '40px', 
                    paddingLeft: '12px',
                    width: '100%',
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
                }}
              >
                {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                <input 
                  name="confirmPassword" 
                  value={form.confirmPassword} 
                  onChange={onChange} 
                  placeholder="Confirm password" type={showConfirmPassword ? "text" : "password"} required 
                  style={{ 
                    paddingRight: '40px', 
                    paddingLeft: '12px',
                    width: '100%',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    fontSize: '16px'
                  }}/>
                  <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                }}>
                  {showConfirmPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                  </button>
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
                {error && <p style={{color:'red'}}>{error}</p>}
                {message && <p style={{color:'green'}}>{message}</p>}
                <p className="sn"style={{marginTop:10}}>Already have an account? <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/login')}}>Sign in</a></p>
              </form>
            ) : (
              <form onSubmit={verifyOtp}>
                <h3>Verify Your Phone</h3>
                <p style={{fontSize:'14px', marginBottom:'20px'}}>Enter the 6-digit code sent to {form.phone}</p>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  placeholder="Enter 6-digit OTP" 
                  maxLength="6"
                  required 
                />
                <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                {error && <p style={{color:'red'}}>{error}</p>}
                <p className="sn" style={{marginTop:10}}>
                  <a href="#" onClick={(e)=>{e.preventDefault(); setShowOtpInput(false); setOtp('');}}>Change phone number</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
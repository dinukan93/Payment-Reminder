import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Caller from '../models/Caller.js';
import Admin from '../models/Admin.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { sendOtpSms, generateOtp, getOtpExpiry } from '../utils/smsService.js';

// Contract
// - register(req.body: {email, password}) -> 201 { user, token }
// - login(req.body: {email, password}) -> 200 { user, token }
// - logout(req, res) -> 200 clears cookie (if used)
// - getProfile(req) -> 200 { user }

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    if (!name || !email || !phone || !password || !confirmPassword) return res.status(400).json({ message: 'All fields are required' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await Caller.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Generate unique callerId - find the highest existing callerId and increment
    let callerId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 100) {
      const lastCaller = await Caller.findOne({}, { callerId: 1 })
        .sort({ callerId: -1 })
        .limit(1);
      
      let nextNumber = 1;
      if (lastCaller && lastCaller.callerId) {
        const match = lastCaller.callerId.match(/CALLER(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      callerId = `CALLER${String(nextNumber).padStart(3, '0')}`;
      
      // Check if this callerId already exists
      const existingCaller = await Caller.findOne({ callerId });
      if (!existingCaller) {
        isUnique = true;
      } else {
        attempts++;
      }
    }
    
    if (!isUnique) {
      return res.status(500).json({ message: 'Unable to generate unique caller ID' });
    }

    // Generate OTP for phone verification
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || '10'));

    const user = await Caller.create({ 
      callerId, 
      name, 
      email, 
      phone, 
      password: hashed, 
      otp, 
      otpExpiry,
      isVerified: false
    });

    // Send OTP via SMS
    sendOtpSms(phone, otp).catch(err => {
      console.error('SMS sending failed:', err);
    });
    console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);

    res.status(201).json({ 
      message: 'Registration successful. Please verify your phone number with the OTP sent via SMS.',
      email: user.email,
      requiresOtp: true
    });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await Caller.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // If user created via Google, password may be undefined
    if (!user.password) return res.status(401).json({ message: 'Please login with Google' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate and send OTP
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || '10'));

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via SMS
    sendOtpSms(user.phone, otp).catch(err => {
      console.error('SMS sending failed:', err);
    });
    console.log(`[DEV MODE] OTP for ${user.phone}: ${otp}`);

    res.json({ 
      message: 'OTP sent to your registered phone number. Please verify to complete login.',
      email: user.email,
      requiresOtp: true
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req, res) => {
  // If using cookies, clear the cookie
  if (res.clearCookie) {
    res.clearCookie('token');
  }
  return res.json({ message: 'Logged out' });
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await Caller.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    // send email (simple nodemailer setup)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || undefined,
        pass: process.env.SMTP_PASS || undefined,
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: user.email,
      subject: 'Password reset OTP',
      text: `Your OTP for password reset is ${otp}. It is valid for 15 minutes.`
    };

    // attempt to send, but don't fail overall if email config is missing
    try {
      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.warn('Failed to send OTP email (development):', e.message);
    }

    return res.json({ message: 'OTP sent if the email exists' });
  } catch (error) {
    console.error('forgotPassword error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, isPasswordReset } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const user = await Caller.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry && user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    // If this is for password reset, return reset token
    if (isPasswordReset) {
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.token = resetToken;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.json({ message: 'OTP verified', resetToken });
    }

    // Otherwise, this is for login/registration - return JWT token
    user.isVerified = true;
    user.isLoggedIn = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, callerId: user.callerId, email: user.email, name: user.name, role: user.role || 'caller' }, 
      process.env.SECRET_KEY || 'dev_secret', 
      { expiresIn: '1d' }
    );

    return res.json({ 
      message: 'OTP verified successfully',
      user: { 
        id: user._id, 
        callerId: user.callerId,
        email: user.email, 
        name: user.name, 
        avatar: user.avatar,
        role: user.role || 'caller'
      }, 
      token 
    });
  } catch (error) {
    console.error('verifyOtp error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;
    if (!email || !resetToken || !newPassword || !confirmPassword) return res.status(400).json({ message: 'All fields are required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    const user = await Caller.findOne({ email, token: resetToken });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.token = null;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('resetPassword error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    // isAuthenticated middleware will attach req.user
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const user = await Caller.findById(req.user.id).select('-password -token');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Generate and send OTP
    const otp = generateOtp();
    const otpExpiry = getOtpExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES || '10'));

    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    await admin.save();

    // Send OTP via SMS
    sendOtpSms(admin.phone, otp).catch(err => {
      console.error('SMS sending failed:', err);
    });
    console.log(`[DEV MODE] Admin OTP for ${admin.phone}: ${otp}`);

    res.json({ 
      message: 'OTP sent to your registered phone number. Please verify to complete login.',
      email: admin.email,
      requiresOtp: true,
      isAdmin: true
    });
  } catch (error) {
    console.error('Admin login error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin OTP Verification
export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (!admin.otp || admin.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (admin.otpExpiry && admin.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    admin.isVerified = true;
    admin.isLoggedIn = true;
    admin.otp = null;
    admin.otpExpiry = null;
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, adminId: admin.adminId, email: admin.email, name: admin.name, role: 'admin' }, 
      process.env.SECRET_KEY || 'dev_secret', 
      { expiresIn: '1d' }
    );

    return res.json({ 
      message: 'OTP verified successfully',
      user: { 
        id: admin._id, 
        adminId: admin.adminId,
        callerId: admin.adminId,
        email: admin.email, 
        name: admin.name, 
        avatar: admin.avatar,
        role: 'admin'
      }, 
      token 
    });
  } catch (error) {
    console.error('verifyAdminOtp error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Email, current password, and new password are required' });
    }

    // Find user by email
    const user = await Caller.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('changePassword error', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default { register, login, logout, getProfile, forgotPassword, verifyOtp, resetPassword, adminLogin, verifyAdminOtp, changePassword };

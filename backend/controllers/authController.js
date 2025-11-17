import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Contract
// - register(req.body: {email, password}) -> 201 { user, token }
// - login(req.body: {email, password}) -> 200 { user, token }
// - logout(req, res) -> 200 clears cookie (if used)
// - getProfile(req) -> 200 { user }

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) return res.status(400).json({ message: 'All fields are required' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, phone, password: hashed });

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.SECRET_KEY || 'dev_secret', { expiresIn: '1d' });

    res.status(201).json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    //ok
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // If user created via Google, password may be undefined
    if (!user.password) return res.status(401).json({ message: 'Please login with Google' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.SECRET_KEY || 'dev_secret', { expiresIn: '1d' });

    // optional cookie
    // res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
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

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.opt = otp;
    user.optExpiry = expiry;
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
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.opt || user.opt !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.optExpiry && user.optExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    // create a short-lived token to allow password reset
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.token = resetToken;
    // clear otp fields
    user.opt = null;
    user.optExpiry = null;
    await user.save();

    return res.json({ message: 'OTP verified', resetToken });
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

    const user = await User.findOne({ email, token: resetToken });
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

    const user = await User.findById(req.user.id).select('-password -token');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default { register, login, logout, getProfile, forgotPassword, verifyOtp, resetPassword };

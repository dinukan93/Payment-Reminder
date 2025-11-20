import express from 'express';
import Caller from '../models/Caller.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'dev_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// GET caller/admin profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    let user;
    if (req.user.adminId) {
      // Admin user
      user = await Admin.findById(req.user.id).select('-password -token -otp -otpExpiry');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }
    } else {
      // Caller user
      user = await Caller.findById(req.user.id).select('-password -token -otp -otpExpiry');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Caller not found.' });
      }
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Update caller or admin profile (including avatar as base64)
router.post('/profile', async (req, res) => {
  try {
    const { callerId, adminId, name, email, phoneNumber, avatar } = req.body;
    const userId = callerId || adminId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'callerId or adminId is required.' });
    }
    
    let user;
    if (adminId) {
      // Update admin by adminId
      user = await Admin.findOne({ adminId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }
    } else {
      // Update caller by callerId
      user = await Caller.findOne({ callerId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Caller not found.' });
      }
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phone = phoneNumber;
    if (avatar !== undefined) user.avatar = avatar; // Allow empty string to clear avatar
    
    await user.save();
    res.json({ success: true, message: 'Profile updated successfully.', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

export default router;

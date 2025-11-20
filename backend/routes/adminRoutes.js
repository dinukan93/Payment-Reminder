import express from 'express';
import jwt from 'jsonwebtoken';
import { getDashboardStats, getAssignedCallers, getUnassignedCallers, getSentRequests, getWeeklyCalls, getCompletedPayments, getCallerDetails } from '../controllers/adminController.js';
import Admin from '../models/Admin.js';

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

// GET admin profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password -token -otp -otpExpiry');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.json({ success: true, user: admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Caller management
router.get('/assigned-callers', getAssignedCallers);
router.get('/unassigned-callers', getUnassignedCallers);
router.get('/callers/:id/details', getCallerDetails);

// Requests tracking
router.get('/sent-requests', getSentRequests);

// Analytics
router.get('/weekly-calls', getWeeklyCalls);
router.get('/completed-payments', getCompletedPayments);

export default router;

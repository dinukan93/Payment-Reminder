const Caller = require('../models/Caller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register new caller
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, callerId } = req.body;

    // Check if caller already exists
    const existingCaller = await Caller.findOne({ $or: [{ email }, { callerId }] });
    if (existingCaller) {
      return res.status(400).json({
        success: false,
        message: 'Caller with this email or ID already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create caller
    const caller = await Caller.create({
      name,
      email,
      password: hashedPassword,
      callerId
    });

    // Create JWT token
    const token = jwt.sign(
      { id: caller._id, callerId: caller.callerId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      data: {
        id: caller._id,
        name: caller.name,
        email: caller.email,
        callerId: caller.callerId,
        status: caller.status,
        currentLoad: caller.currentLoad,
        maxLoad: caller.maxLoad
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error registering caller',
      error: error.message
    });
  }
};

// @desc    Login caller
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if caller exists
    const caller = await Caller.findOne({ email });
    if (!caller) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, caller.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: caller._id, callerId: caller.callerId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: caller._id,
        name: caller.name,
        email: caller.email,
        callerId: caller.callerId,
        status: caller.status,
        currentLoad: caller.currentLoad,
        maxLoad: caller.maxLoad
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get caller profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get caller
    const caller = await Caller.findById(decoded.id)
      .select('-password')
      .populate('assignedCustomers');

    if (!caller) {
      return res.status(404).json({
        success: false,
        message: 'Caller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: caller
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile
};

const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

module.exports = router;

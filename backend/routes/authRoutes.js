import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import isAuthenticated from '../middleware/isAuthenticated.js';
import authController from '../controllers/authController.js';
import Caller from '../models/Caller.js';

const router = express.Router();

// Start Google OAuth flow.
// Optional `redirect` query param will be passed through the OAuth flow using the `state` parameter
// so the callback can redirect back to the actual frontend origin (useful if Vite picked a different port).
router.get('/google', (req, res, next) => {
    const redirect = req.query.redirect;
    const state = redirect ? encodeURIComponent(redirect) : undefined;
    const options = { scope: ['profile', 'email'] };
    if (state) options.state = state;
    passport.authenticate('google', options)(req, res, next);
});

// OAuth callback. Passport will populate req.user on success.
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
            try {
                const secret = process.env.SECRET_KEY || 'dev_secret';
                const token = jwt.sign({ 
                    id: req.user._id, 
                    email: req.user.email, 
                    name: req.user.name,
                    avatar: req.user.avatar,
                    role: req.user.role || 'caller'
                }, secret, { expiresIn: '1d' });

            // prefer redirect from state param if present, otherwise fallback to env Client_URL
            const state = req.query.state ? decodeURIComponent(req.query.state) : null;
            const redirectBase = state || process.env.Client_URL || 'http://localhost:5173';

            return res.redirect(`${redirectBase.replace(/\/$/, '')}/auth-success?token=${token}`);
        } catch (error) {
            console.error('Error during Google authentication callback:', error);
            const state = req.query.state ? decodeURIComponent(req.query.state) : null;
            const redirectBase = state || process.env.Client_URL || 'http://localhost:5173';
            return res.redirect(`${redirectBase.replace(/\/$/, '')}/login?error=google_failed`);
        }
    }
);
//router.post('/register', authController.register);
//router.post('/login', authController.login);
//router.post('/logout', authController.logout);

router.get('/me', isAuthenticated, async (req, res)=>{
    try {
        // fetch full caller document from DB to include avatar and other fields
        const caller = await Caller.findById(req.user.id).select('-password -token -otp -otpExpiry');
        if (!caller) return res.status(404).json({success:false, message:'Caller not found'});
        res.json({success:true, user: caller});
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({success:false, message:'Server error'});
    }
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
router.post('/admin/login', authController.adminLogin);
router.post('/admin/verify-otp', authController.verifyAdminOtp);

export default router;
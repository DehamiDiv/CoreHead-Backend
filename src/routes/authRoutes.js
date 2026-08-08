const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiters');

// POST /api/auth/register
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', authLimiter, authController.refreshToken);

// POST /api/auth/google
router.post('/google', authController.googleLogin);

// GET /api/auth/me - Get currently logged in user
router.get('/me', authMiddleware, authController.getCurrentUser);

// GET /api/auth/users - Get all users
router.get('/users', authMiddleware, authController.getAllUsers);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, authController.resetPassword);

// POST /api/auth/verify-email
router.post('/verify-email', authLimiter, authController.verifyEmail);

// POST /api/auth/resend-otp
router.post('/resend-otp', authLimiter, authController.resendOtp);

module.exports = router;

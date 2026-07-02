const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me - Get currently logged in user
router.get('/me', authMiddleware, authController.getCurrentUser);

// GET /api/auth/users - Get all users
router.get('/users', authController.getAllUsers);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

module.exports = router;

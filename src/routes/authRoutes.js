const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// GET /api/auth/me - Get currently logged in user
router.get('/me', authMiddleware, authController.getCurrentUser);

// GET /api/auth/users - Get all users
router.get('/users', authController.getAllUsers);

module.exports = router;

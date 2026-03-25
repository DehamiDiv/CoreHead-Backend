const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// ==========================================
// ROUTER LAYER (Connecting URL paths to Controllers)
// ==========================================

// When frontend hits: POST /api/auth/register -> Send it to authController.register()
router.post('/register', authController.register.bind(authController));

// When frontend hits: POST /api/auth/login -> Send it to authController.login()
router.post('/login', authController.login.bind(authController));

module.exports = router;

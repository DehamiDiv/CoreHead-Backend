const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/invite
router.post('/invite', userController.inviteUser);

// GET /api/users
router.get('/', userController.getUsers);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// POST /api/users/invite
router.post('/invite', authMiddleware, userController.inviteUser);

// GET /api/users - Get all users
router.get('/', authMiddleware, userController.getAllUsers);

// PUT /api/users/:id
router.put('/:id', authMiddleware, userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;

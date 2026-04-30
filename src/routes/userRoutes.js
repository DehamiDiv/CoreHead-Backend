const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/users - Get all users
// Only authenticated users should be able to see the user list (maybe add admin check later)
router.get('/', authMiddleware, userController.getAllUsers);

// PUT /api/users/:id - Update user
router.put('/:id', authMiddleware, userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;

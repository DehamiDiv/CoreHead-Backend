const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/users/invite
router.post('/invite', userController.inviteUser);

// GET /api/users
router.get('/', userController.getUsers);

// PUT /api/users/:id
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

module.exports = router;

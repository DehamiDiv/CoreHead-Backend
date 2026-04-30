const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

exports.inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create a new user with a dummy password for now (they should reset it in a real flow)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('temp1234', salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'Editor'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User invited successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ success: false, message: 'Server error during invitation' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      }
    });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, password, name } = req.body;

    const dataToUpdate = { email, role, name };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: { id: true, email: true, role: true, name: true }
    });

    return res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user: ' + error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};

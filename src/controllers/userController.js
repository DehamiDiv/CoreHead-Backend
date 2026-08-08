const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

/**
 * Prefer short media URLs over giant base64 data-URLs in the avatar column.
 * Empty string clears the field.
 */
function normalizeAvatar(avatar) {
  if (avatar === undefined) return undefined;
  if (avatar === null || avatar === '') return null;
  const value = String(avatar).trim();
  if (!value) return null;
  if (value.startsWith('data:') && value.length > 200_000) {
    const err = new Error(
      'Avatar image is too large. Upload via Media Library or use a smaller image (max ~150KB).'
    );
    err.statusCode = 400;
    throw err;
  }
  return value;
}

const userListSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  avatar: true,
  nicename: true,
  designation: true,
  bio: true,
  status: true,
  isEmailVerified: true,
  createdAt: true,
};

exports.inviteUser = async (req, res) => {
  try {
    const { email, password, role, name, nicename, designation, bio, avatar } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let avatarValue = null;
    try {
      avatarValue = normalizeAvatar(avatar);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ success: false, message: e.message });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'Editor',
        name,
        nicename,
        designation,
        bio,
        avatar: avatarValue,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      }
    });

  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ success: false, message: 'Server error during user creation: ' + error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: userListSelect,
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// Alias for getallusers to support the feature/user-access route naming
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: userListSelect,
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.status(200).json(users); // Returns array directly as expected by feature/user-access front-end
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, password, name, status, avatar, nicename, designation, bio } = req.body;

    const dataToUpdate = {};
    if (email !== undefined) dataToUpdate.email = email;
    if (role !== undefined) dataToUpdate.role = role;
    if (name !== undefined) dataToUpdate.name = name;
    if (avatar !== undefined) dataToUpdate.avatar = normalizeAvatar(avatar);
    if (nicename !== undefined) dataToUpdate.nicename = nicename;
    if (designation !== undefined) dataToUpdate.designation = designation;
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (status !== undefined) dataToUpdate.status = status;

    if (password) {
      if (String(password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        avatar: true,
        nicename: true,
        designation: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    const status = error.statusCode || 500;
    // Prisma P2000 = value too long for column
    const msg =
      error.code === 'P2000'
        ? 'One of the fields is too long for the database (often avatar). Use Media Library for images instead of embedding large files.'
        : error.message || 'Server error updating user';
    res.status(status).json({ success: false, message: msg, error: msg });
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

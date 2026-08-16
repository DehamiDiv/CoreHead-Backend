const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');

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

async function provisionInvitedUser(
  { email, password, role, name, nicename, designation, bio, avatar },
  {
    prismaClient = prisma,
    bcryptLib = bcrypt,
    verificationService = authService,
  } = {}
) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw Object.assign(new Error('Email and password are required'), {
      statusCode: 400,
    });
  }

  const existingUser = await prismaClient.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw Object.assign(new Error('User already exists'), { statusCode: 400 });
  }

  const salt = await bcryptLib.genSalt(10);
  const hashedPassword = await bcryptLib.hash(password, salt);
  const avatarValue = normalizeAvatar(avatar);

  const newUser = await prismaClient.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'Editor',
      name,
      nicename,
      designation,
      bio,
      avatar: avatarValue,
      isEmailVerified: false,
      status: 'active',
      provider: 'local',
    },
  });

  const verification = await verificationService.resendVerificationOtp(
    normalizedEmail
  );

  return {
    user: newUser,
    emailResult: verification.emailResult,
  };
}

exports.inviteUser = async (req, res) => {
  try {
    const { email, password, role, name, nicename, designation, bio, avatar } = req.body;

    const { user: newUser, emailResult } = await provisionInvitedUser({
      email,
      password,
      role,
      name,
      nicename,
      designation,
      bio,
      avatar,
    });

    return res.status(201).json({
      success: true,
      message: emailResult?.sent
        ? 'User created. A verification code was sent to their email.'
        : 'User created, but the verification email could not be delivered.',
      emailSent: !!emailResult?.sent,
      emailProvider: emailResult?.provider || null,
      emailError: emailResult?.error || null,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        isEmailVerified: !!newUser.isEmailVerified,
      },
    });

  } catch (error) {
    console.error('Invite user error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      message:
        status < 500
          ? error.message
          : 'Server error during user creation: ' + error.message,
    });
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

exports.provisionInvitedUser = provisionInvitedUser;

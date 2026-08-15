const prisma = require('../models/prismaClient');

const createUser = async (data) => {
    if (data.email) {
        data.email = data.email.trim().toLowerCase();
    }
    return await prisma.user.create({
        data
    });
};

const findUserByEmail = async (email) => {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    return await prisma.user.findUnique({
        where: { email: normalized }
    });
};

const findAllUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            status: true,
            isEmailVerified: true,
            provider: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

const findUserById = async (id) => {
    if (!id) return null;
    return await prisma.user.findUnique({
        where: { id: parseInt(id, 10) }
    });
};

const updateUser = async (id, data) => {
    if (!id) return null;
    if (data.email) {
        data.email = data.email.trim().toLowerCase();
    }
    return await prisma.user.update({
        where: { id: parseInt(id, 10) },
        data
    });
};

const deleteUser = async (id) => {
    if (!id) return null;
    return await prisma.user.delete({
        where: { id: parseInt(id, 10) }
    });
};

const findUserByResetToken = async (token) => {
    if (!token) return null;
    return await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: {
                gt: new Date() // Token must be greater than current time
            }
        }
    });
};

module.exports = {
    createUser,
    findUserByEmail,
    findAllUsers,
    findUserById,
    updateUser,
    deleteUser,
    findUserByResetToken
};

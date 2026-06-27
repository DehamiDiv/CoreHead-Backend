const prisma = require('../models/prismaClient');

const createUser = async (data) => {
    return await prisma.user.create({
        data
    });
};

const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email }
    });
};

const findAllUsers = async () => {
    return await prisma.user.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
};

const findUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: parseInt(id) }
    });
};

const updateUser = async (id, data) => {
    return await prisma.user.update({
        where: { id: parseInt(id) },
        data
    });
};

const deleteUser = async (id) => {
    return await prisma.user.delete({
        where: { id: parseInt(id) }
    });
};

const findUserByResetToken = async (token) => {
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

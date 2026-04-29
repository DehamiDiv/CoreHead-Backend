const prisma = require('../models/prismaClient');

const createUser = async (email, password) => {
    return await prisma.user.create({
        data: {
            email,
            password
        }
    });
};

const findUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email }
    });
};

const findUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById
};

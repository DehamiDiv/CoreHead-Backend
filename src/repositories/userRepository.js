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

const findAllUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });
};

module.exports = {
    createUser,
    findUserByEmail,
    findAllUsers
};

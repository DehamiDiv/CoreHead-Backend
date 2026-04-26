const prisma = require('../models/prismaClient');

const createUser = async (email, password) => {
    return await prisma.users.create({
        data: {
            email,
            password
        }
    });
};

const findUserByEmail = async (email) => {
    return await prisma.users.findUnique({
        where: { email }
    });
};

module.exports = {
    createUser,
    findUserByEmail
};

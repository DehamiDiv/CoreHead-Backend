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

<<<<<<< HEAD
const findUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id: parseInt(id) }
=======
const findAllUsers = async () => {
    return await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
>>>>>>> auth-complete
    });
};

module.exports = {
    createUser,
    findUserByEmail,
<<<<<<< HEAD
    findUserById
=======
    findAllUsers
>>>>>>> auth-complete
};

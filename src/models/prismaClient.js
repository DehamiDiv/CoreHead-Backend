const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.templates = prisma.template;
module.exports = prisma;

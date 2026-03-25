const { PrismaClient } = require('@prisma/client');

// Initialize a single instance of PrismaClient
// This prevents creating multiple connections to the database on every request.
const prisma = new PrismaClient();

module.exports = prisma;

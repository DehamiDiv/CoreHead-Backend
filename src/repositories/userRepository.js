const prisma = require('../models/prismaClient');

// ==========================================
// REPOSITORY LAYER (Data Access Layer)
// ==========================================
// This layer is strictly responsible for communicating directly with the database.
// It SHOULD NOT contain any complex business logic (e.g., password hashing).

class UserRepository {
  /**
   * Find a user in the database by their email.
   * @param {string} email - The email to search for.
   * @returns {Promise<Object>} The user object if found, otherwise null.
   */
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create a new user record in the database.
   * @param {Object} userData - Contains email and hashed password.
   * @returns {Promise<Object>} The created user object.
   */
  async createUser(userData) {
    return await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
      },
    });
  }

  /**
   * Find a user by their ID.
   * @param {number} id - The user ID.
   * @returns {Promise<Object>} The user object.
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }
}

module.exports = new UserRepository();

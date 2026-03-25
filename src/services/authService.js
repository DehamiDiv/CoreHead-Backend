const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

// ==========================================
// SERVICE LAYER (Business Logic Layer)
// ==========================================
// This layer is responsible for processing data, enforcing rules (e.g., passwords matching),
// hashing passwords, and generating tokens. It does NOT care about HTTP requests (req/res).

class AuthService {
  /**
   * Register a new user with hashed password.
   * @param {Object} userData - User inputs from the client (email, password).
   * @returns {Promise<Object>} The registered user object (without password).
   */
  async registerUser(userData) {
    const { email, password } = userData;

    // 1. Check if user already exists in the database
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    // 2. Hash the new user's password for security before saving
    // '10' is the cost factor; higher is more secure but slower.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save to database via Repository
    const newUser = await userRepository.createUser({
      email,
      password: hashedPassword,
    });

    // We shouldn't send the password back to the client!
    delete newUser.password;
    
    return newUser;
  }

  /**
   * Attempt to authenticate a user and generate a JWT token.
   * @param {string} email - The entered email.
   * @param {string} password - The entered plaintext password.
   * @returns {Promise<{user: Object, token: string}>} The user without password and the token.
   */
  async loginUser(email, password) {
    // 1. Verify that the user exists
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // 2. Compare the plaintext password with the hashed password in our DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    // 3. Generate a super-secret JSON Web Token (JWT)
    // The secret should be in your .env file. We fallback to 'corehead_secret' if undefined.
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'corehead_secret', 
      { expiresIn: '1d' } // Token expires in 1 day
    );

    delete user.password;

    return { user, token };
  }
}

module.exports = new AuthService();

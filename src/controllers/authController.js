const authService = require('../services/authService');

// ==========================================
// CONTROLLER LAYER (Outer Layer)
// ==========================================
// This layer is responsible for catching incoming HTTP Requests, reading the body/params,
// calling the exact Service to process it, and finally returning an HTTP Response to the client.

class AuthController {
  
  /**
   * Handle POST /api/auth/register
   * @param {Object} req - Express Request
   * @param {Object} res - Express Response
   */
  async register(req, res) {
    try {
      const { email, password } = req.body;

      // Basic validation (Is body missing email/password?)
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Delegate the actual registration work to the Service Layer
      const user = await authService.registerUser({ email, password });

      // Return a successful response
      res.status(201).json({
        message: 'User registered successfully',
        user: user,
      });

    } catch (error) {
      // Return a 400 Bad Request error if something went wrong (e.g., Email already exists)
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Handle POST /api/auth/login
   * @param {Object} req - Express Request
   * @param {Object} res - Express Response
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Delegate the logic of checking passwords / tokens to the Service Layer
      const result = await authService.loginUser(email, password);

      // Return the JSON response containing the success token!
      res.status(200).json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });

    } catch (error) {
      // Return a 401 Unauthorized if login fails
      res.status(401).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();

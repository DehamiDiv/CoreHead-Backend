const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const newUser = await authService.registerUser(email, password);
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser.id, email: newUser.email }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { user, token } = await authService.loginUser(email, password);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        // req.user contains the decoded JWT token payload (id, email) added by authMiddleware
        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser
};

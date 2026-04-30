const authService = require('../services/authService');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic presence validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Email Format Validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Strong Password Validation
        // - At least 8 characters
        // - At least one uppercase letter
        // - At least one lowercase letter
        // - At least one number
        // - At least one special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                error: 'Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
            });
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

        // The login response now includes the 'role' field.
        // This is crucial for the frontend to know if it should redirect to the /admin dashboard.
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                name: user.name, 
                avatar: user.avatar 
            }
        });
    } catch (error) {
        // 401 Unauthorized for invalid credentials
        res.status(401).json({ error: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await authService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                name: user.name, 
                avatar: user.avatar 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const userRepository = require('../repositories/userRepository');
        const users = await userRepository.findAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    getAllUsers
};

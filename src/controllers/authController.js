const authService = require('../services/authService');
const validate = require('deep-email-validator');


const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Basic presence validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Deep Email Validation (Check for typos, disposable emails, and MX records)
        const validationResult = await validate.validate(email);
        if (!validationResult.valid) {
            let errorMessage = 'Invalid email address.';
            
            const { validators } = validationResult;
            
            if (validators.typo && !validators.typo.valid && validators.typo.bestSuggestion) {
                errorMessage = `Did you mean ${validators.typo.bestSuggestion}?`;
            } else if (validators.mx && !validators.mx.valid) {
                errorMessage = 'The email domain does not exist or cannot receive emails.';
            } else if (validators.disposable && !validators.disposable.valid) {
                errorMessage = 'Disposable email addresses are not allowed.';
            } else if (validators.regex && !validators.regex.valid) {
                errorMessage = 'Please enter a valid email address format.';
            } else if (validators.smtp && !validators.smtp.valid) {
                errorMessage = 'This email account does not appear to exist.';
            }
            
            return res.status(400).json({ error: errorMessage });
        }


        // Strong Password Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                error: 'Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
            });
        }

        const newUser = await authService.registerUser(email, password, name);

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser.id, email: newUser.email, name: newUser.name }
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

        const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const { accessToken } = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({ accessToken });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        // req.user contains the decoded JWT token payload (id, email, role) added by authMiddleware
        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Please provide an email address' });
        }

        await authService.requestPasswordReset(email);

        res.status(200).json({
            message: 'Token sent to email!'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }

        await authService.resetPassword(token, password);

        res.status(200).json({
            message: 'Password reset successful!'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        await authService.verifyEmail(email, otp);

        res.status(200).json({
            message: 'Email verified successfully! You can now log in.'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    verifyEmail,
    getCurrentUser,
    forgotPassword,
    resetPassword
};

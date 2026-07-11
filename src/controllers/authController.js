const authService = require('../services/authService');
const validate = require('deep-email-validator');

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Basic presence validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Email Format Validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address format.' });
        }

        // Deep Email Validation (Check for typos, disposable emails, and MX records)
        // In local development, we don't want to block users due to offline/DNS/test domain issues,
        // so we skip blocking on MX and SMTP validations unless running in production.
        try {
            const validationResult = await validate.validate(email);
            if (!validationResult.valid) {
                const { validators } = validationResult;
                
                if (validators.regex && !validators.regex.valid) {
                    return res.status(400).json({ error: 'Please enter a valid email address format.' });
                }
                if (validators.disposable && !validators.disposable.valid) {
                    return res.status(400).json({ error: 'Disposable email addresses are not allowed.' });
                }
                if (validators.typo && !validators.typo.valid && validators.typo.bestSuggestion) {
                    return res.status(400).json({ error: `Did you mean ${validators.typo.bestSuggestion}?` });
                }
                
                // For MX/SMTP, we only reject if NODE_ENV is 'production'
                if (process.env.NODE_ENV === 'production') {
                    if (validators.mx && !validators.mx.valid) {
                        return res.status(400).json({ error: 'The email domain does not exist or cannot receive emails.' });
                    }
                    if (validators.smtp && !validators.smtp.valid) {
                        return res.status(400).json({ error: 'This email account does not appear to exist.' });
                    }
                }
            }
        } catch (validationError) {
            console.warn('Deep email validation failed to execute:', validationError.message);
        }

        // Strong Password Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                error: 'Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).' 
            });
        }

        const { user: newUser, emailResult, otp } = await authService.registerUser(
            email,
            password,
            name
        );

        const realDelivery = !!emailResult?.realDelivery || !!emailResult?.sent;
        const payload = {
            message: realDelivery
                ? 'User registered successfully. Verification code sent to your email.'
                : 'User registered successfully. Email was NOT delivered to a real inbox — use the code shown below or check the backend console.',
            user: { id: newUser.id, email: newUser.email, name: newUser.name },
            emailSent: !!emailResult?.sent,
            emailRealDelivery: realDelivery,
            emailProvider: emailResult?.provider || null,
            emailPreviewUrl: emailResult?.previewUrl || null,
            emailError: emailResult?.error || null,
        };

        // Dev convenience: when SMTP is missing, return OTP so verify can proceed
        if (
            !realDelivery &&
            authService.allowDevOtpInResponse() &&
            otp
        ) {
            payload.devOtp = otp;
            payload.message =
                'Account created. SMTP is not configured — OTP is shown below (and in the backend console). Configure EMAIL_HOST/EMAIL_USER/EMAIL_PASS for real Gmail delivery.';
        }

        res.status(201).json(payload);
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
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                name: user.name, 
                avatar: user.avatar 
            }
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

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { emailResult, otp } = await authService.resendVerificationOtp(
            String(email).trim().toLowerCase()
        );

        const realDelivery = !!emailResult?.realDelivery || !!emailResult?.sent;
        const payload = {
            message: realDelivery
                ? 'A new verification code was sent to your email.'
                : emailResult?.error ||
                  'OTP generated but email was NOT delivered. Configure SMTP or use the code below.',
            emailSent: !!emailResult?.sent,
            emailRealDelivery: realDelivery,
            emailProvider: emailResult?.provider || null,
            emailPreviewUrl: emailResult?.previewUrl || null,
            emailError: emailResult?.error || null,
        };

        if (!realDelivery && authService.allowDevOtpInResponse() && otp) {
            payload.devOtp = otp;
        }

        res.status(200).json(payload);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    verifyEmail,
    resendOtp,
    getCurrentUser,
    getAllUsers,
    forgotPassword,
    resetPassword
};

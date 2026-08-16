const authService = require('../services/authService');
const validate = require('deep-email-validator');
const prisma = require('../models/prismaClient');

// Password validation regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return 'Password is required.';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }
    if (password.length > 128) {
        return 'Password cannot exceed 128 characters.';
    }
    if (!PASSWORD_REGEX.test(password)) {
        return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. !@#$%^&*).';
    }
    return null;
}

async function validateRegistrationEmail(
    email,
    { validator = validate.validate, logger = console } = {}
) {
    const isDevDomain = email.endsWith('@example.com') || email.endsWith('@test.com') || email.endsWith('@localhost');
    if (isDevDomain) return null;

    try {
        const validationResult = await validator({
            email,
            validateRegex: true,
            validateMx: true,
            validateTypo: true,
            validateDisposable: true,
            validateSMTP: false,
        });

        if (validationResult.valid) return null;

        const validators = validationResult.validators || {};
        if (validators.regex && !validators.regex.valid) {
            return 'Please enter a valid email address format.';
        }
        if (validators.disposable && !validators.disposable.valid) {
            return 'Disposable email addresses are not allowed.';
        }
        if (validators.typo && !validators.typo.valid && validators.typo.bestSuggestion) {
            return `Did you mean ${validators.typo.bestSuggestion}?`;
        }
        if (validators.mx && !validators.mx.valid) {
            return 'The email domain does not exist or cannot receive emails.';
        }

        // SMTP results are intentionally ignored. The verification OTP proves
        // that the user controls the mailbox without rejecting valid providers.
        return null;
    } catch (validationError) {
        logger.warn('Deep email validation failed to execute:', validationError.message);
        return null;
    }
}

const register = async (req, res) => {
    try {
        let { email, password, name } = req.body;

        // Basic presence validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        email = String(email).trim().toLowerCase();

        // Name Validation (if provided)
        if (name && typeof name === 'string') {
            const trimmedName = name.trim();
            if (trimmedName.length < 2) {
                return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
            }
            if (trimmedName.length > 100) {
                return res.status(400).json({ error: 'Name cannot exceed 100 characters.' });
            }
            // Allow letters from any language, spaces, hyphens, periods, or apostrophes
            const nameRegex = /^[\p{L}\s'\-\.]+$/u;
            if (!nameRegex.test(trimmedName)) {
                return res.status(400).json({ error: 'Name can only contain letters, spaces, hyphens, periods, or apostrophes.' });
            }
        }

        // Email Format Validation (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address format.' });
        }

        // Keep deterministic checks, but let the verification OTP prove mailbox ownership.
        const emailValidationError = await validateRegistrationEmail(email);
        if (emailValidationError) {
            return res.status(400).json({ error: emailValidationError });
        }

        // Strong Password Validation
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
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
            user: newUser,
            emailSent: !!emailResult?.sent,
            emailRealDelivery: realDelivery,
            emailProvider: emailResult?.provider || null,
            emailPreviewUrl: emailResult?.previewUrl || null,
            emailError: emailResult?.error || null,
        };

        // Dev convenience: when the email provider is missing, return OTP so verify can proceed
        if (
            !realDelivery &&
            authService.allowDevOtpInResponse() &&
            otp
        ) {
            payload.devOtp = otp;
            payload.message =
                'Account created. Resend is not configured — OTP is shown below (and in the backend console). Configure RESEND_API_KEY and EMAIL_FROM for email delivery.';
        }

        res.status(201).json(payload);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        email = String(email).trim().toLowerCase();

        const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        if (error.code === 'EMAIL_NOT_VERIFIED') {
            return res.status(403).json({
                error: error.message,
                code: 'EMAIL_NOT_VERIFIED',
                email: error.email
            });
        }
        res.status(401).json({ error: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Credential ID token is required.' });
        }

        const { user, accessToken, refreshToken } = await authService.googleLogin(credential);

        res.status(200).json({
            message: 'Google login successful',
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required.' });
        }

        const result = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        let user = await authService.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Apply time-based reset if cooldown period has expired
        const COOLDOWN_MS = process.env.AI_COOLDOWN_MS
            ? parseInt(process.env.AI_COOLDOWN_MS, 10)
            : 24 * 60 * 60 * 1000;

        const now = new Date();
        const lastReset = user.last_credits_reset ? new Date(user.last_credits_reset) : new Date(user.createdAt);
        const timeDiff = Math.max(0, now.getTime() - lastReset.getTime());

        let cooldownRemaining = 0;
        if (timeDiff >= COOLDOWN_MS) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ai_credits_used: 0,
                    last_credits_reset: now
                }
            });
            console.log(`[AI-CREDITS] Cooldown reset on fetch(/me) for user: ${user.email}`);
        } else {
            cooldownRemaining = Math.max(0, Math.ceil((COOLDOWN_MS - timeDiff) / 1000));
        }

        const sanitized = authService.sanitizeUser(user);
        sanitized.cooldown_remaining = cooldownRemaining;

        res.status(200).json({
            user: sanitized
        });
    } catch (error) {
        console.error('GetCurrentUser auth check error:', error);
        res.status(500).json({ error: 'Failed to fetch user details.' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const userRepository = require('../repositories/userRepository');
        const users = await userRepository.findAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Please provide an email address.' });
        }

        email = String(email).trim().toLowerCase();
        await authService.requestPasswordReset(email);

        res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and new password are required.' });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        const user = await authService.resetPassword(token.trim(), password);

        res.status(200).json({
            message: 'Password reset successful! You can now log in with your new password.',
            user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        let { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and verification code (OTP) are required.' });
        }

        email = String(email).trim().toLowerCase();
        otp = String(otp).trim();

        const result = await authService.verifyEmail(email, otp);

        res.status(200).json({
            message: 'Email verified successfully! You are now logged in.',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const resendOtp = async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        email = String(email).trim().toLowerCase();
        const { emailResult, otp } = await authService.resendVerificationOtp(email);

        const realDelivery = !!emailResult?.realDelivery || !!emailResult?.sent;
        const payload = {
            message: realDelivery
                ? 'A new verification code has been sent to your email.'
                : emailResult?.error ||
                  'OTP generated but email was NOT delivered. Configure Resend or use the code below.',
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

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!user.password) {
            return res.status(400).json({ error: 'This account uses Google OAuth. Please use password reset to set a password.' });
        }

        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword }
        });

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    validateRegistrationEmail,
    register,
    login,
    googleLogin,
    refreshToken,
    verifyEmail,
    resendOtp,
    getCurrentUser,
    getAllUsers,
    forgotPassword,
    resetPassword,
    changePassword
};

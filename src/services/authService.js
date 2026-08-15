const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'corehead_secret_key_123';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'corehead_refresh_secret_456';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

function normalizeEmail(email) {
    if (!email) return '';
    return String(email).trim().toLowerCase();
}

function buildOtpEmailHtml(otp) {
    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">CoreHead</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Email Verification</p>
            </div>
            <p style="font-size: 15px; line-height: 24px; color: #334155;">Thank you for signing up for CoreHead. Please verify your email address by entering the following 6-digit verification code:</p>
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; color: #2563eb; letter-spacing: 10px; font-size: 36px; font-weight: 700;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 20px;">This code will expire in 15 minutes. If you did not create an account with CoreHead, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} CoreHead. All rights reserved.</p>
        </div>
    `;
}

/**
 * Whether it's safe to return the OTP in the API response (local/dev only).
 */
function allowDevOtpInResponse() {
    return process.env.NODE_ENV !== 'production';
}

function generateTokens(user) {
    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
}

function sanitizeUser(user) {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role || 'author',
        avatar: user.avatar || null,
        bio: user.bio || null,
        designation: user.designation || null,
        nicename: user.nicename || null,
        status: user.status || 'active',
        isEmailVerified: !!user.isEmailVerified,
        provider: user.provider || 'local',
        subscription_status: user.subscription_status || 'FREE',
        ai_credits: user.ai_credits ?? 5,
        ai_credits_used: user.ai_credits_used ?? 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

const registerUser = async (email, password, name) => {
    const normalizedEmail = normalizeEmail(email);

    // 1. Check if the user already exists
    const existingUser = await userRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
        throw new Error('An account with this email address already exists.');
    }

    // 2. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generate a 6-digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save the user in the database with the hashed password and OTP
    const newUser = await userRepository.createUser({
        email: normalizedEmail,
        password: hashedPassword,
        name: (name || '').trim(),
        role: 'author', // Default role for self-registration
        emailVerificationOTP: otp,
        isEmailVerified: false,
        status: 'active',
        provider: 'local'
    });

    // 5. Send verification email with OTP
    console.log(`[AUTH] Verification OTP for ${normalizedEmail}: ${otp}`);
    let emailResult = {
        sent: false,
        realDelivery: false,
        error: 'Email send was not attempted',
        provider: null,
        previewUrl: null,
    };

    try {
        emailResult = await emailService.sendEmail({
            to: normalizedEmail,
            subject: 'Verify Your Email - CoreHead',
            text: `Your verification code is: ${otp}`,
            html: buildOtpEmailHtml(otp),
        });
    } catch (error) {
        console.error('Email sending failed during signup:', error);
        emailResult = {
            sent: false,
            realDelivery: false,
            error: error.message || 'Email send failed',
            provider: null,
            previewUrl: null,
        };
    }

    return {
        user: sanitizeUser(newUser),
        emailResult,
        otp,
    };
};

/**
 * Resend a new OTP for an unverified account.
 */
const resendVerificationOtp = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        throw new Error('User not found');
    }
    if (user.isEmailVerified) {
        throw new Error('Email is already verified. You can log in.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await userRepository.updateUser(user.id, {
        emailVerificationOTP: otp,
    });

    console.log(`[AUTH] Resend verification OTP for ${normalizedEmail}: ${otp}`);
    let emailResult;
    try {
        emailResult = await emailService.sendEmail({
            to: normalizedEmail,
            subject: 'Your CoreHead verification code',
            text: `Your verification code is: ${otp}`,
            html: buildOtpEmailHtml(otp),
        });
    } catch (error) {
        console.error('Email sending failed during OTP resend:', error);
        emailResult = {
            sent: false,
            realDelivery: false,
            error: error.message || 'Email send failed',
            provider: null,
            previewUrl: null,
        };
    }

    return { emailResult, otp, user: sanitizeUser(user) };
};

const verifyEmail = async (email, otp) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.isEmailVerified) {
        const tokens = generateTokens(user);
        return {
            user: sanitizeUser(user),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            alreadyVerified: true
        };
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP.trim() !== String(otp).trim()) {
        throw new Error('Invalid verification code. Please check the code and try again.');
    }

    // Clear OTP and set verified
    const updatedUser = await userRepository.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationOTP: null
    });

    const tokens = generateTokens(updatedUser);

    return {
        user: sanitizeUser(updatedUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        alreadyVerified: false
    };
};

const loginUser = async (email, password) => {
    const normalizedEmail = normalizeEmail(email);

    // 1. Find user by email
    const user = await userRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // 2. Check if user registered via Google / has no password
    if (!user.password) {
        if (user.provider === 'google') {
            throw new Error('This account was registered using Google. Please click "Continue with Google" or reset your password.');
        }
        throw new Error('No password is set for this account. Please use password reset.');
    }

    // 3. Check if account is active
    if (user.status && user.status.toLowerCase() !== 'active') {
        throw new Error('Your account is currently deactivated. Please contact support.');
    }

    // 4. Check if the password matches the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // 5. Check if the email is verified
    if (!user.isEmailVerified) {
        const error = new Error('Please verify your email address before logging in.');
        error.code = 'EMAIL_NOT_VERIFIED';
        error.email = normalizedEmail;
        throw error;
    }

    // 6. Generate Tokens
    const { accessToken, refreshToken } = generateTokens(user);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
    };
};

const refreshAccessToken = async (token) => {
    try {
        const decoded = jwt.verify(
            token,
            REFRESH_TOKEN_SECRET
        );

        const user = await userRepository.findUserById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.status && user.status.toLowerCase() !== 'active') {
            throw new Error('Account is deactivated');
        }

        const { accessToken, refreshToken } = generateTokens(user);

        return {
            accessToken,
            refreshToken,
            user: sanitizeUser(user)
        };
    } catch (err) {
        throw new Error('Invalid or expired refresh token');
    }
};

const requestPasswordReset = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findUserByEmail(normalizedEmail);
    if (!user) {
        // Securely return without throwing error to prevent email enumeration
        return;
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await userRepository.updateUser(user.id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    console.log(`[AUTH] Password Reset Link for ${normalizedEmail}: ${resetUrl}`);

    try {
        await emailService.sendEmail({
            to: normalizedEmail,
            subject: 'Password Reset Request - CoreHead',
            text: `You requested a password reset. Please click here: ${resetUrl}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
                    <p style="font-size: 15px; line-height: 24px; color: #334155;">You requested to reset your password for your CoreHead account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #64748b; font-size: 13px; line-height: 20px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">Link URL: <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
                </div>
            `
        });
    } catch (emailError) {
        console.error("Email sending failed during password reset:", emailError.message);
    }
};

const resetPassword = async (token, newPassword) => {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findUserByResetToken(hashedToken);
    if (!user) {
        throw new Error('Invalid or expired password reset link. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await userRepository.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        isEmailVerified: true // Password reset via email validates email ownership
    });

    return sanitizeUser(updatedUser);
};

const googleLogin = async (credential) => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('xxxxxxxxx')) {
        throw new Error('Google OAuth is not configured on the backend. Please set a valid GOOGLE_CLIENT_ID in your .env file.');
    }

    let payload;
    try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
    } catch (verifyError) {
        console.error('Google token verification failed:', verifyError.message);
        throw new Error('Invalid Google credential token.');
    }

    const { email, name, picture, sub } = payload;
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    let user = await userRepository.findUserByEmail(normalizedEmail);

    if (user) {
        // Link account if registering from Google for the first time
        const updates = {};
        if (user.provider === 'local') {
            updates.provider = 'google';
            updates.providerId = sub;
            updates.isEmailVerified = true; // Google email is verified
        }
        if (!user.avatar && picture) {
            updates.avatar = picture;
        }
        if (!user.name && name) {
            updates.name = name;
        }

        if (Object.keys(updates).length > 0) {
            user = await userRepository.updateUser(user.id, updates);
        }
    } else {
        // Register a new user
        user = await userRepository.createUser({
            email: normalizedEmail,
            name: name || '',
            password: null, // nullable in DB for OAuth
            role: 'author', // Default role for self-registration
            isEmailVerified: true,
            provider: 'google',
            providerId: sub,
            avatar: picture || null,
            status: 'active'
        });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
    };
};

const getUserById = async (id) => {
    const user = await userRepository.findUserById(id);
    return user;
};

module.exports = {
    registerUser,
    resendVerificationOtp,
    verifyEmail,
    loginUser,
    googleLogin,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    getUserById,
    allowDevOtpInResponse,
    sanitizeUser,
    generateTokens,
    normalizeEmail
};

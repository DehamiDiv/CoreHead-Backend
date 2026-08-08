const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const { OAuth2Client } = require('google-auth-library');

const registerUser = async (email, password, name) => {
    // 1. Check if the user already exists
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
        throw new Error('User already exists');
    }

    // 2. Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generate a 6-digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Save the user in the database with the hashed password and OTP
    const newUser = await userRepository.createUser({
        email,
        password: hashedPassword,
        name: name || '',
        role: 'author', // Default role for self-registration
        emailVerificationOTP: otp,
        isEmailVerified: false
    });

    // 5. Send verification email with OTP
    console.log(`[AUTH] Verification OTP for ${email}: ${otp}`);
    try {
        await emailService.sendEmail({
            to: email,
            subject: 'Verify Your Email - CoreHead',
            text: `Your verification code is: ${otp}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Welcome to CoreHead!</h2>
                    <p>Thank you for signing up. Please verify your email address by entering the following code:</p>
                    <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire soon.</p>
                </div>
            `
        });
    } catch (error) {
        console.error("Email sending failed during signup:", error);
    }

    return newUser;
};

const verifyEmail = async (email, otp) => {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.emailVerificationOTP !== otp) {
        throw new Error('Invalid verification code');
    }

    // Clear OTP and set verified
    return await userRepository.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationOTP: null
    });
};

const loginUser = async (email, password) => {
    // 1. Find user by email
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // 2. Check if the password matches the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // 3. Check if the email is verified
    if (!user.isEmailVerified) {
        throw new Error('Please verify your email address before logging in.');
    }

    // 4. Generate Access Token (Short-lived: 15 minutes)
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET || 'corehead_secret_key_123', 
        { expiresIn: '15m' } 
    );

    // 5. Generate Refresh Token (Long-lived: 7 days)
    const refreshToken = jwt.sign(
        { id: user.id }, 
        process.env.REFRESH_TOKEN_SECRET || 'corehead_refresh_secret_456', 
        { expiresIn: '7d' }
    );

    return { 
        user: { id: user.id, email: user.email, role: user.role, name: user.name, avatar: user.avatar }, 
        accessToken, 
        refreshToken 
    };
};

const refreshAccessToken = async (token) => {
    try {
        const decoded = jwt.verify(
            token, 
            process.env.REFRESH_TOKEN_SECRET || 'corehead_refresh_secret_456'
        );

        const user = await userRepository.findUserById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET || 'corehead_secret_key_123', 
            { expiresIn: '15m' }
        );

        return { accessToken };
    } catch (err) {
        throw new Error('Invalid refresh token');
    }
};

const requestPasswordReset = async (email) => {
    const user = await userRepository.findUserByEmail(email);
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

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`[AUTH] Password Reset Link for ${email}: ${resetUrl}`);

    try {
        await emailService.sendEmail({
            to: email,
            subject: 'Password Reset Request - CoreHead',
            text: `You requested a password reset. Please click here: ${resetUrl}`,
            html: `<p>You requested a password reset. Please click the button below to reset your password:</p>
                   <a href="${resetUrl}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>`
        });
    } catch (emailError) {
        console.error("Email sending failed during password reset:", emailError.message);
        // Do not throw, allowing development reset using the console log link
    }
};

const resetPassword = async (token, newPassword) => {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findUserByResetToken(hashedToken);
    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepository.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
    });
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

    // Check if user already exists
    let user = await userRepository.findUserByEmail(email);

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

        if (Object.keys(updates).length > 0) {
            user = await userRepository.updateUser(user.id, updates);
        }
    } else {
        // Register a new user
        user = await userRepository.createUser({
            email,
            name: name || '',
            password: null, // nullable in DB
            role: 'author', // Default role for self-registration
            isEmailVerified: true,
            provider: 'google',
            providerId: sub,
            avatar: picture || null
        });
    }

    // Generate tokens
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'corehead_secret_key_123',
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET || 'corehead_refresh_secret_456',
        { expiresIn: '7d' }
    );

    return {
        user: { id: user.id, email: user.email, role: user.role, name: user.name, avatar: user.avatar },
        accessToken,
        refreshToken
    };
};

const getUserById = async (id) => {
    return await userRepository.findUserById(id);
};

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    googleLogin,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    getUserById
};

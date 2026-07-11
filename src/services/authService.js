const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');

function buildOtpEmailHtml(otp) {
    return `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 520px;">
            <h2 style="margin:0 0 12px">Welcome to CoreHead!</h2>
            <p>Thank you for signing up. Please verify your email address by entering the following code:</p>
            <h1 style="color: #2563eb; letter-spacing: 8px; font-size: 36px; margin: 20px 0;">${otp}</h1>
            <p style="color:#64748b;font-size:13px">This code will expire soon. If you did not create an account, you can ignore this email.</p>
        </div>
    `;
}

/**
 * Whether it's safe to return the OTP in the API response (local/dev only).
 */
function allowDevOtpInResponse() {
    return process.env.NODE_ENV !== 'production';
}

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
    let emailResult = {
        sent: false,
        realDelivery: false,
        error: 'Email send was not attempted',
        provider: null,
        previewUrl: null,
    };
    try {
        emailResult = await emailService.sendEmail({
            to: email,
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
        user: newUser,
        emailResult,
        // Always available server-side; controller only exposes in non-production when not real delivery
        otp,
    };
};

/**
 * Resend a new OTP for an unverified account.
 */
const resendVerificationOtp = async (email) => {
    const user = await userRepository.findUserByEmail(email);
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

    console.log(`[AUTH] Resend verification OTP for ${email}: ${otp}`);
    let emailResult;
    try {
        emailResult = await emailService.sendEmail({
            to: email,
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

    return { emailResult, otp, user };
};

const verifyEmail = async (email, otp) => {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.isEmailVerified) {
        return user;
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== String(otp).trim()) {
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
        throw new Error('If an account with that email exists, a reset link has been sent.');
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await userRepository.updateUser(user.id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request - CoreHead',
        text: `You requested a password reset. Please click here: ${resetUrl}`,
        html: `<p>You requested a password reset. Please click the button below to reset your password:</p>
               <a href="${resetUrl}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>`
    });
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

const getUserById = async (id) => {
    return await userRepository.findUserById(id);
};

module.exports = {
    registerUser,
    resendVerificationOtp,
    verifyEmail,
    loginUser,
    requestPasswordReset,
    resetPassword,
    refreshAccessToken,
    getUserById,
    allowDevOtpInResponse,
};

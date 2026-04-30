const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');

const registerUser = async (email, password, name) => {
    // 1. Check if user already exists
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
        throw new Error('User already exists with this email');
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user in the database
    const newUser = await userRepository.createUser(email, hashedPassword, name);
    
    return newUser;
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

    // 3. Generate Access Token (Short-lived: 15 minutes)
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET || 'corehead_secret_key_123', 
        { expiresIn: '15m' } 
    );

    // 4. Generate Refresh Token (Long-lived: 7 days)
    const refreshToken = jwt.sign(
        { id: user.id }, 
        process.env.REFRESH_TOKEN_SECRET || 'corehead_refresh_secret_456', 
        { expiresIn: '7d' }
    );

    return { 
        user: { id: user.id, email: user.email, role: user.role, name: user.name }, 
        accessToken, 
        refreshToken 
    };
};

const refreshAccessToken = async (token) => {
    try {
        // 1. Verify the refresh token
        const decoded = jwt.verify(
            token, 
            process.env.REFRESH_TOKEN_SECRET || 'corehead_refresh_secret_456'
        );

        // 2. Find user
        const user = await userRepository.findUserById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        // 3. Generate a new Access Token
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
    // 1. Find user by email
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
        throw new Error('There is no user with that email address');
    }

    // 2. Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash token and set to resetPasswordToken field
    // We use a hashed version for storage to prevent leaks
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 4. Set expiry (e.g., 10 minutes)
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Save to database
    await userRepository.updateUser(user.id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiry
    });

    // 6. Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const message = `Forgot your password? Click here to reset it: ${resetUrl}\nIf you didn't forget your password, please ignore this email!`;

    try {
        await emailService.sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message,
            html: `<p>Forgot your password? Click the link below to reset it:</p><a href="${resetUrl}">${resetUrl}</a><p>If you didn't forget your password, please ignore this email!</p>`
        });
    } catch (err) {
        // If email fails, clear reset fields
        await userRepository.updateUser(user.id, {
            resetPasswordToken: null,
            resetPasswordExpires: null
        });
        throw new Error('There was an error sending the email. Try again later.');
    }
};

const resetPassword = async (token, password) => {
    // 1. Hash the incoming token to match stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find user with this token and check if it hasn't expired
    const user = await userRepository.findUserByResetToken(hashedToken);
    if (!user) {
        throw new Error('Token is invalid or has expired');
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Update password and clear reset fields
    await userRepository.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
    });

    return user;
};

module.exports = {
    registerUser,
    loginUser,
    requestPasswordReset,
    resetPassword
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const registerUser = async (email, password) => {
    // 1. Check if user already exists
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
        throw new Error('User already exists with this email');
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user in the database
    const newUser = await userRepository.createUser(email, hashedPassword);
    
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

    // 3. Generate JWT Token
    // We use process.env.JWT_SECRET (ensure you have this in .env)
    const token = jwt.sign(
        { id: user.id, email: user.email }, 
        process.env.JWT_SECRET || 'corehead_secret_key_123', 
        { expiresIn: '1d' } // Token expires in 1 day
    );

    return { user, token };
};

module.exports = {
    registerUser,
    loginUser
};

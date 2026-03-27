const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // 1. Get the token from the header (Format: "Bearer <token>")
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify the token using the environment secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'corehead_secret_key_123');
        
        // 3. Attach the decoded user data (like user ID and email) to the request object
        req.user = decoded;

        // 4. Move to the next function (the actual route handler)
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;

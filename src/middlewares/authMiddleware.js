const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // 1. Get the token from the header (Format: "Bearer <token>")
        const authHeader = req.header('Authorization') || req.headers['authorization'];
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access denied. Token malformed.' });
        }

        // 2. Verify the token using the environment secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'corehead_secret_key_123');
        
        // 3. Attach the decoded user data (like user ID, email, role) to the request object
        req.user = decoded;

        // 4. Move to the next function
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please log in or refresh token.',
                isExpired: true
            });
        }
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;

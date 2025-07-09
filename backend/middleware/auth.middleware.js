const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY;

// Admin credentials from environment
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access denied. No token provided.',
            hint: 'Include Authorization header with Bearer token'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token has expired',
                hint: 'Please login again to get a new token'
            });
        }
        
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            hint: 'Please provide a valid JWT token'
        });
    }
};

// Function to validate admin credentials
const validateAdminCredentials = async (username, password) => {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        throw new Error('Admin credentials not configured in environment variables');
    }

    // Check username
    if (username !== ADMIN_USERNAME) {
        return false;
    }

    // For security, hash the stored password if it's not already hashed
    // Note: In production, you should store hashed passwords
    try {
        // Try to compare as plain text first (for development)
        if (password === ADMIN_PASSWORD) {
            return true;
        }
        
        // If that fails, try bcrypt comparison (for production)
        const isValid = await bcrypt.compare(password, ADMIN_PASSWORD);
        return isValid;
    } catch (error) {
        console.error('Error validating credentials:', error.message);
        return false;
    }
};

// Function to generate JWT token
const generateToken = (user) => {
    const payload = {
        username: user.username,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Function to verify token (for use in controllers)
const verifyTokenSync = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    verifyToken,
    validateAdminCredentials,
    generateToken,
    verifyTokenSync,
    JWT_SECRET,
    JWT_EXPIRY
}; 
const { validateAdminCredentials, generateToken, verifyTokenSync } = require('../middleware/auth.middleware');

// Login controller
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                hint: 'Provide both username and password in request body'
            });
        }

        // Validate credentials
        const isValid = await validateAdminCredentials(username, password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                hint: 'Check your username and password'
            });
        }

        // Generate JWT token
        const token = generateToken({ username });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    username,
                    role: 'admin'
                },
                expiresIn: process.env.JWT_EXPIRY || '24h'
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error during login',
            details: error.message
        });
    }
};

// Verify token controller
const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
                hint: 'Include Authorization header with Bearer token'
            });
        }

        // Verify token
        const decoded = verifyTokenSync(token);

        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: {
                    username: decoded.username,
                    role: decoded.role
                },
                tokenValid: true,
                expiresAt: new Date(decoded.exp * 1000).toISOString()
            }
        });

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

// Get current user info (protected route)
const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        res.json({
            success: true,
            message: 'User information retrieved successfully',
            data: {
                user: {
                    username: req.user.username,
                    role: req.user.role
                }
            }
        });
    } catch (error) {
        console.error('Get current user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get user information',
            details: error.message
        });
    }
};

module.exports = {
    login,
    verifyToken,
    getCurrentUser
}; 
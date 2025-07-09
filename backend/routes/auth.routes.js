const express = require('express');
const router = express.Router();
const { login, verifyToken, getCurrentUser } = require('../controllers/auth.controller');
const { verifyToken: authMiddleware } = require('../middleware/auth.middleware');

// Public routes
router.post('/auth/login', login);
router.get('/auth/verify-token', verifyToken);

// Protected routes (require authentication)
router.get('/auth/me', authMiddleware, getCurrentUser);

// Health check for auth routes
router.get('/auth/health', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication service is running',
        timestamp: new Date().toISOString()
    });
});



module.exports = router; 
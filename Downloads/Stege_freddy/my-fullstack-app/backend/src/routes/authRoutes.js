const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware: protect, isAdmin: authorize } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters')
        .isLength({ min: 6 }),
    check('roleId', 'Role ID is required').not().isEmpty()
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

module.exports = router;
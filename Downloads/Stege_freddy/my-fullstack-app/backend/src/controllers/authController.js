const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { validationResult } = require('express-validator');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Admin only
 */
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, roleId } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            roleId
        });

        // Fetch user with role information
        const userWithRole = await User.findByPk(user.id, {
            include: [{ model: Role }]
        });

        res.status(201).json({
            id: userWithRole.id,
            username: userWithRole.username,
            email: userWithRole.email,
            role: userWithRole.Role.name,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Error registering user',
            error: error.message 
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check user exists
        const user = await User.findOne({
            where: { email },
            include: [{ model: Role }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Generate token
        const JWT_SECRET = 'learning_platform_jwt_secret';
        
        const token = jwt.sign(
            { 
                id: user.id,
                role: user.Role.name,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            accessToken: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.Role.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.userId, {
            include: [{ model: Role }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign(
            { userId: user.id, role: user.Role.name },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};
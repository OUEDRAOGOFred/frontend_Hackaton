const { User, Role } = require('../models');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all users (with pagination)
 * @route   GET /api/users
 * @access  Admin
 */
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const { rows: users, count } = await User.findAndCountAll({
            include: [{ model: Role }],
            limit,
            offset,
            attributes: { exclude: ['password'] }
        });

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalUsers: count
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Admin or Self
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [{ model: Role }],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is admin or requesting their own profile
        if (req.user.Role.name !== 'admin' && req.user.id !== user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Role }],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Admin or Self
 */
exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is admin or updating their own profile
        if (req.user.Role.name !== 'admin' && req.user.id !== user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { username, email, isActive } = req.body;
        
        // Only admin can update role and active status
        if (req.user.Role.name === 'admin') {
            if (req.body.roleId) user.roleId = req.body.roleId;
            if (typeof isActive === 'boolean') user.isActive = isActive;
        }

        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();

        const updatedUser = await User.findByPk(user.id, {
            include: [{ model: Role }],
            attributes: { exclude: ['password'] }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Admin only
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Role }],
            attributes: { exclude: ['password'] }
        });

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
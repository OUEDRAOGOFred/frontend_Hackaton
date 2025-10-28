const { Token, User, Role } = require('../models');
const { validationResult } = require('express-validator');

/**
 * @desc    Award tokens to user
 * @route   POST /api/tokens/award
 * @access  Teacher, Admin
 */
exports.awardTokens = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, type, value } = req.body;

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create token award
        const token = await Token.create({
            userId,
            type,
            value,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days expiry
        });

        res.status(201).json(token);
    } catch (error) {
        console.error('Award tokens error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get user's tokens
 * @route   GET /api/tokens/user/:userId
 * @access  Private
 */
exports.getUserTokens = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if user has permission to view tokens
        if (req.user.Role.name !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const tokens = await Token.findAll({
            where: { 
                userId,
                expiresAt: {
                    [Op.gt]: new Date() // Only non-expired tokens
                }
            },
            order: [['createdAt', 'DESC']]
        });

        // Calculate total tokens by type
        const tokenSummary = tokens.reduce((acc, token) => {
            if (!acc[token.type]) {
                acc[token.type] = 0;
            }
            acc[token.type] += token.value;
            return acc;
        }, {});

        res.json({
            tokens,
            summary: tokenSummary
        });
    } catch (error) {
        console.error('Get user tokens error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get token leaderboard
 * @route   GET /api/tokens/leaderboard
 * @access  Private
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const type = req.query.type; // Optional filter by token type
        const limit = parseInt(req.query.limit, 10) || 10;

        let whereClause = {
            expiresAt: {
                [Op.gt]: new Date()
            }
        };

        if (type) {
            whereClause.type = type;
        }

        const leaderboard = await Token.findAll({
            attributes: [
                'userId',
                [sequelize.fn('sum', sequelize.col('value')), 'total']
            ],
            where: whereClause,
            include: [{
                model: User,
                attributes: ['username', 'email'],
                include: [{
                    model: Role,
                    attributes: ['name']
                }]
            }],
            group: ['userId', 'User.id', 'User.Role.id'],
            order: [[sequelize.fn('sum', sequelize.col('value')), 'DESC']],
            limit
        });

        res.json(leaderboard);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get token statistics
 * @route   GET /api/tokens/stats
 * @access  Admin
 */
exports.getTokenStats = async (req, res) => {
    try {
        const stats = await Token.findAll({
            attributes: [
                'type',
                [sequelize.fn('count', sequelize.col('id')), 'count'],
                [sequelize.fn('sum', sequelize.col('value')), 'total'],
                [sequelize.fn('avg', sequelize.col('value')), 'average']
            ],
            group: ['type']
        });

        const totalUsers = await User.count({
            where: {
                '$Tokens.id$': {
                    [Op.not]: null
                }
            },
            include: [{
                model: Token,
                attributes: []
            }]
        });

        res.json({
            stats,
            totalUsers
        });
    } catch (error) {
        console.error('Get token stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Revoke token
 * @route   DELETE /api/tokens/:id
 * @access  Admin
 */
exports.revokeToken = async (req, res) => {
    try {
        const token = await Token.findByPk(req.params.id);

        if (!token) {
            return res.status(404).json({ message: 'Token not found' });
        }

        await token.destroy();
        res.json({ message: 'Token revoked successfully' });
    } catch (error) {
        console.error('Revoke token error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
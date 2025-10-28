const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tokenController = require('../controllers/tokenController');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const awardTokenValidation = [
    check('userId', 'User ID is required').isNumeric(),
    check('type', 'Token type is required').isIn(['quiz', 'forum', 'peer_review', 'help']),
    check('value', 'Token value must be a positive number').isInt({ min: 1 })
];

// Routes
router.post('/award', [
    protect, 
    authorize('admin', 'teacher'), 
    awardTokenValidation
], tokenController.awardTokens);

router.get('/user/:userId', protect, tokenController.getUserTokens);
router.get('/leaderboard', protect, tokenController.getLeaderboard);
router.get('/stats', [protect, authorize('admin')], tokenController.getTokenStats);
router.delete('/:id', [protect, authorize('admin')], tokenController.revokeToken);

module.exports = router;
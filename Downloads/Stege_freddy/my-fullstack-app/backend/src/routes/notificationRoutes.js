const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { authMiddleware: protect, authorize } = require('../middleware/auth');

// Validation middleware
const notificationValidation = [
    check('userId', 'User ID is required').isNumeric(),
    check('message', 'Message is required').not().isEmpty(),
    check('type', 'Valid notification type is required').isIn(['email', 'sms', 'push', 'calendar']),
    check('scheduledFor').optional().isISO8601().toDate()
];

// Routes
router.post('/send', [
    protect,
    authorize('admin', 'teacher'),
    notificationValidation
], notificationController.sendNotification);

router.get('/', protect, notificationController.getNotifications);

router.post('/process-pending', [
    protect,
    authorize('admin')
], notificationController.processPendingNotifications);

module.exports = router;
const { Notification, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Configuration email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'test@example.com',
        pass: process.env.SMTP_PASS || 'password'
    }
});

// Configuration Twilio (seulement si les variables d'environnement sont définies)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
    );
}

/**
 * @desc    Send notification
 * @route   POST /api/notifications/send
 * @access  Private
 */
exports.sendNotification = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, message, type } = req.body;

        // Créer la notification en base de données uniquement
        const notification = await Notification.create({
            userId,
            message,
            type,
            status: 'sent',
            sentAt: new Date()
        });

        return res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error in sendNotification:', error);
        return res.status(500).json({
            success: false,
            error: 'Error sending notification'
        });
    }
};

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const { rows: notifications, count } = await Notification.findAndCountAll({
            where: { userId: req.user.id },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'message', 'type', 'status', 'createdAt']
        });

        res.json({
            success: true,
            notifications,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalNotifications: count
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur lors de la récupération des notifications',
            error: error.message 
        });
    }
};

/**
 * @desc    Process pending notifications
 * @route   POST /api/notifications/process-pending
 * @access  Admin
 */
exports.processPendingNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                status: 'pending',
                scheduledFor: {
                    [Op.lte]: new Date()
                }
            },
            include: [{ model: User }]
        });

        for (const notification of notifications) {
            await sendNotificationByType(notification);
        }

        res.json({ message: `Processed ${notifications.length} notifications` });
    } catch (error) {
        console.error('Process notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to send notifications based on type
async function sendNotificationByType(notification) {
    const user = await User.findByPk(notification.userId);
    
    switch (notification.type) {
        case 'email':
            await sendEmail(user.email, notification.message);
            break;
        case 'sms':
            if (user.phone) {
                await sendSMS(user.phone, notification.message);
            }
            break;
        case 'push':
            // Implement push notification logic here
            break;
        case 'calendar':
            await addCalendarEvent(user, notification);
            break;
    }

    notification.status = 'sent';
    await notification.save();
}

// Helper function to send emails
async function sendEmail(to, message) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'Notification from Learning Platform',
        text: message,
        html: `<p>${message}</p>`
    });
}

// Helper function to send SMS
async function sendSMS(to, message) {
    if (!twilioClient) {
        console.log('Twilio not configured, SMS simulation:', { to, message });
        return;
    }
    await twilioClient.messages.create({
        body: message,
        to,
        from: process.env.TWILIO_PHONE_NUMBER
    });
}

// Helper function to add calendar events
async function addCalendarEvent(user, notification) {
    // Implement calendar integration logic here
    // This could integrate with Google Calendar, Outlook, etc.
    console.log('Calendar integration not implemented yet');
}
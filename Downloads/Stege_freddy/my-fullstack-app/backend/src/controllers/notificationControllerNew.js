const { Notification, User } = require('../models/businessModels');
const emailService = require('../services/emailService');

/**
 * Crée une nouvelle notification et envoie un email
 */
const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type = 'info', priority = 'normal' } = req.body;

        // Validation des données
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'userId, title et message sont requis'
            });
        }

        // Récupérer les informations de l'utilisateur pour l'email
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur introuvable'
            });
        }

        // Créer la notification
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            priority,
            isRead: false,
            createdAt: new Date()
        });

        // Envoyer l'email de notification
        try {
            await emailService.sendNotificationEmail(
                user.email,
                title,
                message,
                type
            );
            console.log(`📧 Email de notification envoyé à ${user.email}`);
        } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
            // On continue même si l'email échoue
        }

        res.status(201).json({
            success: true,
            message: 'Notification créée et email envoyé avec succès',
            data: notification
        });

    } catch (error) {
        console.error('Erreur création notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la notification',
            error: error.message
        });
    }
};

/**
 * Crée des notifications en masse avec envoi d'emails
 */
const createBulkNotifications = async (req, res) => {
    try {
        const { userIds, title, message, type = 'info', priority = 'normal' } = req.body;

        if (!userIds || !Array.isArray(userIds) || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'userIds (array), title et message sont requis'
            });
        }

        // Récupérer tous les utilisateurs
        const users = await User.findAll({
            where: { id: userIds }
        });

        // Créer les notifications
        const notificationsData = userIds.map(userId => ({
            userId,
            title,
            message,
            type,
            priority,
            isRead: false,
            createdAt: new Date()
        }));

        const notifications = await Notification.bulkCreate(notificationsData);

        // Envoyer les emails en parallèle
        const emailPromises = users.map(user => 
            emailService.sendNotificationEmail(user.email, title, message, type)
                .catch(error => {
                    console.error(`❌ Erreur email pour ${user.email}:`, error);
                    return null; // Continue même si un email échoue
                })
        );

        await Promise.all(emailPromises);

        res.status(201).json({
            success: true,
            message: `${notifications.length} notifications créées et emails envoyés`,
            data: notifications
        });

    } catch (error) {
        console.error('Erreur création notifications en masse:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création des notifications',
            error: error.message
        });
    }
};

/**
 * Récupère les notifications d'un utilisateur
 */
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0, isRead } = req.query;

        const whereClause = { userId };
        if (isRead !== undefined) {
            whereClause.isRead = isRead === 'true';
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: notifications.rows,
            total: notifications.count,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                totalPages: Math.ceil(notifications.count / limit)
            }
        });

    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des notifications',
            error: error.message
        });
    }
};

/**
 * Marque une notification comme lue
 */
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification introuvable'
            });
        }

        await notification.update({ isRead: true, readAt: new Date() });

        res.json({
            success: true,
            message: 'Notification marquée comme lue',
            data: notification
        });

    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du marquage de la notification',
            error: error.message
        });
    }
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
const markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await Notification.update(
            { isRead: true, readAt: new Date() },
            { 
                where: { 
                    userId, 
                    isRead: false 
                } 
            }
        );

        res.json({
            success: true,
            message: `${result[0]} notifications marquées comme lues`,
            updatedCount: result[0]
        });

    } catch (error) {
        console.error('Erreur marquage toutes notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du marquage des notifications',
            error: error.message
        });
    }
};

/**
 * Supprime une notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification introuvable'
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: 'Notification supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la notification',
            error: error.message
        });
    }
};

/**
 * Récupère les statistiques des notifications
 */
const getNotificationStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await Notification.findAll({
            where: { userId },
            attributes: [
                [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'total'],
                [Notification.sequelize.fn('SUM', Notification.sequelize.literal('CASE WHEN isRead = false THEN 1 ELSE 0 END')), 'unread'],
                [Notification.sequelize.fn('SUM', Notification.sequelize.literal('CASE WHEN isRead = true THEN 1 ELSE 0 END')), 'read']
            ],
            raw: true
        });

        res.json({
            success: true,
            data: {
                total: parseInt(stats[0].total) || 0,
                unread: parseInt(stats[0].unread) || 0,
                read: parseInt(stats[0].read) || 0
            }
        });

    } catch (error) {
        console.error('Erreur statistiques notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * Crée une notification système avec email
 */
const createSystemNotification = async (req, res) => {
    try {
        const { title, message, type = 'info', priority = 'high', targetRole } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title et message sont requis'
            });
        }

        // Récupérer les utilisateurs selon le rôle ciblé
        let whereClause = {};
        if (targetRole) {
            whereClause.role = targetRole;
        }

        const users = await User.findAll({ where: whereClause });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucun utilisateur trouvé pour le rôle spécifié'
            });
        }

        // Créer les notifications
        const notificationsData = users.map(user => ({
            userId: user.id,
            title: `📢 Système: ${title}`,
            message,
            type,
            priority,
            isRead: false,
            createdAt: new Date()
        }));

        const notifications = await Notification.bulkCreate(notificationsData);

        // Envoyer les emails
        const emailPromises = users.map(user => 
            emailService.sendNotificationEmail(
                user.email, 
                `📢 Système: ${title}`, 
                message, 
                type
            ).catch(error => {
                console.error(`❌ Erreur email système pour ${user.email}:`, error);
                return null;
            })
        );

        await Promise.all(emailPromises);

        res.status(201).json({
            success: true,
            message: `Notification système envoyée à ${users.length} utilisateur(s)`,
            data: {
                notificationsCreated: notifications.length,
                targetUsers: users.length,
                targetRole: targetRole || 'tous'
            }
        });

    } catch (error) {
        console.error('Erreur notification système:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la notification système',
            error: error.message
        });
    }
};

module.exports = {
    createNotification,
    createBulkNotifications,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats,
    createSystemNotification
};
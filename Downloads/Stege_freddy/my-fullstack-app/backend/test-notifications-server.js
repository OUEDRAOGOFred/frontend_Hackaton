/**
 * Test de l'API notifications avec envoi d'emails
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Simulation des modèles pour les tests
const mockUser = {
    id: 1,
    email: 'freddyouedraogo104@gmail.com',
    firstName: 'Freddy',
    lastName: 'OUEDRAOGO',
    role: 'student'
};

const mockNotifications = [];

// Mock des modèles Sequelize
const mockModels = {
    Notification: {
        create: async (data) => {
            const notification = { id: Date.now(), ...data };
            mockNotifications.push(notification);
            return notification;
        },
        bulkCreate: async (dataArray) => {
            const notifications = dataArray.map(data => ({ id: Date.now() + Math.random(), ...data }));
            mockNotifications.push(...notifications);
            return notifications;
        },
        findByPk: async (id) => mockNotifications.find(n => n.id == id),
        findAndCountAll: async (options) => ({
            rows: mockNotifications.filter(n => n.userId == options.where.userId).slice(0, options.limit),
            count: mockNotifications.filter(n => n.userId == options.where.userId).length
        }),
        findAll: async (options) => mockNotifications
    },
    User: {
        findByPk: async (id) => id == 1 ? mockUser : null,
        findAll: async (options) => [mockUser]
    }
};

// Mock du module models
require.cache[require.resolve('./src/models/businessModels')] = {
    exports: mockModels
};

const notificationController = require('./src/controllers/notificationControllerNew');

const app = express();
app.use(cors());
app.use(express.json());

// Routes de test
app.post('/api/notifications', notificationController.createNotification);
app.post('/api/notifications/bulk', notificationController.createBulkNotifications);
app.post('/api/notifications/system', notificationController.createSystemNotification);
app.get('/api/notifications/:userId', notificationController.getUserNotifications);

// Endpoint de test
app.get('/test', (req, res) => {
    res.json({
        message: '🚀 Serveur de test notifications-email démarré',
        endpoints: [
            'POST /api/notifications - Créer une notification avec email',
            'POST /api/notifications/bulk - Créer plusieurs notifications',
            'POST /api/notifications/system - Notification système',
            'GET /api/notifications/:userId - Récupérer les notifications'
        ],
        sampleData: {
            createNotification: {
                userId: 1,
                title: 'Nouveau devoir disponible',
                message: 'Un nouveau devoir "Exercices JavaScript" a été publié.',
                type: 'info',
                priority: 'normal'
            },
            systemNotification: {
                title: 'Maintenance programmée',
                message: 'Une maintenance est programmée dimanche de 2h à 4h.',
                type: 'warning',
                priority: 'high',
                targetRole: 'student'
            }
        }
    });
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log('🚀 Serveur de test notifications-email démarré');
    console.log(`📋 API de test: http://localhost:${PORT}/test`);
    console.log('============================================');
    console.log('Exemples de tests:');
    console.log('');
    console.log('1. Test notification simple:');
    console.log(`curl -X POST http://localhost:${PORT}/api/notifications \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": 1,
    "title": "Nouveau cours disponible",
    "message": "Le cours \\"React Avancé\\" est maintenant disponible.",
    "type": "success"
  }'`);
    console.log('');
    console.log('2. Test notification système:');
    console.log(`curl -X POST http://localhost:${PORT}/api/notifications/system \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Mise à jour importante",
    "message": "La plateforme sera mise à jour ce soir.",
    "type": "warning",
    "targetRole": "student"
  }'`);
    console.log('');
    console.log('✅ Chaque notification créée enverra automatiquement un email !');
});
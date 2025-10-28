const express = require('express');
const cors = require('cors');
const notificationController = require('./src/controllers/notificationControllerNew');
const assignmentController = require('./src/controllers/assignmentControllerNew');
require('dotenv').config({ path: './src/.env' });

const app = express();
const PORT = 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware d'authentification simulé pour les tests
app.use((req, res, next) => {
    req.user = {
        userId: 1,
        role: 'admin',
        email: 'admin@test.com'
    };
    next();
});

// Routes de test pour les notifications avec email
app.post('/api/test/notification-email', notificationController.createNotification);
app.post('/api/test/bulk-notification-email', notificationController.createBulkNotifications);

// Route de test pour créer un utilisateur de test
app.post('/api/test/create-test-user', async (req, res) => {
    try {
        const { User } = require('./src/models/businessModels');
        
        const testUser = await User.create({
            first_name: 'Test',
            last_name: 'User',
            email: 'freddyouedraogo104@gmail.com',
            password: 'test123',
            role: 'student',
            phone: '1234567890',
            date_of_birth: '1990-01-01',
            address: 'Test Address',
            enrollment_date: new Date()
        });

        res.json({
            success: true,
            message: 'Utilisateur de test créé',
            data: { user_id: testUser.id, email: testUser.email }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'utilisateur de test',
            error: error.message
        });
    }
});

// Route de test simple pour notifications
app.post('/api/test/simple-notification', async (req, res) => {
    try {
        const { title = 'Test de notification', message = 'Ceci est un test', send_email = true } = req.body;
        
        const notificationData = {
            user_id: 1, // Utilisateur de test
            title,
            message,
            type: 'info',
            priority: 'medium',
            send_email
        };

        // Simuler req.body pour le contrôleur
        req.body = notificationData;
        
        return notificationController.createNotification(req, res);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors du test de notification',
            error: error.message
        });
    }
});

// Route d'information
app.get('/api/test/info', (req, res) => {
    res.json({
        message: 'Serveur de test pour les notifications avec email',
        endpoints: {
            'POST /api/test/simple-notification': 'Test simple de notification avec email',
            'POST /api/test/notification-email': 'Test complet de notification',
            'POST /api/test/bulk-notification-email': 'Test de notifications en masse',
            'POST /api/test/create-test-user': 'Créer un utilisateur de test'
        },
        smtp_config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER ? 'Configuré' : 'Non configuré'
        }
    });
});

app.listen(PORT, () => {
    console.log(`
==================================================
🧪 SERVEUR DE TEST NOTIFICATIONS + EMAIL
==================================================
📧 Serveur: http://localhost:${PORT}
🔧 Info: GET http://localhost:${PORT}/api/test/info
📨 Test simple: POST http://localhost:${PORT}/api/test/simple-notification
📬 Test complet: POST http://localhost:${PORT}/api/test/notification-email
==================================================
✅ Configuration SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}
==================================================
    `);
});
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./models/newModels');

// Importation des nouveaux contrôleurs
const authController = require('./controllers/newAuthController_v2');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware pour parser le JSON
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes d'authentification (nouvelles)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', authController.verifyToken);
app.get('/api/auth/profile', authMiddleware, authController.getProfile);
app.put('/api/auth/profile', authMiddleware, authController.updateProfile);

// Route de test de la base de données
app.get('/api/test/database', async (req, res) => {
    try {
        const { User, Role } = require('./models/newModels');
        
        // Test de connexion
        await sequelize.authenticate();
        
        // Compter les entités
        const userCount = await User.count();
        const roleCount = await Role.count();
        
        res.json({
            success: true,
            message: 'Base de données connectée',
            data: {
                users: userCount,
                roles: roleCount,
                database: 'learning_platform',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erreur test database:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur de connexion à la base de données',
            error: error.message
        });
    }
});

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'learning_platform'
    });
});

// Route par défaut
app.get('/', (req, res) => {
    res.json({
        message: 'API Suivi Pédagogique et Administratif',
        version: '2.0.0',
        status: 'Actif',
        endpoints: {
            health: '/api/health',
            test: '/api/test/database',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                verify: 'GET /api/auth/verify',
                profile: 'GET /api/auth/profile'
            }
        }
    });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error('Erreur non gérée:', err);
    res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Démarrage du serveur
const startServer = async () => {
    try {
        // Test de connexion à la base de données
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie');
        
        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
            console.log(`📊 Base de données: learning_platform`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Santé: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage:', error);
        process.exit(1);
    }
};

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    console.log('\n⏹️  Arrêt du serveur...');
    try {
        await sequelize.close();
        console.log('✅ Connexion à la base fermée');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture:', error);
        process.exit(1);
    }
});

// Démarrer le serveur
startServer();

module.exports = app;
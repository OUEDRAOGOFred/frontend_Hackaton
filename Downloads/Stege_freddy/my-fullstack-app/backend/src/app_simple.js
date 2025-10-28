const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./models/newModels');

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route de test simple
app.get('/', (req, res) => {
    res.json({
        message: 'API Suivi Pédagogique et Administratif v2.0',
        status: 'Actif',
        timestamp: new Date().toISOString()
    });
});

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

// Démarrer le serveur
startServer();

module.exports = app;
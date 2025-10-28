const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test de connexion à la base de données
const testDatabaseConnection = async () => {
    try {
        const db = require('./config/db');
        await db.authenticate();
        console.log('✅ Connexion à la base de données MySQL établie avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        return false;
    }
};

// Routes de test
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Système de Suivi Pédagogique et Administratif',
        version: '1.0.0',
        status: 'Backend opérationnel'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API fonctionne correctement',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Routes d'authentification basiques (test)
app.post('/api/auth/login', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de connexion (test)',
        received: req.body
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: 'Erreur serveur interne',
        error: err.message
    });
});

// Route non trouvée
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} non trouvée`
    });
});

// Démarrage du serveur
const startServer = async () => {
    try {
        // Test de la base de données
        const dbConnected = await testDatabaseConnection();
        
        const server = app.listen(PORT, () => {
            console.log(`\n🚀 Serveur de test démarré avec succès !`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🔒 Test Login: http://localhost:${PORT}/api/auth/login`);
            console.log(`💾 Base de données: ${dbConnected ? '✅ Connectée' : '❌ Déconnectée'}`);
            console.log(`\n⏰ ${new Date().toLocaleString('fr-FR')}`);
            console.log('---'.repeat(20));
        });
        
        return server;
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
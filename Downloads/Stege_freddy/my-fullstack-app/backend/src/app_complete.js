const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Import de la configuration de base de données
const db = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ========== Configuration des middlewares de sécurité ==========
// Protection des headers HTTP
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression des réponses
app.use(compression());

// Configuration CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://votre-domaine.com'] // Remplacer par votre domaine en production
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting - Limite le nombre de requêtes par IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Plus strict en production
    message: {
        success: false,
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// ========== Configuration du parsing ==========
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({
                success: false,
                message: 'JSON invalide'
            });
            throw new Error('JSON invalide');
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// ========== Middleware de logging des requêtes ==========
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
    
    // Log des erreurs de réponse
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400) {
            console.log(`[${timestamp}] ERROR ${res.statusCode} - ${method} ${url}`);
        }
        originalSend.call(this, data);
    };
    
    next();
});

// ========== Test de connexion à la base de données ==========
const testDatabaseConnection = async () => {
    try {
        await db.authenticate();
        console.log('✅ Connexion à la base de données MySQL établie avec succès');
        
        // Synchronisation des modèles (attention en production !)
        if (process.env.NODE_ENV !== 'production') {
            await db.sync({ alter: false }); // Ne pas altérer les tables existantes
            console.log('✅ Synchronisation des modèles terminée');
        }
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        process.exit(1);
    }
};

// ========== Routes principales ==========
// Route racine
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API Système de Suivi Pédagogique et Administratif',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            courses: '/api/courses/*',
            assignments: '/api/assignments/*',
            submissions: '/api/submissions/*',
            grades: '/api/grades/*',
            enrollments: '/api/enrollments/*',
            notifications: '/api/notifications/*',
            analytics: '/api/analytics/*'
        },
        documentation: '/api/docs' // TODO: Ajouter Swagger
    });
});

// Routes API
app.use('/api', apiRoutes);

// ========== Middleware de gestion des erreurs globales ==========
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err.stack);
    
    // Erreur de validation Sequelize
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation des données',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }
    
    // Erreur de contrainte unique Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            message: 'Cette valeur existe déjà',
            field: err.errors[0]?.path
        });
    }
    
    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token invalide'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expiré'
        });
    }
    
    // Erreur générique
    res.status(err.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Erreur serveur interne' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ========== Gestion des routes non trouvées ==========
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} non trouvée`,
        suggestion: 'Vérifiez la documentation API à /api/docs'
    });
});

// ========== Gestion des signaux de fermeture ==========
const gracefulShutdown = async (signal) => {
    console.log(`\n📡 Signal ${signal} reçu, fermeture gracieuse du serveur...`);
    
    try {
        await db.close();
        console.log('✅ Connexions à la base de données fermées');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ========== Démarrage du serveur ==========
const startServer = async () => {
    try {
        // Test de la connexion à la base de données
        await testDatabaseConnection();
        
        // Démarrage du serveur
        const server = app.listen(PORT, () => {
            console.log(`\n🚀 Serveur démarré avec succès !`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
            console.log(`📚 Documentation: http://localhost:${PORT}/api/docs`);
            console.log(`\n⏰ ${new Date().toLocaleString('fr-FR')}`);
            console.log('---'.repeat(20));
        });
        
        // Configuration du timeout du serveur
        server.timeout = 30000; // 30 secondes
        
        return server;
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

// Démarrage uniquement si ce fichier est exécuté directement
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
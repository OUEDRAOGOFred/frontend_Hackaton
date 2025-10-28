const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, sequelize } = require('./models/newModels');
const { Op } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-super-secure';

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

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Route principale
app.get('/', (req, res) => {
    res.json({
        message: 'API Suivi Pédagogique et Administratif v2.0',
        status: 'Actif',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            test: '/api/test/database',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                verify: 'GET /api/auth/verify'
            }
        }
    });
});

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, roleId = 1 } = req.body;

        // Validation des données
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
            });
        }

        // Hacher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const newUser = await User.create({
            username,
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            role_id: roleId
        });

        // Récupérer l'utilisateur avec son rôle
        const userWithRole = await User.findByPk(newUser.id, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'description']
            }],
            attributes: { exclude: ['password_hash'] }
        });

        // Générer le token JWT
        const token = jwt.sign(
            { 
                userId: userWithRole.id, 
                username: userWithRole.username,
                role: userWithRole.role.name 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: userWithRole,
                token
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'inscription',
            error: error.message
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nom d\'utilisateur et mot de passe requis'
            });
        }

        // Trouver l'utilisateur avec son rôle
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email: username }]
            },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'description', 'permissions']
            }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
        }

        // Vérifier le statut de l'utilisateur
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Compte suspendu ou inactif'
            });
        }

        // Mettre à jour la dernière connexion
        await user.update({ last_login: new Date() });

        // Générer le token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role.name,
                permissions: user.role.permissions
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Réponse sans le mot de passe
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            profile_picture: user.profile_picture,
            role: user.role,
            is_active: user.is_active,
            total_points: user.total_points,
            current_level: user.current_level,
            last_login: user.last_login,
            created_at: user.created_at
        };

        res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion',
            error: error.message
        });
    }
});

app.get('/api/auth/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token manquant'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Récupérer l'utilisateur actuel
        const user = await User.findByPk(decoded.userId, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'description', 'permissions']
            }],
            attributes: { exclude: ['password_hash'] }
        });

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide ou utilisateur inactif'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user,
                token
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }

        console.error('Erreur lors de la vérification du token:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification',
            error: error.message
        });
    }
});

// Route de test de la base de données
app.get('/api/test/database', async (req, res) => {
    try {
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
            console.log('='.repeat(50));
            console.log('🚀 Serveur Suivi Pédagogique et Administratif');
            console.log('='.repeat(50));
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`📊 Base: learning_platform`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`❤️  Santé: http://localhost:${PORT}/api/health`);
            console.log(`🔒 Auth: http://localhost:${PORT}/api/auth/login`);
            console.log('='.repeat(50));
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
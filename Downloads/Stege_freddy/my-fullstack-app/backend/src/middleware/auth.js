const jwt = require('jsonwebtoken');

// Définir une clé secrète JWT temporaire (dans un projet réel, utilisez une variable d'environnement)
const JWT_SECRET = 'learning_platform_jwt_secret';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Accès non autorisé - Token manquant',
                code: 'TOKEN_MISSING'
            });
        }

        // Extraire le token du format "Bearer [token]"
        let token;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        } else {
            return res.status(401).json({ 
                message: 'Format de token invalide',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Vérifier que toutes les informations nécessaires sont présentes
            if (!decoded.id || !decoded.role || !decoded.email) {
                throw new Error('Token invalide : informations manquantes');
            }
            
            // Ajouter les informations de l'utilisateur à la requête
            req.user = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email
            };
            
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Token expiré',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({
                message: 'Token invalide',
                code: 'INVALID_TOKEN'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ 
            message: 'Erreur d\'authentification',
            code: 'AUTH_ERROR'
        });
    }
};

// Middleware pour vérifier les rôles
const authorize = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Vous n\'avez pas les permissions nécessaires' });
            }
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Erreur d\'autorisation', error: error.message });
        }
    };
};

module.exports = {
    authMiddleware,
    authorize
};
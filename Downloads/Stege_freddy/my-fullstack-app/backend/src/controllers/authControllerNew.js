const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/businessModels');

// Génération de token JWT
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

// Génération de refresh token
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// POST /api/auth/register - Inscription (admin seulement)
const register = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            role = 'student'
        } = req.body;

        // Validation des données requises
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Prénom, nom, email et mot de passe sont requis'
            });
        }

        // Validation du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            });
        }

        // Validation du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Créer l'utilisateur
        const user = await User.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role,
            is_active: true
        });

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role
                }
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
};

// POST /api/auth/login - Connexion
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des données requises
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe sont requis'
            });
        }

        // Rechercher l'utilisateur
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
        }

        // Vérifier que l'utilisateur est actif
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
        }

        // Mettre à jour la dernière connexion
        await user.update({
            last_login: new Date()
        });

        // Générer les tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken({ userId: user.id });

        res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    last_login: user.last_login
                },
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: '24h'
                }
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
};

// POST /api/auth/refresh - Rafraîchir le token
const refreshToken = async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requis'
            });
        }

        // Vérifier le refresh token
        const decoded = jwt.verify(
            refresh_token, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        // Rechercher l'utilisateur
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé ou inactif'
            });
        }

        // Générer un nouveau access token
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        const newAccessToken = generateToken(tokenPayload);

        res.status(200).json({
            success: true,
            message: 'Token rafraîchi avec succès',
            data: {
                access_token: newAccessToken,
                expires_in: '24h'
            }
        });

    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token invalide ou expiré'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du rafraîchissement du token',
            error: error.message
        });
    }
};

// POST /api/auth/logout - Déconnexion
const logout = async (req, res) => {
    try {
        // En réalité, avec JWT, la déconnexion côté serveur nécessiterait 
        // une blacklist des tokens ou leur stockage en base.
        // Pour simplifier, on renvoie juste une confirmation.
        
        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        });

    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la déconnexion',
            error: error.message
        });
    }
};

// GET /api/auth/profile - Profil utilisateur
const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'phone', 'created_at', 'last_login']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du profil',
            error: error.message
        });
    }
};

// PUT /api/auth/profile - Mise à jour du profil
const updateProfile = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            phone
        } = req.body;

        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour les champs modifiables
        const updateData = {};
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (phone !== undefined) updateData.phone = phone;

        await user.update(updateData);

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour du profil',
            error: error.message
        });
    }
};

// PUT /api/auth/change-password - Changement de mot de passe
const changePassword = async (req, res) => {
    try {
        const {
            current_password,
            new_password,
            confirm_password
        } = req.body;

        // Validation des données requises
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel, nouveau mot de passe et confirmation sont requis'
            });
        }

        // Vérifier que les nouveaux mots de passe correspondent
        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Les nouveaux mots de passe ne correspondent pas'
            });
        }

        // Validation du nouveau mot de passe
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Rechercher l'utilisateur
        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier le mot de passe actuel
        const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

        // Mettre à jour le mot de passe
        await user.update({
            password: hashedNewPassword
        });

        res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du changement de mot de passe',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getProfile,
    updateProfile,
    changePassword
};
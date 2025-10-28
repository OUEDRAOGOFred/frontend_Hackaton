const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, sequelize } = require('../models/newModels');
const { Op } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Inscription
const register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, roleId = 1 } = req.body;

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
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

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
};

// Connexion
const login = async (req, res) => {
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
};

// Vérifier le token
const verifyToken = async (req, res) => {
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
};

// Profil utilisateur
const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'description', 'permissions']
            }],
            attributes: { exclude: ['password_hash'] }
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
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, profileImage } = req.body;
        
        const user = await User.findByPk(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        await user.update({
            first_name: firstName || user.first_name,
            last_name: lastName || user.last_name,
            phone: phone || user.phone,
            profile_picture: profileImage || user.profile_picture
        });

        // Récupérer l'utilisateur mis à jour avec son rôle
        const updatedUser = await User.findByPk(user.id, {
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'name', 'description']
            }],
            attributes: { exclude: ['password_hash'] }
        });

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    verifyToken,
    getProfile,
    updateProfile
};
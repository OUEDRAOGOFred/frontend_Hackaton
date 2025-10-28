const bcrypt = require('bcryptjs');
const { sequelize, Role, User } = require('../models');

async function seedDatabase() {
    try {
        // Synchroniser la base de données
        await sequelize.sync({ force: true }); // Attention: {force: true} supprime les tables existantes

        // Créer les rôles
        const roles = await Role.bulkCreate([
            { name: 'admin' },
            { name: 'teacher' },
            { name: 'student' }
        ]);

        // Hasher le mot de passe admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ChangeMe@2025!', salt);

        // Créer l'utilisateur admin
        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            roleId: roles[0].id, // Le rôle admin
            isActive: true,
            gdprConsent: true
        });

        console.log('Base de données initialisée avec succès !');
        console.log('Admin créé avec les identifiants :');
        console.log('Email: admin@example.com');
        console.log('Mot de passe: ChangeMe@2025!');

        // Fermer la connexion
        await sequelize.close();

    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        process.exit(1);
    }
}

// Exécuter le script
seedDatabase();
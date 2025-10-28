const { User, Role, Course, Assignment, sequelize } = require('../models/newModels');

async function testNewDatabase() {
    try {
        console.log('🔍 Test de connexion à la nouvelle base de données...');
        
        // Test de connexion
        await sequelize.authenticate();
        console.log('✅ Connexion réussie à la base de données');
        
        // Test des rôles
        console.log('\n📋 Vérification des rôles...');
        const roles = await Role.findAll();
        console.log(`✅ ${roles.length} rôles trouvés:`);
        roles.forEach(role => {
            console.log(`  - ${role.name}: ${role.description}`);
        });
        
        // Test de création d'un utilisateur de test
        console.log('\n👤 Test de création d\'un utilisateur...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        // Supprimer l'utilisateur de test s'il existe
        await User.destroy({ where: { username: 'testuser' } });
        
        const testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password_hash: hashedPassword,
            first_name: 'Test',
            last_name: 'User',
            role_id: 1 // Student
        });
        
        console.log('✅ Utilisateur de test créé avec succès');
        console.log(`   ID: ${testUser.id}, Username: ${testUser.username}`);
        
        // Test de récupération avec relations
        console.log('\n🔗 Test des relations...');
        const userWithRole = await User.findByPk(testUser.id, {
            include: [{
                model: Role,
                as: 'role'
            }]
        });
        
        console.log('✅ Utilisateur avec rôle récupéré:');
        console.log(`   ${userWithRole.first_name} ${userWithRole.last_name} - Rôle: ${userWithRole.role.name}`);
        
        // Test des statistiques de la base
        console.log('\n📊 Statistiques de la base de données:');
        const userCount = await User.count();
        const courseCount = await Course.count();
        const assignmentCount = await Assignment.count();
        
        console.log(`   👥 Utilisateurs: ${userCount}`);
        console.log(`   📚 Cours: ${courseCount}`);
        console.log(`   📝 Devoirs: ${assignmentCount}`);
        
        // Nettoyage
        await User.destroy({ where: { username: 'testuser' } });
        console.log('\n🧹 Utilisateur de test supprimé');
        
        console.log('\n🎉 Tous les tests sont passés avec succès !');
        console.log('La nouvelle base de données est prête à être utilisée.');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        throw error;
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    testNewDatabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test échoué:', error);
            process.exit(1);
        });
}

module.exports = testNewDatabase;
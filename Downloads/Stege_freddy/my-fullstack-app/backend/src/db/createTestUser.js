const bcrypt = require('bcryptjs');
const { User, Role } = require('../models/newModels');

async function createTestUser() {
    try {
        console.log('🔍 Création d\'un utilisateur de test...');
        
        // Supprimer l'utilisateur de test s'il existe
        await User.destroy({ where: { username: 'admin_test' } });
        
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Créer l'utilisateur admin de test
        const testUser = await User.create({
            username: 'admin_test',
            email: 'admin@test.com',
            password_hash: hashedPassword,
            first_name: 'Admin',
            last_name: 'Test',
            role_id: 3, // Admin
            is_active: true
        });
        
        console.log('✅ Utilisateur admin de test créé:');
        console.log(`   Username: admin_test`);
        console.log(`   Email: admin@test.com`);
        console.log(`   Password: admin123`);
        console.log(`   ID: ${testUser.id}`);
        
        // Créer aussi un étudiant de test
        await User.destroy({ where: { username: 'student_test' } });
        
        const studentPassword = await bcrypt.hash('student123', 10);
        const testStudent = await User.create({
            username: 'student_test',
            email: 'student@test.com',
            password_hash: studentPassword,
            first_name: 'Étudiant',
            last_name: 'Test',
            role_id: 1, // Student
            is_active: true
        });
        
        console.log('\n✅ Utilisateur étudiant de test créé:');
        console.log(`   Username: student_test`);
        console.log(`   Email: student@test.com`);
        console.log(`   Password: student123`);
        console.log(`   ID: ${testStudent.id}`);
        
        console.log('\n🎉 Utilisateurs de test créés avec succès !');
        console.log('\n🔗 Vous pouvez maintenant tester l\'authentification via:');
        console.log('   POST http://localhost:3001/api/auth/login');
        console.log('   avec les identifiants ci-dessus');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des utilisateurs de test:', error);
        throw error;
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    createTestUser()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Échec de la création:', error);
            process.exit(1);
        });
}

module.exports = createTestUser;

module.exports = createTestUser;
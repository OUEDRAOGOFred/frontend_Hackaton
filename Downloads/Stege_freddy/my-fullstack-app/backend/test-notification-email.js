// Test simple de notification avec email
const notificationController = require('./src/controllers/notificationControllerNew');
require('dotenv').config({ path: './src/.env' });

console.log('🧪 Test de notification avec email...\n');

// Simuler une requête et une réponse
const mockReq = {
    body: {
        user_id: 1,
        title: 'Test de notification avec email',
        message: 'Ceci est un test d\'envoi de notification avec email automatique.',
        type: 'info',
        priority: 'medium',
        send_email: true
    },
    user: {
        userId: 1,
        role: 'admin'
    }
};

const mockRes = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        console.log(`📨 Réponse (${this.statusCode}):`, JSON.stringify(data, null, 2));
        if (data.success) {
            console.log('✅ Test réussi ! Vérifiez votre email.');
        } else {
            console.log('❌ Test échoué.');
        }
    }
};

// Créer d'abord un utilisateur de test dans la base de données
async function createTestUser() {
    try {
        const { User } = require('./src/models/businessModels');
        
        // Vérifier si l'utilisateur existe déjà
        let user = await User.findByPk(1);
        
        if (!user) {
            user = await User.create({
                id: 1,
                username: 'freddy_test',
                first_name: 'Freddy',
                last_name: 'Test',
                email: 'freddyouedraogo104@gmail.com',
                password: 'test123',
                password_hash: '$2b$10$test123hash', // Hash fictif pour le test
                role: 'student',
                role_id: 3, // ID pour role student
                phone: '1234567890',
                date_of_birth: '1990-01-01',
                address: 'Test Address',
                enrollment_date: new Date()
            });
            console.log('👤 Utilisateur de test créé:', user.email);
        } else {
            console.log('👤 Utilisateur de test trouvé:', user.email);
        }
        
        return user;
    } catch (error) {
        console.error('❌ Erreur création utilisateur de test:', error.message);
        throw error;
    }
}

// Exécuter le test
async function runTest() {
    try {
        await createTestUser();
        console.log('\n📧 Envoi de la notification avec email...\n');
        await notificationController.createNotification(mockReq, mockRes);
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

runTest();
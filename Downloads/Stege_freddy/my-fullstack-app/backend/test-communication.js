/**
 * Test de communication frontend-backend
 */
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testCommunication() {
    console.log('🔬 Test de communication Frontend-Backend');
    console.log('==========================================');

    try {
        // Test 1: Endpoint de base
        console.log('\n1. Test endpoint de base...');
        const baseResponse = await axios.get(`${API_BASE_URL}/`);
        console.log('✅ Backend répond:', baseResponse.data.message);

        // Test 2: Endpoint de test
        console.log('\n2. Test endpoint /api/test...');
        const testResponse = await axios.get(`${API_BASE_URL}/api/test`);
        console.log('✅ API test:', testResponse.data.message);

        // Test 3: Récupération des utilisateurs de test
        console.log('\n3. Test récupération utilisateurs de test...');
        const usersResponse = await axios.get(`${API_BASE_URL}/api/users/test`);
        console.log('✅ Utilisateurs de test récupérés:', usersResponse.data.users.length, 'utilisateurs');

        // Afficher les identifiants
        console.log('\n👥 IDENTIFIANTS DE CONNEXION:');
        console.log('='.repeat(50));
        usersResponse.data.users.forEach(user => {
            console.log(`🎯 ${user.role.toUpperCase()}:`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Mot de passe: ${user.password}`);
            console.log(`   Nom: ${user.firstName} ${user.lastName}`);
            console.log(`   Description: ${user.description}`);
            console.log('');
        });

        // Test 4: Test de connexion avec un utilisateur
        console.log('\n4. Test de connexion utilisateur...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'admin@plateforme.edu',
            password: 'password123'
        });
        console.log('✅ Connexion admin réussie:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);

        // Test 5: Récupération des cours
        console.log('\n5. Test récupération des cours...');
        const coursesResponse = await axios.get(`${API_BASE_URL}/api/courses`);
        console.log('✅ Cours récupérés:', coursesResponse.data.length, 'cours');

        console.log('\n==========================================');
        console.log('✅ COMMUNICATION FRONTEND-BACKEND VALIDÉE');
        console.log('==========================================');
        console.log('\n📱 Frontend peut maintenant communiquer avec le backend !');
        console.log('🌐 URL Backend: http://localhost:5000');
        console.log('🌐 URL Frontend: http://localhost:3000');

    } catch (error) {
        console.error('❌ Erreur de communication:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Le backend n\'est pas démarré. Lancez: node server-final.js');
        }
    }
}

testCommunication();
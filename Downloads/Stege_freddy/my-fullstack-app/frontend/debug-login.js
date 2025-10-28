// Test de débogage pour vérifier la fonction login
import { authService } from './services/api.js';

console.log('🔧 Test de la fonction login corrigée...');

// Simuler l'appel exact depuis Login.js
const testCredentials = {
    email: 'admin@plateforme.edu',
    password: 'password123'
};

authService.login(testCredentials)
    .then(result => {
        console.log('✅ Login réussi:', result);
        console.log('✅ Utilisateur:', result.user);
        console.log('✅ Token:', result.accessToken);
    })
    .catch(error => {
        console.error('❌ Erreur login:', error);
        console.error('❌ Message:', error.message);
        console.error('❌ Response:', error.response?.data);
    });
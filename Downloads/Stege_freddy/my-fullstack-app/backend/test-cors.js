// Script de test CORS
const axios = require('axios');

async function testCORS() {
    console.log('🧪 Test de la configuration CORS...\n');
    
    const origins = [
        'http://localhost:3000',
        'http://172.20.10.3:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.100:3000'
    ];
    
    for (const origin of origins) {
        try {
            console.log(`🔍 Test avec origine: ${origin}`);
            
            // Test simple GET
            const response = await axios.get('http://localhost:5000/api/test', {
                headers: {
                    'Origin': origin,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            console.log(`✅ Succès GET - Status: ${response.status}`);
            
            // Test POST login
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@plateforme.edu',
                password: 'password123'
            }, {
                headers: {
                    'Origin': origin,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            console.log(`✅ Succès LOGIN - Status: ${loginResponse.status}`);
            console.log(`   Utilisateur: ${loginResponse.data.user?.firstName} ${loginResponse.data.user?.lastName}`);
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ Serveur non accessible`);
                break;
            } else if (error.response) {
                console.log(`❌ Erreur HTTP ${error.response.status}: ${error.response.statusText}`);
            } else {
                console.log(`❌ Erreur: ${error.message}`);
            }
        }
        console.log('');
    }
}

testCORS().catch(console.error);
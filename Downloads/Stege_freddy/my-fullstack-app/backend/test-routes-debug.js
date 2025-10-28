// Test rapide des routes problématiques
const axios = require('axios');

async function testRoutes() {
    const BASE_URL = 'http://localhost:5000/api';
    
    console.log('🔍 Test des routes problématiques...\n');
    
    try {
        // Test 1: /api/sessions
        console.log('Test 1: GET /api/sessions');
        const sessionsRes = await axios.get(`${BASE_URL}/sessions`);
        console.log('✅ Status:', sessionsRes.status);
        console.log('📦 Data structure:', Object.keys(sessionsRes.data));
        console.log('📊 Response:', JSON.stringify(sessionsRes.data, null, 2));
        console.log('\n');
    } catch (err) {
        console.log('❌ Error:', err.response?.status, err.message);
        console.log('\n');
    }
    
    try {
        // Test 2: /api/notifications/emails
        console.log('Test 2: GET /api/notifications/emails');
        const notifsRes = await axios.get(`${BASE_URL}/notifications/emails`);
        console.log('✅ Status:', notifsRes.status);
        console.log('📦 Data structure:', Object.keys(notifsRes.data));
        console.log('📊 Response:', JSON.stringify(notifsRes.data, null, 2));
        console.log('\n');
    } catch (err) {
        console.log('❌ Error:', err.response?.status, err.message);
        console.log('\n');
    }
    
    try {
        // Test 3: /api/test (pour comparaison)
        console.log('Test 3: GET /api/test (pour comparaison)');
        const testRes = await axios.get(`${BASE_URL}/test`);
        console.log('✅ Status:', testRes.status);
        console.log('📊 Response:', JSON.stringify(testRes.data, null, 2));
    } catch (err) {
        console.log('❌ Error:', err.response?.status, err.message);
    }
}

testRoutes();

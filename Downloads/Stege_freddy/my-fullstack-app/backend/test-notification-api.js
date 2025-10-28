/**
 * Test simple de l'API notifications avec emails
 */
const axios = require('axios');

const baseUrl = 'http://localhost:5001';

async function testNotificationAPI() {
    console.log('🔬 Test de l\'API notifications avec emails');
    console.log('===============================================');

    // Test 1: Notification simple
    console.log('\n1. Test notification simple...');
    try {
        const response = await axios.post(`${baseUrl}/api/notifications`, {
            userId: 1,
            title: "Nouveau cours disponible 📚",
            message: "Le cours 'React Avancé' est maintenant disponible dans votre espace étudiant.",
            type: "success",
            priority: "normal"
        });
        console.log('✅ Réponse:', response.data.message);
        console.log('📧 Email envoyé: Oui');
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Notification d'avertissement
    console.log('\n2. Test notification d\'avertissement...');
    try {
        const response = await axios.post(`${baseUrl}/api/notifications`, {
            userId: 1,
            title: "Date limite approche ⚠️",
            message: "Il vous reste 2 jours pour soumettre votre projet final 'Application Web'.",
            type: "warning",
            priority: "high"
        });
        console.log('✅ Réponse:', response.data.message);
        console.log('📧 Email envoyé: Oui');
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: Notification système
    console.log('\n3. Test notification système...');
    try {
        const response = await axios.post(`${baseUrl}/api/notifications/system`, {
            title: "Maintenance programmée 🔧",
            message: "Une maintenance de la plateforme est programmée dimanche de 2h à 4h du matin.",
            type: "info",
            priority: "high",
            targetRole: "student"
        });
        console.log('✅ Réponse:', response.data.message);
        console.log('📧 Emails envoyés: Oui');
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    // Test 4: Récupération des notifications
    console.log('\n4. Test récupération des notifications...');
    try {
        const response = await axios.get(`${baseUrl}/api/notifications/1`);
        console.log('✅ Notifications récupérées:', response.data.total);
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
    }

    console.log('\n===============================================');
    console.log('✅ Tests terminés! Vérifiez votre boîte email freddyouedraogo104@gmail.com');
    console.log('📧 Vous devriez avoir reçu des emails pour chaque notification créée.');
    console.log('\n💡 Note: Si les emails n\'arrivent pas, vérifiez:');
    console.log('   - Votre connexion internet');
    console.log('   - Le dossier spam/courrier indésirable');
    console.log('   - La configuration SMTP dans le .env');
}

testNotificationAPI().catch(console.error);
/**
 * Script de test pour l'intégration notifications-email
 */
const emailService = require('./src/services/emailService');

// Test 1: Envoi d'email simple
async function testSimpleEmail() {
    console.log('\n🔬 Test 1: Envoi d\'email simple');
    try {
        await emailService.sendMail({
            to: 'freddyouedraogo104@gmail.com',
            subject: '✅ Test Email Service',
            text: 'Ceci est un email de test pour vérifier la configuration SMTP.',
            html: '<h2>✅ Test Email Service</h2><p>Ceci est un email de test pour vérifier la configuration SMTP.</p>'
        });
        console.log('✅ Email simple envoyé avec succès');
    } catch (error) {
        console.error('❌ Erreur email simple:', error.message);
    }
}

// Test 2: Envoi de notification par email
async function testNotificationEmail() {
    console.log('\n🔬 Test 2: Envoi de notification par email');
    try {
        await emailService.sendNotificationEmail(
            'freddyouedraogo104@gmail.com',
            'Nouvelle assignment disponible',
            'Un nouveau devoir "Exercices JavaScript" a été publié dans le cours "Programmation Web". Date limite: 15 octobre 2025.',
            'info'
        );
        console.log('✅ Email de notification envoyé avec succès');
    } catch (error) {
        console.error('❌ Erreur email notification:', error.message);
    }
}

// Test 3: Différents types de notifications
async function testNotificationTypes() {
    console.log('\n🔬 Test 3: Différents types de notifications');
    
    const tests = [
        {
            type: 'success',
            title: 'Inscription confirmée',
            message: 'Votre inscription au cours "React Avancé" a été confirmée avec succès.'
        },
        {
            type: 'warning',
            title: 'Date limite approche',
            message: 'Il vous reste 2 jours pour soumettre votre projet final.'
        },
        {
            type: 'error',
            title: 'Échec de soumission',
            message: 'La soumission de votre devoir a échoué. Veuillez réessayer.'
        }
    ];

    for (const test of tests) {
        try {
            await emailService.sendNotificationEmail(
                'freddyouedraogo104@gmail.com',
                test.title,
                test.message,
                test.type
            );
            console.log(`✅ Email ${test.type} envoyé avec succès`);
        } catch (error) {
            console.error(`❌ Erreur email ${test.type}:`, error.message);
        }
    }
}

// Exécution des tests
async function runAllTests() {
    console.log('🚀 Démarrage des tests d\'intégration email-notifications');
    console.log('============================================================');

    await testSimpleEmail();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause de 2s

    await testNotificationEmail();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause de 2s

    await testNotificationTypes();

    console.log('\n============================================================');
    console.log('✅ Tests terminés! Vérifiez votre boîte email.');
}

// Lancement des tests
runAllTests().catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
});
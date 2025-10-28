/**
 * DÉMONSTRATION: Intégration Notifications-Email
 * 
 * Ce script démontre l'envoi d'emails automatiques lors de la création de notifications
 */
const emailService = require('./src/services/emailService');

async function demonstrationEmailNotifications() {
    console.log('🎯 DÉMONSTRATION: Intégration Notifications-Email');
    console.log('==================================================');
    console.log('📧 Email de destination: freddyouedraogo104@gmail.com');
    console.log('');

    // Simulation d'événements qui déclenchent des notifications avec emails

    // 1. Nouvelle inscription à un cours
    console.log('📚 Événement: Nouvelle inscription à un cours');
    try {
        await emailService.sendNotificationEmail(
            'freddyouedraogo104@gmail.com',
            'Inscription confirmée 🎉',
            'Félicitations ! Votre inscription au cours "React Avancé" a été confirmée avec succès. Vous pouvez maintenant accéder aux contenus et commencer votre apprentissage.',
            'success'
        );
        console.log('   ✅ Email d\'inscription envoyé');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Nouveau devoir disponible
    console.log('📝 Événement: Nouveau devoir publié');
    try {
        await emailService.sendNotificationEmail(
            'freddyouedraogo104@gmail.com',
            'Nouveau devoir disponible 📋',
            'Un nouveau devoir "Créer une application React" a été publié dans votre cours "React Avancé". Date limite de soumission: 20 octobre 2025.',
            'info'
        );
        console.log('   ✅ Email de devoir envoyé');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Date limite approche
    console.log('⏰ Événement: Rappel de date limite');
    try {
        await emailService.sendNotificationEmail(
            'freddyouedraogo104@gmail.com',
            'Date limite dans 24h ⚠️',
            'Rappel important: Il vous reste moins de 24 heures pour soumettre votre devoir "Créer une application React". N\'oubliez pas de valider votre soumission !',
            'warning'
        );
        console.log('   ✅ Email de rappel envoyé');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Note disponible
    console.log('📊 Événement: Note disponible');
    try {
        await emailService.sendNotificationEmail(
            'freddyouedraogo104@gmail.com',
            'Votre note est disponible 🏆',
            'Excellente nouvelle ! Votre note pour le devoir "Créer une application React" est maintenant disponible. Vous avez obtenu 18/20. Consultez les commentaires détaillés dans votre espace étudiant.',
            'success'
        );
        console.log('   ✅ Email de note envoyé');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Maintenance système
    console.log('🔧 Événement: Notification système');
    try {
        await emailService.sendNotificationEmail(
            'freddyouedraogo104@gmail.com',
            'Maintenance programmée 🛠️',
            'Une maintenance de la plateforme de formation est programmée dimanche 13 octobre de 2h à 4h du matin. Durant cette période, la plateforme sera temporairement inaccessible.',
            'warning'
        );
        console.log('   ✅ Email de maintenance envoyé');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }

    console.log('');
    console.log('==================================================');
    console.log('✅ DÉMONSTRATION TERMINÉE');
    console.log('📧 5 emails de notification ont été envoyés');
    console.log('📱 Dans une vraie application:');
    console.log('   - Ces emails seraient envoyés automatiquement');
    console.log('   - Lors de la création de chaque notification');
    console.log('   - Via l\'API /api/notifications');
    console.log('');
    console.log('💡 Vérifiez votre boîte email pour voir les résultats !');
    console.log('   (N\'oubliez pas de vérifier le dossier spam)');
}

demonstrationEmailNotifications().catch(console.error);

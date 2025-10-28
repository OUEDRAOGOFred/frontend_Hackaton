/**
 * Test simple de configuration email
 */
const nodemailer = require('nodemailer');

// Configuration directe pour le test
const testTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'freddyouedraogo104@gmail.com',
        pass: 'jgfn rnii bgvi ixpr'
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4
});

async function testEmailConfig() {
    console.log('🔬 Test de configuration email...');
    
    try {
        // Vérifier la configuration
        await testTransporter.verify();
        console.log('✅ Configuration SMTP valide');
        
        // Envoyer un email de test
        const result = await testTransporter.sendMail({
            from: '"Plateforme de formation en ligne" <freddyouedraogo104@gmail.com>',
            to: 'freddyouedraogo104@gmail.com',
            subject: '✅ Test Email Configuration',
            text: 'Si vous recevez cet email, la configuration fonctionne parfaitement !',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #27ae60, #2c3e50); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h2>✅ Configuration Email Réussie !</h2>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6;">
                        <p style="font-size: 16px; line-height: 1.6; color: #333;">
                            Si vous recevez cet email, la configuration SMTP de votre plateforme de formation fonctionne parfaitement !
                        </p>
                        <p style="font-size: 14px; color: #666;">
                            📧 Envoyé depuis: ${testTransporter.options.host}:${testTransporter.options.port}<br>
                            🕐 Date: ${new Date().toLocaleString('fr-FR')}
                        </p>
                    </div>
                </div>
            `
        });
        
        console.log('📧 Email de test envoyé avec succès !');
        console.log('📧 Message ID:', result.messageId);
        console.log('✅ L\'intégration email-notifications est prête !');
        
    } catch (error) {
        console.error('❌ Erreur de configuration:', error.message);
        
        if (error.message.includes('Invalid login')) {
            console.log('💡 Suggestion: Vérifiez vos identifiants Gmail et assurez-vous que les mots de passe d\'application sont activés');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 Suggestion: Vérifiez votre connexion internet et les paramètres de pare-feu');
        }
    }
}

testEmailConfig();
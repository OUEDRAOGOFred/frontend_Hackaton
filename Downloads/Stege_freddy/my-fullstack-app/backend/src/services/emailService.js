const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true pour 465, false pour autres ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4 // Force IPv4
});

// Vérification de la configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Erreur configuration email:', error);
    } else {
        console.log('✅ Service email configuré avec succès');
    }
});

/**
 * Envoie un email
 * @param {Object} options - Options d'envoi
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.text - Contenu texte
 * @param {string} options.html - Contenu HTML (optionnel)
 */
const sendMail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || `<p>${options.text}</p>`
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email envoyé avec succès:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        throw error;
    }
};

/**
 * Envoie une notification par email
 * @param {string} userEmail - Email du destinataire
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} type - Type de notification (info, warning, success, error)
 */
const sendNotificationEmail = async (userEmail, title, message, type = 'info') => {
    const typeIcons = {
        info: '📢',
        warning: '⚠️',
        success: '✅',
        error: '❌'
    };

    const typeColors = {
        info: '#3498db',
        warning: '#f39c12',
        success: '#27ae60',
        error: '#e74c3c'
    };

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${typeColors[type]}, #2c3e50); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                <h2>${typeIcons[type]} ${title}</h2>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6;">
                <p style="font-size: 16px; line-height: 1.6; color: #333;">${message}</p>
                <hr style="border: 1px solid #dee2e6; margin: 20px 0;">
                <p style="font-size: 12px; color: #666; text-align: center;">
                    📚 Plateforme de formation en ligne<br>
                    Cet email a été envoyé automatiquement, merci de ne pas répondre.
                </p>
            </div>
        </div>
    `;

    return await sendMail({
        to: userEmail,
        subject: `${typeIcons[type]} ${title}`,
        text: message,
        html: htmlContent
    });
};

module.exports = {
    sendMail,
    sendNotificationEmail
};
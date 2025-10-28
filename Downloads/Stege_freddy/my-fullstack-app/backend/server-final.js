const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité et performance
app.use(helmet());
app.use(compression());

// Middleware CORS - Configuration pour développement et réseau local
const corsOptions = {
    origin: function (origin, callback) {
        // Autoriser les requêtes sans origine (ex: applications mobiles, Postman)
        if (!origin) return callback(null, true);
        
        // Liste des origines autorisées
        const allowedOrigins = [
            'http://localhost:3000',           // Frontend local standard
            'http://localhost:3001',           // Frontend local alternatif
            'http://localhost:3002',           // Frontend local port alternatif
            'http://127.0.0.1:3000',          // IPv4 local
            'http://127.0.0.1:3002',          // IPv4 local port alternatif
            'http://172.20.10.3:3000',        // Votre réseau local spécifique
            'http://172.20.10.3:3002',        // Votre réseau local port alternatif
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(3000|3001|3002)$/, // Réseau 192.168.x.x
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:(3000|3001|3002)$/, // Réseau 10.x.x.x
            /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:(3000|3001|3002)$/ // Réseau 172.16-31.x.x
        ];
        
        // Vérifier si l'origine est autorisée
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return origin === allowedOrigin;
            }
            if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`❌ Origine CORS non autorisée: ${origin}`);
            callback(new Error('Non autorisé par la politique CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    optionsSuccessStatus: 200 // Pour les anciens navigateurs
};

app.use(cors(corsOptions));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Configuration de l'email avec Ethereal (pour développement) ou Gmail
const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal-pass'
    },
    tls: {
        rejectUnauthorized: false // Pour le développement
    }
});

// Service d'envoi d'email avec fallback
const sendNotificationEmail = async (to, subject, content) => {
    try {
        console.log(`📧 Tentative d'envoi d'email à ${to}: ${subject}`);
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'plateforme-educative@example.com',
            to: to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        📚 Plateforme Éducative
                    </h2>
                    <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                        ${content}
                    </div>
                    <p style="color: #6b7280; font-size: 12px; text-align: center;">
                        Cet email a été envoyé automatiquement par la plateforme éducative.
                    </p>
                </div>
            `
        };

        const result = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email envoyé avec succès:', result.messageId);
        
        // Stocker la notification dans la base de données
        notificationsDB.push({
            id: Date.now(),
            recipient: to,
            subject: subject,
            content: content,
            sentAt: new Date().toISOString(),
            status: 'sent',
            messageId: result.messageId
        });
        
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
        
        // Même si l'envoi échoue, on stocke la notification
        notificationsDB.push({
            id: Date.now(),
            recipient: to,
            subject: subject,
            content: content,
            sentAt: new Date().toISOString(),
            status: 'failed',
            error: error.message
        });
        
        // On retourne success pour ne pas bloquer le flux
        console.log('⚠️ Email non envoyé mais notification enregistrée');
        return { success: true, error: error.message, stored: true };
    }
};

// ========== SYSTÈME DE RAPPELS AUTOMATIQUES ==========

// Fonction pour vérifier et envoyer les rappels de sessions synchrones
const checkAndSendSessionReminders = async () => {
    const now = new Date();
    
    for (const session of synchronousSessionsDB) {
        if (session.status !== 'scheduled') continue;
        
        const sessionTime = new Date(session.startTime);
        const timeDiff = sessionTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Rappel 24h avant
        if (hoursDiff <= 24 && hoursDiff > 23 && !session.reminders.sent24h) {
            console.log(`📅 Envoi rappel 24h pour session: ${session.title}`);
            
            // Obtenir tous les étudiants inscrits au cours
            const enrollments = enrollmentsDB.filter(e => e.courseId === session.courseId);
            
            for (const enrollment of enrollments) {
                const emailContent = `
                    <h3>🎓 Rappel: Session synchrone demain</h3>
                    <p><strong>${session.title}</strong></p>
                    <p>📅 Date: ${new Date(session.startTime).toLocaleDateString('fr-FR')}</p>
                    <p>🕐 Heure: ${new Date(session.startTime).toLocaleTimeString('fr-FR')}</p>
                    <p>📚 Cours: ${session.course.name}</p>
                    <p>👨‍🏫 Enseignant: ${session.teacher.firstName} ${session.teacher.lastName}</p>
                    <p>🔗 Lien: <a href="${session.meetingLink}">${session.meetingLink}</a></p>
                    <p>⏰ Rendez-vous dans 24 heures!</p>
                `;
                
                await sendNotificationEmail(
                    enrollment.student.email,
                    `📅 Rappel: ${session.title} - Demain`,
                    emailContent
                );
            }
            
            session.reminders.sent24h = true;
        }
        
        // Rappel 1h avant
        if (hoursDiff <= 1 && hoursDiff > 0.5 && !session.reminders.sent1h) {
            console.log(`⏰ Envoi rappel 1h pour session: ${session.title}`);
            
            const enrollments = enrollmentsDB.filter(e => e.courseId === session.courseId);
            
            for (const enrollment of enrollments) {
                const emailContent = `
                    <h3>🚨 Rappel Urgent: Session dans 1 heure!</h3>
                    <p><strong>${session.title}</strong></p>
                    <p>🕐 Début: ${new Date(session.startTime).toLocaleTimeString('fr-FR')}</p>
                    <p>🔗 Rejoindre: <a href="${session.meetingLink}">${session.meetingLink}</a></p>
                    <p>⚠️ La session commence bientôt, ne soyez pas en retard!</p>
                `;
                
                await sendNotificationEmail(
                    enrollment.student.email,
                    `🚨 URGENT: ${session.title} - Dans 1 heure`,
                    emailContent
                );
            }
            
            session.reminders.sent1h = true;
        }
    }
};

// Fonction pour vérifier et rappeler les devoirs à rendre
const checkAndSendAssignmentReminders = async () => {
    const now = new Date();
    
    for (const assignment of assignmentsDB) {
        if (assignment.status !== 'published') continue;
        
        const dueDate = new Date(assignment.dueDate);
        const timeDiff = dueDate - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Rappel 48h avant la date limite
        if (hoursDiff <= 48 && hoursDiff > 47 && !assignment.reminderSent48h) {
            console.log(`📝 Envoi rappel 48h pour devoir: ${assignment.title}`);
            
            // Trouver les étudiants qui n'ont pas encore soumis
            const courseEnrollments = enrollmentsDB.filter(e => e.courseId === assignment.courseId);
            
            for (const enrollment of courseEnrollments) {
                const hasSubmitted = submissionsDB.some(
                    s => s.assignmentId === assignment.id && s.studentId === enrollment.studentId
                );
                
                if (!hasSubmitted) {
                    const emailContent = `
                        <h3>📝 Rappel: Devoir à rendre dans 48h</h3>
                        <p><strong>${assignment.title}</strong></p>
                        <p>📚 Cours: ${coursesDB.find(c => c.id === assignment.courseId)?.name}</p>
                        <p>📅 Date limite: ${new Date(assignment.dueDate).toLocaleDateString('fr-FR')} à ${new Date(assignment.dueDate).toLocaleTimeString('fr-FR')}</p>
                        <p>💯 Points: ${assignment.maxPoints}</p>
                        <p>⚠️ N'oubliez pas de soumettre votre travail avant la date limite!</p>
                    `;
                    
                    await sendNotificationEmail(
                        enrollment.student.email,
                        `📝 Rappel: ${assignment.title} - 48h restantes`,
                        emailContent
                    );
                }
            }
            
            assignment.reminderSent48h = true;
        }
        
        // Rappel 24h avant la date limite
        if (hoursDiff <= 24 && hoursDiff > 23 && !assignment.reminderSent24h) {
            console.log(`⚠️ Envoi rappel 24h pour devoir: ${assignment.title}`);
            
            const courseEnrollments = enrollmentsDB.filter(e => e.courseId === assignment.courseId);
            
            for (const enrollment of courseEnrollments) {
                const hasSubmitted = submissionsDB.some(
                    s => s.assignmentId === assignment.id && s.studentId === enrollment.studentId
                );
                
                if (!hasSubmitted) {
                    const emailContent = `
                        <h3>🚨 Rappel Urgent: Devoir à rendre demain!</h3>
                        <p><strong>${assignment.title}</strong></p>
                        <p>⏰ Il ne reste plus que 24 heures!</p>
                        <p>📅 Date limite: ${new Date(assignment.dueDate).toLocaleDateString('fr-FR')} à ${new Date(assignment.dueDate).toLocaleTimeString('fr-FR')}</p>
                        <p>💯 Points: ${assignment.maxPoints}</p>
                        <p>🚨 Dépêchez-vous de soumettre votre travail!</p>
                    `;
                    
                    await sendNotificationEmail(
                        enrollment.student.email,
                        `🚨 URGENT: ${assignment.title} - Dernier jour`,
                        emailContent
                    );
                }
            }
            
            assignment.reminderSent24h = true;
        }
    }
};

// Notification lors du dépôt d'un devoir
const sendSubmissionConfirmation = async (submission, student, assignment) => {
    const emailContent = `
        <h3>✅ Confirmation de soumission</h3>
        <p>Votre devoir a été soumis avec succès!</p>
        <p><strong>${assignment.title}</strong></p>
        <p>📅 Soumis le: ${new Date(submission.submittedAt).toLocaleDateString('fr-FR')} à ${new Date(submission.submittedAt).toLocaleTimeString('fr-FR')}</p>
        <p>📝 Contenu: ${submission.content.substring(0, 100)}...</p>
        <p>✅ Votre soumission sera évaluée prochainement par l'enseignant.</p>
    `;
    
    await sendNotificationEmail(
        student.email,
        `✅ Devoir soumis: ${assignment.title}`,
        emailContent
    );
    
    // Notifier l'enseignant
    const teacherEmail = 'professeur@plateforme.edu';
    const teacherEmailContent = `
        <h3>📝 Nouvelle soumission reçue</h3>
        <p><strong>Étudiant:</strong> ${student.firstName} ${student.lastName}</p>
        <p><strong>Devoir:</strong> ${assignment.title}</p>
        <p>📅 Soumis le: ${new Date(submission.submittedAt).toLocaleDateString('fr-FR')}</p>
        <p>Une nouvelle soumission nécessite votre évaluation.</p>
    `;
    
    await sendNotificationEmail(
        teacherEmail,
        `📝 Nouvelle soumission: ${assignment.title}`,
        teacherEmailContent
    );
};

// Route de base
app.get('/', (req, res) => {
    res.json({
        message: 'API Système de Suivi Pédagogique',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Routes de test
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API fonctionne !', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Simulation des routes d'authentification
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Simulation d'utilisateurs pour test avec identifiants détaillés
    const users = {
        'admin@plateforme.edu': {
            id: 1,
            firstName: 'Admin',
            lastName: 'Système',
            email: 'admin@plateforme.edu',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin+Système&background=3498db&color=fff'
        },
        'professeur@plateforme.edu': {
            id: 2,
            firstName: 'Marie',
            lastName: 'Dubois',
            email: 'professeur@plateforme.edu',
            role: 'teacher',
            avatar: 'https://ui-avatars.com/api/?name=Marie+Dubois&background=27ae60&color=fff'
        },
        'etudiant@plateforme.edu': {
            id: 3,
            firstName: 'Pierre',
            lastName: 'Martin',
            email: 'etudiant@plateforme.edu',
            role: 'student',
            avatar: 'https://ui-avatars.com/api/?name=Pierre+Martin&background=e74c3c&color=fff'
        }
    };

    if (users[email] && password === 'password123') {
        res.json({
            success: true,
            message: 'Connexion réussie',
            accessToken: 'fake-jwt-token-' + Date.now(),
            refreshToken: 'fake-refresh-token-' + Date.now(),
            user: users[email]
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Identifiants invalides'
        });
    }
});

// ========== ROUTES UTILISATEURS ==========
// Route pour récupérer tous les utilisateurs (avec pagination)
app.get('/api/users', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const allUsers = [
        { id: 1, username: 'admin', email: 'admin@test.com', roleId: 3, isActive: true, Role: { name: 'admin' } },
        { id: 2, username: 'student1', email: 'student1@test.com', roleId: 1, isActive: true, Role: { name: 'student' } },
        { id: 3, username: 'teacher1', email: 'teacher1@test.com', roleId: 2, isActive: true, Role: { name: 'teacher' } },
        { id: 4, username: 'student2', email: 'student2@test.com', roleId: 1, isActive: false, Role: { name: 'student' } }
    ];
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        data: {
            users: paginatedUsers,
            totalPages: Math.ceil(allUsers.length / limit),
            currentPage: parseInt(page),
            totalUsers: allUsers.length
        }
    });
});

// Route pour créer un utilisateur
app.post('/api/users', (req, res) => {
    const { username, email, roleId, isActive } = req.body;
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        roleId: parseInt(roleId),
        isActive: isActive !== false,
        Role: { name: roleId === 3 ? 'admin' : roleId === 2 ? 'teacher' : 'student' }
    };
    
    res.json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: { user: newUser }
    });
});

// Route pour modifier un utilisateur
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email, roleId, isActive } = req.body;
    
    const updatedUser = {
        id: parseInt(id),
        username,
        email,
        roleId: parseInt(roleId),
        isActive: isActive !== false,
        Role: { name: roleId === 3 ? 'admin' : roleId === 2 ? 'teacher' : 'student' }
    };
    
    res.json({
        success: true,
        message: 'Utilisateur modifié avec succès',
        data: { user: updatedUser }
    });
});

// Route pour supprimer un utilisateur
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    
    res.json({
        success: true,
        message: `Utilisateur ${id} supprimé avec succès`
    });
});

// ========== ROUTES COURS ==========
// Base de données simulée pour les cours
const coursesDB = [
    {
        id: 1,
        name: 'Introduction à React',
        title: 'Introduction à React',
        code: 'REACT101',
        description: 'Apprenez les fondamentaux de React.js : composants, state, props, hooks et gestion d\'événements.',
        semester: '2025-1',
        teacherId: 3,
        teacher: { id: 3, firstName: 'Marie', lastName: 'Dubois' },
        credits: 3,
        enrollments: [
            { id: 1, studentId: 2, status: 'active', enrolledAt: '2025-01-01' }
        ],
        assignments: [
            { id: 1, title: 'Créer votre premier composant React', dueDate: '2025-01-15' },
            { id: 2, title: 'Gestion du state avec useState', dueDate: '2025-01-22' }
        ]
    },
    {
        id: 2,
        name: 'Node.js Avancé',
        title: 'Node.js Avancé',
        code: 'NODE201',
        description: 'Développement backend avancé avec Node.js : APIs REST, bases de données, authentification.',
        semester: '2025-1',
        teacherId: 3,
        teacher: { id: 3, firstName: 'Marie', lastName: 'Dubois' },
        credits: 4,
        enrollments: [
            { id: 2, studentId: 2, status: 'active', enrolledAt: '2025-01-01' }
        ],
        assignments: [
            { id: 3, title: 'API REST avec Express', dueDate: '2025-01-20' },
            { id: 4, title: 'Authentification JWT', dueDate: '2025-01-27' }
        ]
    },
    {
        id: 3,
        name: 'Base de Données SQL',
        title: 'Base de Données SQL',
        code: 'SQL101',
        description: 'Maîtrisez les bases de données relationnelles : requêtes SQL, design de schémas, optimisation.',
        semester: '2025-1',
        teacherId: 3,
        teacher: { id: 3, firstName: 'Marie', lastName: 'Dubois' },
        credits: 3,
        enrollments: [
            { id: 3, studentId: 2, status: 'active', enrolledAt: '2025-01-01' }
        ],
        assignments: [
            { id: 5, title: 'Conception de schéma de base de données', dueDate: '2025-01-18' }
        ]
    },
    {
        id: 4,
        name: 'JavaScript ES6+',
        title: 'JavaScript ES6+',
        code: 'JS301',
        description: 'Fonctionnalités avancées de JavaScript : async/await, destructuring, modules, classes.',
        semester: '2025-1',
        teacherId: 3,
        teacher: { id: 3, firstName: 'Marie', lastName: 'Dubois' },
        credits: 2,
        enrollments: [],
        assignments: [
            { id: 6, title: 'Programmation asynchrone avec Promises', dueDate: '2025-01-25' }
        ]
    }
];

// Base de données simulée pour les devoirs
const assignmentsDB = [
    {
        id: 1,
        title: 'Créer votre premier composant React',
        description: 'Développez un composant React fonctionnel qui affiche des informations utilisateur avec des props.',
        courseId: 1,
        course: { id: 1, name: 'Introduction à React', code: 'REACT101' },
        teacherId: 3,
        dueDate: '2025-01-15T23:59:00Z',
        maxPoints: 100,
        status: 'active',
        createdAt: '2025-01-01T10:00:00Z'
    },
    {
        id: 2,
        title: 'Gestion du state avec useState',
        description: 'Créez une application de compteur utilisant le hook useState pour gérer l\'état local.',
        courseId: 1,
        course: { id: 1, name: 'Introduction à React', code: 'REACT101' },
        teacherId: 3,
        dueDate: '2025-01-22T23:59:00Z',
        maxPoints: 100,
        status: 'active',
        createdAt: '2025-01-08T14:00:00Z'
    },
    {
        id: 3,
        title: 'API REST avec Express',
        description: 'Développez une API REST complète avec Express.js incluant CRUD et gestion d\'erreurs.',
        courseId: 2,
        course: { id: 2, name: 'Node.js Avancé', code: 'NODE201' },
        teacherId: 3,
        dueDate: '2025-01-20T23:59:00Z',
        maxPoints: 150,
        status: 'active',
        createdAt: '2025-01-05T09:00:00Z'
    },
    {
        id: 4,
        title: 'Authentification JWT',
        description: 'Implémentez un système d\'authentification sécurisé avec JSON Web Tokens.',
        courseId: 2,
        course: { id: 2, name: 'Node.js Avancé', code: 'NODE201' },
        teacherId: 3,
        dueDate: '2025-01-27T23:59:00Z',
        maxPoints: 120,
        status: 'active',
        createdAt: '2025-01-10T11:00:00Z'
    },
    {
        id: 5,
        title: 'Conception de schéma de base de données',
        description: 'Concevez un schéma de base de données pour un système de gestion scolaire.',
        courseId: 3,
        course: { id: 3, name: 'Base de Données SQL', code: 'SQL101' },
        teacherId: 3,
        dueDate: '2025-01-18T23:59:00Z',
        maxPoints: 100,
        status: 'active',
        createdAt: '2025-01-03T16:00:00Z'
    },
    {
        id: 6,
        title: 'Programmation asynchrone avec Promises',
        description: 'Maîtrisez les Promises et async/await pour gérer les opérations asynchrones.',
        courseId: 4,
        course: { id: 4, name: 'JavaScript ES6+', code: 'JS301' },
        teacherId: 3,
        dueDate: '2025-01-25T23:59:00Z',
        maxPoints: 80,
        status: 'active',
        createdAt: '2025-01-07T13:00:00Z'
    },
    {
        id: 7,
        title: 'Hooks React Avancés',
        description: 'Utilisez useEffect, useContext et créez vos propres hooks personnalisés.',
        courseId: 1,
        course: { id: 1, name: 'Introduction à React', code: 'REACT101' },
        teacherId: 3,
        dueDate: '2025-10-15T23:59:00Z',
        maxPoints: 100,
        status: 'active',
        createdAt: '2025-10-01T10:00:00Z'
    },
    {
        id: 8,
        title: 'Formulaires React avec Validation',
        description: 'Créez des formulaires interactifs avec validation en temps réel.',
        courseId: 1,
        course: { id: 1, name: 'Introduction à React', code: 'REACT101' },
        teacherId: 3,
        dueDate: '2025-10-20T23:59:00Z',
        maxPoints: 90,
        status: 'active',
        createdAt: '2025-10-05T14:00:00Z'
    },
    {
        id: 9,
        title: 'Middleware Express Personnalisé',
        description: 'Développez des middlewares Express pour l\'authentification et la validation.',
        courseId: 2,
        course: { id: 2, name: 'Node.js Avancé', code: 'NODE201' },
        teacherId: 3,
        dueDate: '2025-10-18T23:59:00Z',
        maxPoints: 110,
        status: 'active',
        createdAt: '2025-10-08T09:00:00Z'
    },
    {
        id: 10,
        title: 'Requêtes SQL Complexes',
        description: 'Écrivez des requêtes SQL avec jointures, sous-requêtes et fonctions d\'agrégation.',
        courseId: 3,
        course: { id: 3, name: 'Base de Données SQL', code: 'SQL101' },
        teacherId: 3,
        dueDate: '2025-10-22T23:59:00Z',
        maxPoints: 95,
        status: 'active',
        createdAt: '2025-10-06T11:00:00Z'
    }
];

// Initialiser les propriétés de rappels pour les devoirs existants
assignmentsDB.forEach(assignment => {
    if (!assignment.reminderSent24h) assignment.reminderSent24h = false;
    if (!assignment.reminderSent48h) assignment.reminderSent48h = false;
    if (!assignment.status) assignment.status = 'published';
});

// Base de données simulée pour les soumissions
const submissionsDB = [
    {
        id: 1,
        assignmentId: 1,
        studentId: 3,
        student: { firstName: 'Pierre', lastName: 'Martin' },
        assignment: { id: 1, title: 'Créer votre premier composant React' },
        content: 'Voici mon composant React fonctionnel...',
        fileUrl: '/uploads/submission_1.zip',
        submittedAt: '2025-01-14T18:30:00Z',
        status: 'submitted',
        grade: null,
        feedback: null
    },
    {
        id: 2,
        assignmentId: 3,
        studentId: 3,
        student: { firstName: 'Pierre', lastName: 'Martin' },
        assignment: { id: 3, title: 'API REST avec Express' },
        content: 'Mon API REST Express avec toutes les fonctionnalités...',
        fileUrl: '/uploads/submission_2.zip',
        submittedAt: '2025-01-19T20:15:00Z',
        status: 'graded',
        grade: 135,
        feedback: 'Excellent travail! Code bien structuré et API complète.'
    }
];

// Base de données simulée pour les notes
const gradesDB = [
    {
        id: 1,
        studentId: 3,
        assignmentId: 3,
        submissionId: 2,
        student: { firstName: 'Jean', lastName: 'Martin' },
        assignment: { id: 3, title: 'API REST avec Express' },
        value: 135,
        maxValue: 150,
        percentage: 90,
        grade: 'A',
        feedback: 'Excellent travail! Code bien structuré et API complète.',
        gradedAt: '2025-01-20T10:00:00Z',
        gradedBy: 2,
        teacher: { firstName: 'Marie', lastName: 'Dubois' }
    }
];

// Base de données pour les notifications emails/système
const notificationsDB = [];

// Base de données pour les sessions synchrones (rencontres en ligne)
const synchronousSessionsDB = [
    {
        id: 1,
        title: 'Session de révision React',
        courseId: 1,
        course: { name: 'Introduction à React' },
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        meetingLink: 'https://meet.example.com/react-session-1',
        teacherId: 2,
        teacher: { firstName: 'Marie', lastName: 'Dubois', email: 'professeur@plateforme.edu' },
        status: 'scheduled',
        participants: [],
        reminders: {
            sent24h: false,
            sent1h: false
        }
    },
    {
        id: 2,
        title: 'Tutoriel Node.js - Architecture REST',
        courseId: 2,
        course: { name: 'Node.js Avancé' },
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        meetingLink: 'https://meet.example.com/nodejs-session-2',
        teacherId: 2,
        teacher: { firstName: 'Marie', lastName: 'Dubois', email: 'professeur@plateforme.edu' },
        status: 'scheduled',
        participants: [],
        reminders: {
            sent24h: false,
            sent1h: false
        }
    }
];

// Base de données simulée pour les inscriptions
const enrollmentsDB = [
    {
        id: 1,
        studentId: 3,
        courseId: 1,
        status: 'active',
        enrolledAt: '2025-01-01T10:00:00Z',
        student: { id: 3, firstName: 'Pierre', lastName: 'Martin', email: 'etudiant@plateforme.edu' },
        course: { id: 1, name: 'Introduction à React', code: 'REACT101' }
    },
    {
        id: 2,
        studentId: 3,
        courseId: 2,
        status: 'active',
        enrolledAt: '2025-01-01T10:00:00Z',
        student: { id: 3, firstName: 'Pierre', lastName: 'Martin', email: 'etudiant@plateforme.edu' },
        course: { id: 2, name: 'Node.js Avancé', code: 'NODE201' }
    },
    {
        id: 3,
        studentId: 3,
        courseId: 3,
        status: 'active',
        enrolledAt: '2025-01-01T10:00:00Z',
        student: { id: 3, firstName: 'Pierre', lastName: 'Martin', email: 'etudiant@plateforme.edu' },
        course: { id: 3, name: 'Base de Données SQL', code: 'SQL101' }
    }
];

// Simulation des routes de cours
app.get('/api/courses', (req, res) => {
    res.json({
        success: true,
        data: coursesDB
    });
});

// Route pour récupérer les cours d'un enseignant
app.get('/api/courses/teacher/:teacherId', (req, res) => {
    const { teacherId } = req.params;
    const teacherCourses = coursesDB.filter(course => course.teacherId == teacherId);
    
    res.json({
        success: true,
        data: teacherCourses
    });
});

// Route pour récupérer un cours spécifique
app.get('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    const course = coursesDB.find(c => c.id == id);
    
    if (!course) {
        return res.status(404).json({
            success: false,
            message: 'Cours non trouvé'
        });
    }
    
    res.json({
        success: true,
        data: course
    });
});

// Route pour créer un cours
app.post('/api/courses', (req, res) => {
    const { name, code, description, semester } = req.body;
    
    const newCourse = {
        id: Date.now(),
        name,
        code,
        description,
        semester,
        teacherId: 2,
        User: { firstName: 'Marie', lastName: 'Dubois' },
        enrollments: [],
        assignments: []
    };
    
    res.json({
        success: true,
        message: 'Cours créé avec succès',
        data: { course: newCourse }
    });
});

// Route pour modifier un cours
app.put('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, credits, semester, code } = req.body;
    
    // Trouver l'index du cours dans coursesDB
    const courseIndex = coursesDB.findIndex(c => c.id == id);
    
    if (courseIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Cours non trouvé'
        });
    }
    
    // Mettre à jour le cours dans coursesDB
    coursesDB[courseIndex] = {
        ...coursesDB[courseIndex],
        title: title || coursesDB[courseIndex].title,
        name: title || coursesDB[courseIndex].name, // Garder name pour compatibilité
        description: description || coursesDB[courseIndex].description,
        credits: credits || coursesDB[courseIndex].credits,
        semester: semester || coursesDB[courseIndex].semester,
        code: code || coursesDB[courseIndex].code
    };
    
    console.log(`✅ Cours ${id} mis à jour:`, coursesDB[courseIndex]);
    
    res.json({
        success: true,
        message: 'Cours modifié avec succès',
        data: { course: coursesDB[courseIndex] }
    });
});

// Route pour supprimer un cours
app.delete('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    
    // Trouver l'index du cours
    const courseIndex = coursesDB.findIndex(c => c.id == id);
    
    if (courseIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Cours non trouvé'
        });
    }
    
    // Supprimer le cours du tableau
    const deletedCourse = coursesDB.splice(courseIndex, 1)[0];
    
    console.log(`🗑️ Cours ${id} supprimé:`, deletedCourse.title || deletedCourse.name);
    
    res.json({
        success: true,
        message: `Cours supprimé avec succès`,
        data: { course: deletedCourse }
    });
});

// ========== ROUTES NOTIFICATIONS ==========
// Route pour créer une notification
app.post('/api/notifications', (req, res) => {
    const { title, message, userId } = req.body;
    
    const newNotification = {
        id: Date.now(),
        title,
        message,
        userId,
        isRead: false,
        createdAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: 'Notification créée avec succès',
        data: { notification: newNotification }
    });
});

// Route pour récupérer les notifications d'un utilisateur
app.get('/api/notifications/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    const notifications = [
        {
            id: 1,
            title: 'Nouveau cours disponible',
            message: 'Le cours React.js est maintenant disponible',
            userId: parseInt(userId),
            isRead: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Devoir à rendre',
            message: 'N\'oubliez pas de rendre votre devoir avant demain',
            userId: parseInt(userId),
            isRead: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    res.json({
        success: true,
        data: { notifications }
    });
});

// Route pour marquer une notification comme lue
app.put('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    
    res.json({
        success: true,
        message: `Notification ${id} marquée comme lue`
    });
});

// ========== ROUTES ANALYTICS ==========
// Route pour les statistiques générales
app.get('/api/analytics/stats', (req, res) => {
    const totalEnrollments = enrollmentsDB.length;
    const totalSubmissions = submissionsDB.length;
    const totalAssignments = assignmentsDB.length;
    const totalCourses = coursesDB.length;
    
    console.log('📊 Statistiques calculées:', {
        totalEnrollments,
        totalSubmissions, 
        totalAssignments,
        totalCourses
    });
    
    res.json({
        success: true,
        data: {
            totalUsers: 150,
            totalCourses: totalCourses,
            totalEnrollments: totalEnrollments,
            totalAssignments: totalAssignments,
            totalSubmissions: totalSubmissions,
            recentActivity: [
                { type: 'user_registered', count: 5, date: new Date().toISOString() },
                { type: 'course_created', count: 2, date: new Date().toISOString() },
                { type: 'assignment_submitted', count: totalSubmissions, date: new Date().toISOString() }
            ]
        }
    });
});

// Route pour les données de graphiques
app.get('/api/analytics/charts', (req, res) => {
    const enrollmentsByMonth = [
        { month: 'Jan', enrollments: 45 },
        { month: 'Feb', enrollments: 52 },
        { month: 'Mar', enrollments: 48 },
        { month: 'Apr', enrollments: 61 },
        { month: 'May', enrollments: 55 },
        { month: 'Jun', enrollments: 67 }
    ];
    
    const submissionsByDay = [
        { day: 'Lun', submissions: 12 },
        { day: 'Mar', submissions: 19 },
        { day: 'Mer', submissions: 15 },
        { day: 'Jeu', submissions: 22 },
        { day: 'Ven', submissions: 18 },
        { day: 'Sam', submissions: 8 },
        { day: 'Dim', submissions: 5 }
    ];
    
    console.log('📈 Données graphiques générées');
    
    res.json({
        success: true,
        data: {
            enrollmentsByMonth,
            submissionsByDay,
            coursePopularity: coursesDB.map(course => ({
                name: course.name,
                enrollments: enrollmentsDB.filter(e => e.courseId === course.id).length
            }))
        }
    });
});

// Route pour les statistiques du dashboard (compatible avec l'ancien)
app.get('/api/analytics/dashboard', (req, res) => {
    res.json({
        success: true,
        data: {
            totalUsers: 150,
            totalCourses: coursesDB.length,
            totalEnrollments: enrollmentsDB.length,
            totalAssignments: assignmentsDB.length,
            recentActivity: [
                { type: 'user_registered', count: 5, date: new Date().toISOString() },
                { type: 'course_created', count: 2, date: new Date().toISOString() },
                { type: 'assignment_submitted', count: submissionsDB.length, date: new Date().toISOString() }
            ]
        }
    });
});

// Route pour les analytics d'un enseignant
app.get('/api/analytics/teacher/:teacherId', (req, res) => {
    const { teacherId } = req.params;
    
    res.json({
        success: true,
        data: {
            overview: {
                total_courses: 3,
                total_students: 45,
                total_assignments: 12,
                pending_reviews: 8
            },
            recent_activity: [
                { type: 'assignment_submitted', count: 3, date: new Date().toISOString() },
                { type: 'student_enrolled', count: 2, date: new Date().toISOString() }
            ]
        }
    });
});

// Route pour récupérer les cours d'un enseignant
app.get('/api/courses/teacher/:teacherId', (req, res) => {
    const { teacherId } = req.params;
    
    res.json({
        success: true,
        data: {
            courses: [
                {
                    id: 1,
                    title: 'Introduction à React',
                    code: 'REACT101',
                    description: 'Cours de base sur React.js',
                    semester: '2025-1',
                    students_count: 25
                },
                {
                    id: 2,
                    title: 'Node.js Avancé',
                    code: 'NODE201',
                    description: 'Développement backend avec Node.js',
                    semester: '2025-1',
                    students_count: 20
                }
            ]
        }
    });
});

// Route pour récupérer les utilisateurs de test
app.get('/api/users/test', (req, res) => {
    res.json({
        success: true,
        message: 'Utilisateurs de test disponibles',
        users: [
            {
                id: 1,
                firstName: 'Admin',
                lastName: 'Système',
                email: 'admin@plateforme.edu',
                password: 'password123',
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin+Système&background=3498db&color=fff',
                description: 'Administrateur système avec accès complet'
            },
            {
                id: 2,
                firstName: 'Marie',
                lastName: 'Dubois',
                email: 'professeur@plateforme.edu',
                password: 'password123',
                role: 'teacher',
                avatar: 'https://ui-avatars.com/api/?name=Marie+Dubois&background=27ae60&color=fff',
                description: 'Professeur - peut créer des cours et gérer les étudiants'
            },
            {
                id: 3,
                firstName: 'Pierre',
                lastName: 'Martin',
                email: 'etudiant@plateforme.edu',
                password: 'password123',
                role: 'student',
                avatar: 'https://ui-avatars.com/api/?name=Pierre+Martin&background=e74c3c&color=fff',
                description: 'Étudiant - peut s\'inscrire aux cours et soumettre des devoirs'
            }
        ]
    });
});

// Simulation des routes d'utilisateurs
app.get('/api/users', (req, res) => {
    res.json([
        { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@test.com', Role: { name: 'Admin' } },
        { id: 2, firstName: 'Teacher', lastName: 'User', email: 'teacher@test.com', Role: { name: 'Teacher' } },
        { id: 3, firstName: 'Student', lastName: 'User', email: 'student@test.com', Role: { name: 'Student' } }
    ]);
});

// Simulation des routes d'inscriptions
app.get('/api/enrollments', (req, res) => {
    res.json([
        {
            id: 1,
            studentId: 3,
            courseId: 1,
            status: 'active',
            createdAt: new Date().toISOString(),
            User: { firstName: 'Student', lastName: 'User' },
            Course: { name: 'Introduction à React' }
        }
    ]);
});

// Simulation des routes de notifications
app.get('/api/notifications', (req, res) => {
    res.json([
        {
            id: 1,
            title: 'Nouveau devoir disponible',
            message: 'Un nouveau devoir a été publié dans le cours React',
            isRead: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Note publiée',
            message: 'Votre note pour le devoir précédent est disponible',
            isRead: false,
            createdAt: new Date().toISOString()
        }
    ]);
});

// Simulation des routes de notes
app.get('/api/grades', (req, res) => {
    res.json([
        {
            id: 1,
            value: 85,
            feedback: 'Excellent travail !',
            createdAt: new Date().toISOString(),
            Assignment: {
                title: 'Projet React Components',
                Course: { name: 'Introduction à React' }
            }
        }
    ]);
});

// ========== ROUTES DEVOIRS (ASSIGNMENTS) ==========
// Route pour récupérer tous les devoirs
app.get('/api/assignments', (req, res) => {
    const { teacher_id, course_id } = req.query;
    let filteredAssignments = assignmentsDB;
    
    if (teacher_id) {
        filteredAssignments = filteredAssignments.filter(a => a.teacherId == teacher_id);
    }
    
    if (course_id) {
        filteredAssignments = filteredAssignments.filter(a => a.courseId == course_id);
    }
    
    res.json({
        success: true,
        data: filteredAssignments
    });
});

// Route pour récupérer un devoir spécifique
app.get('/api/assignments/:id', (req, res) => {
    const { id } = req.params;
    const assignment = assignmentsDB.find(a => a.id == id);
    
    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: 'Devoir non trouvé'
        });
    }
    
    res.json({
        success: true,
        data: assignment
    });
});

// Route pour créer un nouveau devoir
app.post('/api/assignments', (req, res) => {
    const { title, description, courseId, dueDate, maxPoints } = req.body;
    
    const newAssignment = {
        id: assignmentsDB.length + 1,
        title,
        description,
        courseId: parseInt(courseId),
        course: coursesDB.find(c => c.id == courseId),
        teacherId: 3,
        dueDate,
        maxPoints: parseInt(maxPoints) || 100,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    assignmentsDB.push(newAssignment);
    
    res.json({
        success: true,
        message: 'Devoir créé avec succès',
        data: newAssignment
    });
});

// ========== ROUTES SOUMISSIONS (SUBMISSIONS) ==========
// Route pour récupérer toutes les soumissions
app.get('/api/submissions', (req, res) => {
    const { studentId, assignmentId } = req.query;
    let filteredSubmissions = submissionsDB;
    
    if (studentId) {
        filteredSubmissions = filteredSubmissions.filter(s => s.studentId == studentId);
    }
    
    if (assignmentId) {
        filteredSubmissions = filteredSubmissions.filter(s => s.assignmentId == assignmentId);
    }
    
    res.json({
        success: true,
        data: filteredSubmissions
    });
});

// Route pour récupérer les soumissions d'un devoir
app.get('/api/submissions/assignment/:assignmentId', (req, res) => {
    const { assignmentId } = req.params;
    const submissions = submissionsDB.filter(s => s.assignmentId == assignmentId);
    
    res.json({
        success: true,
        data: submissions
    });
});

// Route pour soumettre un devoir
app.post('/api/submissions', (req, res) => {
    try {
        const { assignmentId, studentId, content, fileUrl } = req.body;
        
        console.log('📝 Nouvelle soumission reçue:', { assignmentId, studentId, content: content.substring(0, 50) + '...' });
        
        // Vérifier si l'étudiant a déjà soumis ce devoir
        const existingSubmission = submissionsDB.find(s => 
            s.assignmentId == assignmentId && s.studentId == studentId
        );
        
        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà soumis ce devoir'
            });
        }
    
    const assignment = assignmentsDB.find(a => a.id == assignmentId);
    
    const newSubmission = {
        id: submissionsDB.length + 1,
        assignmentId: parseInt(assignmentId),
        studentId: parseInt(studentId),
        student: { firstName: 'Jean', lastName: 'Martin' },
        assignment: assignment,
        content,
        fileUrl: fileUrl || null,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        grade: null,
        feedback: null
    };
    
    submissionsDB.push(newSubmission);
    
    // Envoi de notification par email
    const studentEmail = 'etudiant@plateforme.edu'; // Email de l'étudiant (à configurer)
    
    // Email pour l'étudiant
    const studentEmailContent = `
        <h3 style="color: #059669;">✅ Soumission reçue avec succès !</h3>
        <p>Bonjour <strong>${newSubmission.student.firstName} ${newSubmission.student.lastName}</strong>,</p>
        <p>Votre soumission pour le devoir <strong>"${assignment ? assignment.title : 'Devoir'}"</strong> a été reçue avec succès.</p>
        <div style="background-color: #ecfccb; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>📋 Détails de la soumission :</strong></p>
            <ul>
                <li><strong>Devoir :</strong> ${assignment ? assignment.title : 'Devoir'}</li>
                <li><strong>Date de soumission :</strong> ${new Date(newSubmission.submittedAt).toLocaleString('fr-FR')}</li>
                <li><strong>Statut :</strong> Soumis avec succès</li>
            </ul>
        </div>
        <p>Votre professeur sera notifié de votre soumission et vous recevrez un email lorsque votre travail sera évalué.</p>
        <p style="color: #059669;"><strong>Bonne continuation dans vos études ! 📚</strong></p>
    `;
    
    // Email pour le professeur
    const teacherEmail = 'professeur@plateforme.edu'; // Email du professeur
    const teacherEmailContent = `
        <h3 style="color: #dc2626;">📝 Nouvelle soumission reçue</h3>
        <p>Bonjour,</p>
        <p>Un étudiant a soumis un devoir sur la plateforme éducative.</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>📋 Détails de la soumission :</strong></p>
            <ul>
                <li><strong>Étudiant :</strong> ${newSubmission.student.firstName} ${newSubmission.student.lastName}</li>
                <li><strong>Devoir :</strong> ${assignment ? assignment.title : 'Devoir'}</li>
                <li><strong>Date de soumission :</strong> ${new Date(newSubmission.submittedAt).toLocaleString('fr-FR')}</li>
                <li><strong>ID de soumission :</strong> #${newSubmission.id}</li>
            </ul>
        </div>
        <p>Vous pouvez maintenant consulter et évaluer cette soumission dans l'interface enseignant.</p>
        <p style="color: #dc2626;"><strong>Plateforme Éducative - Système de notification automatique</strong></p>
    `;
    
    // Envoyer les emails de notification (de façon asynchrone sans bloquer la réponse)
    sendNotificationEmail(studentEmail, '✅ Soumission reçue - ' + (assignment ? assignment.title : 'Devoir'), studentEmailContent)
        .then(result => {
            if (result.success) {
                console.log('✅ Email étudiant envoyé avec succès');
            } else {
                console.log('❌ Erreur envoi email étudiant:', result.error);
            }
        })
        .catch(error => {
            console.log('❌ Erreur envoi email étudiant:', error);
        });
        
    sendNotificationEmail(teacherEmail, '📝 Nouvelle soumission reçue - ' + (assignment ? assignment.title : 'Devoir'), teacherEmailContent)
        .then(result => {
            if (result.success) {
                console.log('✅ Email professeur envoyé avec succès');
            } else {
                console.log('❌ Erreur envoi email professeur:', result.error);
            }
        })
        .catch(error => {
            console.log('❌ Erreur envoi email professeur:', error);
        });
    
    res.json({
        success: true,
        message: 'Devoir soumis avec succès. Notifications par email en cours d\'envoi.',
        data: newSubmission
    });
    
    } catch (error) {
        console.error('❌ Erreur lors de la soumission:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la soumission',
            error: error.message
        });
    }
});

// Route pour noter une soumission
app.put('/api/submissions/:id/grade', (req, res) => {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    
    const submission = submissionsDB.find(s => s.id == id);
    if (!submission) {
        return res.status(404).json({
            success: false,
            message: 'Soumission non trouvée'
        });
    }
    
    submission.grade = parseInt(grade);
    submission.feedback = feedback;
    submission.status = 'graded';
    
    // Ajouter la note à la base de données des notes
    const newGrade = {
        id: gradesDB.length + 1,
        studentId: submission.studentId,
        assignmentId: submission.assignmentId,
        submissionId: submission.id,
        student: submission.student,
        assignment: submission.assignment,
        value: parseInt(grade),
        maxValue: submission.assignment?.maxPoints || 100,
        percentage: Math.round((parseInt(grade) / (submission.assignment?.maxPoints || 100)) * 100),
        grade: getLetterGrade(parseInt(grade), submission.assignment?.maxPoints || 100),
        feedback,
        gradedAt: new Date().toISOString(),
        gradedBy: 3,
        teacher: { firstName: 'Marie', lastName: 'Dubois' }
    };
    
    gradesDB.push(newGrade);
    
    res.json({
        success: true,
        message: 'Note attribuée avec succès',
        data: { submission, grade: newGrade }
    });
});

// ========== ROUTES INSCRIPTIONS (ENROLLMENTS) ==========
// Route pour récupérer les inscriptions d'un étudiant
app.get('/api/enrollments/student/:studentId', (req, res) => {
    const { studentId } = req.params;
    
    const studentEnrollments = [
        {
            id: 1,
            studentId: parseInt(studentId),
            courseId: 1,
            course: coursesDB.find(c => c.id === 1),
            status: 'active',
            enrolledAt: '2025-01-01T10:00:00Z',
            progress: 75
        },
        {
            id: 2,
            studentId: parseInt(studentId),
            courseId: 2,
            course: coursesDB.find(c => c.id === 2),
            status: 'active',
            enrolledAt: '2025-01-01T10:00:00Z',
            progress: 60
        },
        {
            id: 3,
            studentId: parseInt(studentId),
            courseId: 3,
            course: coursesDB.find(c => c.id === 3),
            status: 'active',
            enrolledAt: '2025-01-01T10:00:00Z',
            progress: 40
        }
    ];
    
    res.json({
        success: true,
        data: studentEnrollments
    });
});

// Route pour s'inscrire à un cours
app.post('/api/enrollments', (req, res) => {
    const { studentId, courseId } = req.body;
    
    const course = coursesDB.find(c => c.id == courseId);
    if (!course) {
        return res.status(404).json({
            success: false,
            message: 'Cours non trouvé'
        });
    }
    
    const newEnrollment = {
        id: Date.now(),
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        Course: course, // Majuscule pour être cohérent avec les données existantes
        status: 'active',
        enrolledAt: new Date().toISOString(),
        progress: 0
    };
    
    // IMPORTANT: Sauvegarder l'inscription dans la base de données !
    enrollmentsDB.push(newEnrollment);
    
    console.log('✅ Nouvelle inscription créée:', newEnrollment);
    console.log('📊 Total inscriptions:', enrollmentsDB.length);
    
    res.json({
        success: true,
        message: 'Inscription réussie',
        data: newEnrollment
    });
});

// ========== ROUTES NOTES (GRADES) ==========
// Route pour récupérer les notes d'un étudiant
app.get('/api/grades/student/:studentId', (req, res) => {
    const { studentId } = req.params;
    const studentGrades = gradesDB.filter(g => g.studentId == studentId);
    
    res.json({
        success: true,
        data: studentGrades
    });
});

// ========== FONCTIONS UTILITAIRES ==========
function getLetterGrade(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
}

// ========== ROUTES INSCRIPTIONS (ENROLLMENTS) ==========
// Route pour récupérer toutes les inscriptions
app.get('/api/enrollments', (req, res) => {
    const { studentId, courseId } = req.query;
    let filteredEnrollments = enrollmentsDB;
    
    if (studentId) {
        filteredEnrollments = filteredEnrollments.filter(e => e.studentId == studentId);
    }
    
    if (courseId) {
        filteredEnrollments = filteredEnrollments.filter(e => e.courseId == courseId);
    }
    
    res.json({
        success: true,
        data: filteredEnrollments
    });
});

// Route pour supprimer une inscription
app.delete('/api/enrollments/:id', (req, res) => {
    const { id } = req.params;
    const enrollmentIndex = enrollmentsDB.findIndex(e => e.id == id);
    
    if (enrollmentIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Inscription introuvable'
        });
    }
    
    enrollmentsDB.splice(enrollmentIndex, 1);
    
    res.json({
        success: true,
        message: 'Inscription supprimée avec succès'
    });
});

// ========== ROUTES SESSIONS SYNCHRONES ==========
console.log('📌 Enregistrement des routes /api/sessions...');

// Récupérer toutes les sessions synchrones
app.get('/api/sessions', (req, res) => {
    console.log('✅ Route /api/sessions appelée!');
    const { courseId, status } = req.query;
    
    let filteredSessions = synchronousSessionsDB;
    
    if (courseId) {
        filteredSessions = filteredSessions.filter(s => s.courseId == courseId);
    }
    
    if (status) {
        filteredSessions = filteredSessions.filter(s => s.status === status);
    }
    
    res.json({
        success: true,
        data: filteredSessions
    });
});

// Créer une nouvelle session synchrone
app.post('/api/sessions', async (req, res) => {
    const { title, courseId, startTime, endTime, meetingLink } = req.body;
    
    const course = coursesDB.find(c => c.id == courseId);
    
    const newSession = {
        id: synchronousSessionsDB.length + 1,
        title,
        courseId: parseInt(courseId),
        course: course ? { name: course.name } : null,
        startTime,
        endTime,
        meetingLink,
        teacherId: 2,
        teacher: { firstName: 'Marie', lastName: 'Dubois', email: 'professeur@plateforme.edu' },
        status: 'scheduled',
        participants: [],
        reminders: {
            sent24h: false,
            sent1h: false
        }
    };
    
    synchronousSessionsDB.push(newSession);
    
    // Envoyer immédiatement une notification de création aux étudiants inscrits
    const enrollments = enrollmentsDB.filter(e => e.courseId == courseId);
    
    for (const enrollment of enrollments) {
        const emailContent = `
            <h3>🎓 Nouvelle session synchrone planifiée</h3>
            <p><strong>${title}</strong></p>
            <p>📅 Date: ${new Date(startTime).toLocaleDateString('fr-FR')}</p>
            <p>🕐 Heure: ${new Date(startTime).toLocaleTimeString('fr-FR')}</p>
            <p>📚 Cours: ${course?.name}</p>
            <p>🔗 Lien: <a href="${meetingLink}">${meetingLink}</a></p>
            <p>Vous recevrez des rappels 24h et 1h avant la session.</p>
        `;
        
        await sendNotificationEmail(
            enrollment.student.email,
            `🎓 Nouvelle session: ${title}`,
            emailContent
        );
    }
    
    res.json({
        success: true,
        message: 'Session créée avec succès',
        data: newSession
    });
});

// ========== ROUTES NOTIFICATIONS EMAIL ==========
console.log('📌 Enregistrement des routes /api/notifications/emails...');

// Récupérer les notifications emails
app.get('/api/notifications/emails', (req, res) => {
    console.log('✅ Route /api/notifications/emails appelée!');
    const { limit = 50 } = req.query;
    
    const recentNotifications = notificationsDB
        .slice(-limit)
        .reverse();
    
    res.json({
        success: true,
        data: recentNotifications,
        total: notificationsDB.length
    });
});

// Tester l'envoi d'email
app.post('/api/notifications/test-email', async (req, res) => {
    const { to, subject, content } = req.body;
    
    const result = await sendNotificationEmail(
        to || 'test@example.com',
        subject || 'Test Email',
        content || '<p>Ceci est un email de test.</p>'
    );
    
    res.json({
        success: true,
        message: 'Email de test envoyé',
        result: result
    });
});

// ========== ROUTES ICALENDAR - Génération de fichiers .ics ==========
const icalController = require('./src/controllers/icalController');

// Initialiser les databases pour le contrôleur iCal
icalController.setDatabases({
    synchronousSessionsDB,
    assignmentsDB,
    coursesDB,
    enrollmentsDB
});

// Routes pour télécharger les fichiers .ics
app.get('/api/calendar/session/:sessionId/ics', icalController.generateSessionICS);
app.get('/api/calendar/assignment/:assignmentId/ics', icalController.generateAssignmentICS);
app.get('/api/calendar/student/:studentId/ics', icalController.generateStudentCalendarICS);

console.log('📅 Routes iCalendar enregistrées (génération de fichiers .ics)');

// ========== GESTION DES ERREURS 404 (DOIT ÊTRE APRÈS TOUTES LES ROUTES) ==========
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl 
    });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({ 
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

// ========== INITIALISATION DU SYSTÈME DE RAPPELS AUTOMATIQUES ==========
// Démarrer les vérifications périodiques (toutes les 30 minutes)
setInterval(checkAndSendSessionReminders, 30 * 60 * 1000);
setInterval(checkAndSendAssignmentReminders, 30 * 60 * 1000);

// Exécuter immédiatement au démarrage
console.log('🔔 Initialisation du système de rappels automatiques...');
checkAndSendSessionReminders();
checkAndSendAssignmentReminders();

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 SERVEUR ACADÉMIQUE DÉMARRÉ');
    console.log('='.repeat(50));
    console.log(`📋 API principale: http://localhost:${PORT}`);
    console.log(`🔧 API de test: http://localhost:${PORT}/api/test`);
    console.log(`👤 Test login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📚 Cours: GET http://localhost:${PORT}/api/courses`);
    console.log(`👥 Utilisateurs: GET http://localhost:${PORT}/api/users`);
    console.log('='.repeat(50));
    console.log(`🕐 Démarré à: ${new Date().toLocaleString('fr-FR')}`);
    console.log('='.repeat(50));
});
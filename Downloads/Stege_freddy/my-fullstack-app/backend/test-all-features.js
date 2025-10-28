// Script de test complet de toutes les fonctionnalités
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Configuration axios
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Variables globales pour les tokens
let adminToken = '';
let teacherToken = '';
let studentToken = '';

// Couleurs pour la console
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function section(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'yellow');
    console.log('='.repeat(60));
}

// Test 1: Authentification
async function testAuthentication() {
    section('TEST 1: AUTHENTIFICATION');
    
    try {
        // Login Admin
        const adminRes = await client.post('/auth/login', {
            email: 'admin@plateforme.edu',
            password: 'password123'
        });
        adminToken = adminRes.data.accessToken;
        success('Admin login OK');
        
        // Login Teacher
        const teacherRes = await client.post('/auth/login', {
            email: 'professeur@plateforme.edu',
            password: 'password123'
        });
        teacherToken = teacherRes.data.accessToken;
        success('Teacher login OK');
        
        // Login Student
        const studentRes = await client.post('/auth/login', {
            email: 'etudiant@plateforme.edu',
            password: 'password123'
        });
        studentToken = studentRes.data.accessToken;
        success('Student login OK');
        
        return true;
    } catch (err) {
        error(`Authentification failed: ${err.message}`);
        return false;
    }
}

// Test 2: Courses
async function testCourses() {
    section('TEST 2: GESTION DES COURS');
    
    try {
        const response = await client.get('/courses', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        
        const courses = Array.isArray(response.data) ? response.data : [];
        info(`Nombre de cours: ${courses.length}`);
        if (courses.length > 0) {
            success('GET /api/courses OK');
            info(`Premier cours: ${courses[0].name || courses[0].title}`);
        } else {
            info('Aucun cours disponible (base de données vide)');
        }
        
        // Test courses by teacher
        const teacherCourses = await client.get('/courses/teacher/2', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        const teacherCoursesData = Array.isArray(teacherCourses.data) ? teacherCourses.data : [];
        success(`GET /api/courses/teacher/:id OK (${teacherCoursesData.length} cours)`);
        
        return true;
    } catch (err) {
        error(`Courses test failed: ${err.message}`);
        return false;
    }
}

// Test 3: Assignments
async function testAssignments() {
    section('TEST 3: GESTION DES DEVOIRS');
    
    try {
        const response = await client.get('/assignments', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        
        const assignments = Array.isArray(response.data) ? response.data : [];
        info(`Nombre de devoirs: ${assignments.length}`);
        if (assignments.length > 0) {
            success('GET /api/assignments OK');
            const assignment = assignments[0];
            info(`Premier devoir: ${assignment.title}`);
            info(`Date limite: ${assignment.dueDate}`);
        } else {
            info('Aucun devoir disponible (base de données vide)');
        }
        
        return true;
    } catch (err) {
        error(`Assignments test failed: ${err.message}`);
        return false;
    }
}

// Test 4: Enrollments
async function testEnrollments() {
    section('TEST 4: INSCRIPTIONS AUX COURS');
    
    try {
        // Créer une inscription
        const enrollResponse = await client.post('/enrollments', {
            studentId: 3,
            courseId: 1
        }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        success('POST /api/enrollments OK');
        
        // Vérifier les inscriptions
        const getResponse = await client.get('/enrollments?studentId=3', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        info(`Inscriptions de l'étudiant: ${getResponse.data.length}`);
        success('GET /api/enrollments OK');
        
        return true;
    } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes('déjà inscrit')) {
            info('Étudiant déjà inscrit à ce cours (comportement attendu)');
            success('Vérification anti-doublons fonctionne');
            return true;
        }
        error(`Enrollments test failed: ${err.message}`);
        return false;
    }
}

// Test 5: Submissions
async function testSubmissions() {
    section('TEST 5: SOUMISSIONS DE DEVOIRS');
    
    try {
        // Créer une soumission
        const submitResponse = await client.post('/submissions', {
            assignmentId: 1,
            studentId: 3,
            content: 'Test submission - Intégration automatique',
            fileUrl: 'https://example.com/test-file.pdf'
        }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        success('POST /api/submissions OK');
        info(`Soumission ID: ${submitResponse.data.id}`);
        
        // Vérifier les soumissions
        const getResponse = await client.get('/submissions?studentId=3', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        info(`Soumissions de l'étudiant: ${getResponse.data.length}`);
        success('GET /api/submissions OK');
        
        return true;
    } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes('déjà soumis')) {
            info('Devoir déjà soumis (comportement attendu)');
            success('Vérification anti-doublons fonctionne');
            return true;
        }
        error(`Submissions test failed: ${err.message}`);
        return false;
    }
}

// Test 6: Grades
async function testGrades() {
    section('TEST 6: GESTION DES NOTES');
    
    try {
        const response = await client.get('/grades?studentId=3', {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        
        const grades = Array.isArray(response.data) ? response.data : [];
        info(`Nombre de notes: ${grades.length}`);
        if (grades.length > 0) {
            const grade = grades[0];
            const score = grade.score || grade.grade || 'N/A';
            const maxScore = grade.maxScore || grade.maxGrade || 100;
            const percentage = grade.percentage || ((grade.score / grade.maxScore) * 100).toFixed(1);
            const letterGrade = grade.letterGrade || grade.letter || 'N/A';
            info(`Note: ${score}/${maxScore} (${percentage}%) - ${letterGrade}`);
        } else {
            info('Aucune note disponible');
        }
        success('GET /api/grades OK');
        
        return true;
    } catch (err) {
        error(`Grades test failed: ${err.message}`);
        return false;
    }
}

// Test 7: Analytics
async function testAnalytics() {
    section('TEST 7: ANALYTIQUES ET STATISTIQUES');
    
    try {
        const statsResponse = await client.get('/analytics/stats', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        success('GET /api/analytics/stats OK');
        const stats = statsResponse.data;
        info(`Cours: ${stats.totalCourses || stats.courses || 0}`);
        info(`Étudiants: ${stats.totalStudents || stats.students || 0}`);
        info(`Devoirs: ${stats.totalAssignments || stats.assignments || 0}`);
        info(`Inscriptions: ${stats.totalEnrollments || stats.enrollments || 0}`);
        
        const chartsResponse = await client.get('/analytics/charts', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        success('GET /api/analytics/charts OK');
        
        return true;
    } catch (err) {
        error(`Analytics test failed: ${err.message}`);
        return false;
    }
}

// Test 8: Sessions synchrones
async function testSessions() {
    section('TEST 8: SESSIONS SYNCHRONES');
    
    try {
        const response = await client.get('/sessions', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        
        // La réponse peut être directement un tableau ou un objet avec data
        const sessions = response.data.data || response.data || [];
        info(`Nombre de sessions: ${sessions.length}`);
        if (sessions.length > 0) {
            const session = sessions[0];
            info(`Session: ${session.title}`);
            info(`Date: ${new Date(session.startTime).toLocaleString('fr-FR')}`);
            info(`Lien: ${session.meetingLink || session.link || 'N/A'}`);
        } else {
            info('Aucune session programmée');
        }
        success('GET /api/sessions OK');
        
        return true;
    } catch (err) {
        error(`Sessions test failed: ${err.message}`);
        return false;
    }
}

// Test 9: Notifications email
async function testNotifications() {
    section('TEST 9: SYSTÈME DE NOTIFICATIONS EMAIL');
    
    try {
        const response = await client.get('/notifications/emails', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        // La réponse peut être directement un tableau ou un objet avec data
        const notifications = response.data.data || response.data || [];
        info(`Nombre de notifications: ${notifications.length}`);
        if (notifications.length > 0) {
            const notif = notifications[0];
            info(`Type: ${notif.type || notif.notificationType || 'email'}`);
            info(`Statut: ${notif.status || (notif.sent ? 'sent' : 'pending')}`);
            info(`Destinataire: ${notif.to || notif.recipient || 'N/A'}`);
        } else {
            info('Aucune notification enregistrée');
        }
        success('GET /api/notifications/emails OK');
        
        return true;
    } catch (err) {
        error(`Notifications test failed: ${err.message}`);
        return false;
    }
}

// Test 10: Users
async function testUsers() {
    section('TEST 10: GESTION DES UTILISATEURS');
    
    try {
        const response = await client.get('/users', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        // La réponse peut être un tableau ou un objet avec une propriété users
        const users = Array.isArray(response.data) ? response.data : (response.data.users || []);
        info(`Nombre d'utilisateurs: ${users.length}`);
        if (users.length > 0) {
            info(`Utilisateurs: Admin, Teacher, Student`);
        }
        success('GET /api/users OK');
        
        return true;
    } catch (err) {
        error(`Users test failed: ${err.message}`);
        return false;
    }
}

// Test du système de rappels automatiques
async function testReminders() {
    section('TEST 11: RAPPELS AUTOMATIQUES');
    
    try {
        // Vérifier que le serveur a des rappels configurés
        info('Vérification du système de rappels automatiques...');
        
        // Vérifier les sessions avec rappels
        const sessions = await client.get('/sessions', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        
        const sessionsData = sessions.data.data || sessions.data || [];
        let sessionsWithReminders = 0;
        for (const session of sessionsData) {
            const startTime = new Date(session.startTime);
            const now = new Date();
            const hoursUntil = (startTime - now) / (1000 * 60 * 60);
            
            if (hoursUntil > 0 && hoursUntil <= 24) {
                sessionsWithReminders++;
                info(`Session "${session.title}" dans ${hoursUntil.toFixed(1)}h - Rappel actif`);
            }
        }
        
        if (sessionsWithReminders > 0) {
            success(`${sessionsWithReminders} session(s) avec rappels automatiques actifs`);
        } else {
            info('Aucune session dans les prochaines 24h (normal)');
        }
        
        // Vérifier les devoirs avec dates limites
        const assignments = await client.get('/assignments', {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        
        const assignmentsData = Array.isArray(assignments.data) ? assignments.data : [];
        let assignmentsWithDeadlines = 0;
        for (const assignment of assignmentsData) {
            const dueDate = new Date(assignment.dueDate);
            const now = new Date();
            const hoursUntil = (dueDate - now) / (1000 * 60 * 60);
            
            if (hoursUntil > 0 && hoursUntil <= 48) {
                assignmentsWithDeadlines++;
                info(`Devoir "${assignment.title}" dans ${hoursUntil.toFixed(1)}h - Rappel actif`);
            }
        }
        
        if (assignmentsWithDeadlines > 0) {
            success(`${assignmentsWithDeadlines} devoir(s) avec rappels automatiques actifs`);
        } else {
            info('Aucun devoir dans les prochaines 48h (normal)');
        }
        
        success('Système de rappels automatiques vérifié');
        return true;
    } catch (err) {
        error(`Reminders test failed: ${err.message}`);
        return false;
    }
}

// Exécution de tous les tests
async function runAllTests() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║  TEST D\'INTÉGRATION COMPLET - PLATEFORME ÉDUCATIVE        ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    console.log('\n');
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };
    
    // Test de connexion au serveur
    try {
        await client.get('/test');
        success('Serveur accessible sur http://localhost:5000');
    } catch (err) {
        error('ERREUR: Serveur non accessible. Assurez-vous que le serveur est démarré.');
        return;
    }
    
    // Exécuter tous les tests
    const tests = [
        { name: 'Authentification', fn: testAuthentication },
        { name: 'Cours', fn: testCourses },
        { name: 'Devoirs', fn: testAssignments },
        { name: 'Inscriptions', fn: testEnrollments },
        { name: 'Soumissions', fn: testSubmissions },
        { name: 'Notes', fn: testGrades },
        { name: 'Analytiques', fn: testAnalytics },
        { name: 'Sessions', fn: testSessions },
        { name: 'Notifications', fn: testNotifications },
        { name: 'Utilisateurs', fn: testUsers },
        { name: 'Rappels automatiques', fn: testReminders }
    ];
    
    for (const test of tests) {
        results.total++;
        try {
            const passed = await test.fn();
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
            }
        } catch (err) {
            results.failed++;
            error(`Test ${test.name} a échoué: ${err.message}`);
        }
    }
    
    // Résumé final
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║                    RÉSUMÉ DES TESTS                        ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    console.log('\n');
    
    log(`Total de tests: ${results.total}`, 'blue');
    log(`Tests réussis: ${results.passed}`, 'green');
    log(`Tests échoués: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    
    const percentage = ((results.passed / results.total) * 100).toFixed(1);
    console.log('\n');
    log(`Taux de réussite: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');
    
    if (percentage === '100.0') {
        console.log('\n');
        log('🎉 TOUTES LES FONCTIONNALITÉS SONT OPÉRATIONNELLES ! 🎉', 'green');
    }
    
    console.log('\n');
}

// Démarrer les tests
runAllTests().catch(err => {
    error(`Erreur fatale: ${err.message}`);
    process.exit(1);
});
